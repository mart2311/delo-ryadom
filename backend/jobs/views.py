from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.db import IntegrityError
from django.utils import timezone
from .models import Job, JobApplication, Review, Category, JobStage, GuaranteeClaim
from .serializers import (JobSerializer, JobApplicationSerializer, JobApplicationDetailSerializer,
                          ReviewSerializer, CategorySerializer, ReviewPagination,
                          JobStageSerializer, GuaranteeClaimSerializer)


def recalculate_contractor_rating(contractor):
    ratings = Job.objects.filter(
        contractor=contractor,
        contractor_rating__isnull=False
    ).values_list('contractor_rating', flat=True)

    if ratings:
        avg_rating = sum(ratings) / len(ratings)
        contractor.contractor_profile.rating = round(avg_rating, 2)
        contractor.contractor_profile.save()


def _post_system_message(job, content):
    from chat.models import ChatRoom, Message

    chat_room = ChatRoom.objects.filter(job=job).first()
    if not chat_room or not job.customer:
        return
    Message.objects.create(
        chat_room=chat_room,
        sender=job.customer,
        content=content,
    )


JOBS_SELECT_RELATED = (
    'customer', 'contractor', 'category',
    'customer__contractor_profile', 'contractor__contractor_profile',
)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (IsAuthenticated,)


class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'address']

    def get_queryset(self):
        queryset = Job.objects.select_related(*JOBS_SELECT_RELATED).prefetch_related('stages').all()
        category = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status')
        is_extended = self.request.query_params.get('is_extended')

        if category:
            queryset = queryset.filter(category__slug=category)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if is_extended in ('true', '1'):
            queryset = queryset.filter(is_extended=True)
        if is_extended in ('false', '0'):
            queryset = queryset.filter(is_extended=False)

        return queryset

    def create(self, request, *args, **kwargs):
        stages_data = request.data.pop('stages', None) if hasattr(request.data, 'pop') else None
        if stages_data is None:
            stages_data = request.data.get('stages')

        response = super().create(request, *args, **kwargs)

        if response.status_code == status.HTTP_201_CREATED and stages_data:
            job = Job.objects.get(pk=response.data['id'])
            for index, stage in enumerate(stages_data):
                JobStage.objects.create(
                    job=job,
                    order=stage.get('order', index),
                    title=stage.get('title', ''),
                    description=stage.get('description', ''),
                    planned_start=stage.get('planned_start') or None,
                    planned_end=stage.get('planned_end') or None,
                    estimated_hours=stage.get('estimated_hours') or None,
                    resources=stage.get('resources', '') or '',
                    responsible=stage.get('responsible', 'contractor'),
                )
            response.data = JobSerializer(job).data

        return response

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.select_related(*JOBS_SELECT_RELATED).prefetch_related('stages').all()
    serializer_class = JobSerializer
    permission_classes = (IsAuthenticated,)


class MyJobsView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status')

        queryset = Job.objects.filter(customer=user).select_related(*JOBS_SELECT_RELATED).prefetch_related('stages')

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


class MyApplicationsView(generics.ListAPIView):
    serializer_class = JobApplicationDetailSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status')

        queryset = JobApplication.objects.filter(contractor=user).select_related(
            'contractor', 'contractor__contractor_profile',
            'job', 'job__customer', 'job__customer__contractor_profile',
            'job__contractor', 'job__contractor__contractor_profile',
            'job__category',
        ).prefetch_related('job__stages')

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


class JobApplicationCreateView(generics.CreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        try:
            serializer.save(contractor=self.request.user)
        except IntegrityError:
            raise

    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        existing = JobApplication.objects.filter(
            job_id=job_id,
            contractor=request.user
        ).first()

        if existing:
            return Response(
                {'error': 'Вы уже откликнулись на эту заявку'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)


class JobApplicationListView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        return JobApplication.objects.filter(job_id=job_id).select_related(
            'contractor', 'contractor__contractor_profile'
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_application(request, job_id):
    try:
        application = JobApplication.objects.select_related('contractor', 'job').get(
            job_id=job_id,
            contractor=request.user
        )
        serializer = JobApplicationSerializer(application)
        return Response(serializer.data)
    except JobApplication.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_application(request, pk):
    try:
        application = JobApplication.objects.select_related('job', 'contractor').get(pk=pk)
        job = application.job

        if job.customer != request.user:
            return Response({'error': 'У вас нет прав'},
                            status=status.HTTP_403_FORBIDDEN)

        application.status = 'accepted'
        application.save()

        job.contractor = application.contractor
        job.status = 'in_progress'
        job.save()

        JobApplication.objects.filter(job=job).exclude(pk=pk).update(status='rejected')

        from chat.models import ChatRoom, ChatRoomMember
        chat_room, created = ChatRoom.objects.get_or_create(job=job)
        if created:
            ChatRoomMember.objects.get_or_create(chat_room=chat_room, user=job.customer)
            ChatRoomMember.objects.get_or_create(chat_room=chat_room, user=job.contractor)

        return Response({
            'status': 'success',
            'chat_room_id': chat_room.id
        })
    except JobApplication.DoesNotExist:
        return Response({'error': 'Заявка не найдена'},
                        status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_application(request, pk):
    try:
        application = JobApplication.objects.select_related('job').get(pk=pk)
        if application.job.customer != request.user:
            return Response({'error': 'У вас нет прав'},
                            status=status.HTTP_403_FORBIDDEN)
        application.status = 'rejected'
        application.save()
        return Response({'status': 'success'})
    except JobApplication.DoesNotExist:
        return Response({'error': 'Отклик не найден'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_job(request, pk):
    try:
        job = Job.objects.select_related('contractor', 'contractor__contractor_profile', 'customer').get(pk=pk)

        if job.customer != request.user:
            return Response({'error': 'У вас нет прав'},
                            status=status.HTTP_403_FORBIDDEN)

        if job.status != 'in_progress':
            return Response({'error': 'Job is not in progress'},
                            status=status.HTTP_400_BAD_REQUEST)

        rating = request.data.get('rating')
        if not rating or not (1 <= int(rating) <= 5):
            return Response({'error': 'Rating must be between 1 and 5'},
                            status=status.HTTP_400_BAD_REQUEST)

        job.status = 'completed'
        job.contractor_rating = int(rating)
        job.completed_at = timezone.now()
        job.save()

        if job.contractor:
            contractor_profile = job.contractor.contractor_profile
            contractor_profile.completed_jobs += 1
            contractor_profile.save()
            recalculate_contractor_rating(job.contractor)

        comment = request.data.get('comment', '')
        review = None
        if job.contractor:
            review = Review.objects.create(
                job=job,
                reviewer=request.user,
                reviewee=job.contractor,
                rating=int(rating),
                comment=comment
            )

        return Response({
            'id': job.id,
            'status': 'completed',
            'review': ReviewSerializer(review).data if review else None
        })
    except Job.DoesNotExist:
        return Response({'error': 'Работа не найдена'},
                        status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_job(request, pk):
    try:
        job = Job.objects.select_related('contractor', 'contractor__contractor_profile').get(pk=pk)

        if job.customer != request.user:
            return Response({'error': 'У вас нет прав'},
                            status=status.HTTP_403_FORBIDDEN)

        if job.status != 'completed':
            return Response({'error': 'Job not completed'},
                            status=status.HTTP_400_BAD_REQUEST)

        rating = request.data.get('rating')
        if not rating or not (1 <= int(rating) <= 5):
            return Response({'error': 'Rating must be between 1 and 5'},
                            status=status.HTTP_400_BAD_REQUEST)

        job.contractor_rating = int(rating)
        job.save()

        if job.contractor:
            recalculate_contractor_rating(job.contractor)

        new_rating = job.contractor.contractor_profile.rating

        return Response({
            'message': 'Rating submitted',
            'new_rating': float(new_rating)
        })
    except Job.DoesNotExist:
        return Response({'error': 'Работа не найдена'},
                        status=status.HTTP_404_NOT_FOUND)


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class ReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = ReviewPagination

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Review.objects.filter(
            reviewee_id=user_id
        ).select_related(
            'reviewer', 'reviewee', 'job'
        ).order_by('-created_at')


class JobStageListCreateView(generics.ListCreateAPIView):
    serializer_class = JobStageSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        return JobStage.objects.filter(job_id=job_id)

    def perform_create(self, serializer):
        job_id = self.kwargs.get('job_id')
        job = Job.objects.get(pk=job_id)
        if job.customer != self.request.user:
            raise PermissionError('Только заказчик может добавлять этапы')
        serializer.save(job=job)


class JobStageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobStageSerializer
    permission_classes = (IsAuthenticated,)
    queryset = JobStage.objects.select_related('job', 'job__customer', 'job__contractor').all()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_stage(request, pk):
    try:
        stage = JobStage.objects.select_related('job', 'job__customer', 'job__contractor').get(pk=pk)
    except JobStage.DoesNotExist:
        return Response({'error': 'Этап не найден'}, status=status.HTTP_404_NOT_FOUND)

    job = stage.job
    if request.user not in (job.customer, job.contractor):
        return Response({'error': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)

    stage.status = 'in_progress'
    stage.actual_start = timezone.now()
    stage.save()

    _post_system_message(
        job,
        f'🚀 Этап «{stage.title}» начат пользователем {request.user.first_name or request.user.username}'
    )
    return Response(JobStageSerializer(stage).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_stage(request, pk):
    try:
        stage = JobStage.objects.select_related('job', 'job__customer', 'job__contractor').get(pk=pk)
    except JobStage.DoesNotExist:
        return Response({'error': 'Этап не найден'}, status=status.HTTP_404_NOT_FOUND)

    job = stage.job
    if request.user not in (job.customer, job.contractor):
        return Response({'error': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)

    stage.status = 'done'
    stage.actual_end = timezone.now()
    if not stage.actual_start:
        stage.actual_start = timezone.now()
    stage.save()

    _post_system_message(
        job,
        f'✅ Этап «{stage.title}» завершён пользователем {request.user.first_name or request.user.username}'
    )
    return Response(JobStageSerializer(stage).data)


class GuaranteeClaimListCreateView(generics.ListCreateAPIView):
    serializer_class = GuaranteeClaimSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return GuaranteeClaim.objects.filter(
            customer=user
        ).select_related('job', 'customer').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        description = request.data.get('description', '').strip()

        if not job_id or not description:
            return Response({'error': 'job и description обязательны'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Job.objects.select_related('customer', 'contractor').get(pk=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)

        if job.customer != request.user:
            return Response({'error': 'Только заказчик может обратиться по гарантии'},
                            status=status.HTTP_403_FORBIDDEN)

        if job.status != 'completed':
            return Response({'error': 'Заявка ещё не завершена'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not job.guarantee_days:
            return Response({'error': 'На эту заявку гарантия не распространяется'},
                            status=status.HTTP_400_BAD_REQUEST)

        until = job.guarantee_until
        if until and until < timezone.now():
            return Response({'error': 'Срок гарантии истёк'},
                            status=status.HTTP_400_BAD_REQUEST)

        claim = GuaranteeClaim.objects.create(
            job=job,
            customer=request.user,
            description=description,
        )

        _post_system_message(
            job,
            f'🛡 Обращение по гарантии: {description[:300]}'
        )

        return Response(GuaranteeClaimSerializer(claim).data, status=status.HTTP_201_CREATED)
