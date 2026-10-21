from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Max, Prefetch
from django.utils import timezone
from .models import ChatRoom, Message, ChatRoomMember
from .serializers import ChatRoomSerializer, ChatRoomListSerializer, MessageSerializer


class ChatRoomListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ChatRoomSerializer
        return ChatRoomListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user

        last_message_prefetch = Prefetch(
            'messages',
            queryset=Message.objects.select_related('sender').order_by('-created_at')[:1],
            to_attr='last_messages'
        )

        members_prefetch = Prefetch(
            'members',
            queryset=ChatRoomMember.objects.filter(user=user),
            to_attr='current_user_member'
        )

        return (ChatRoom.objects.filter(
            job__customer=user
        ) | ChatRoom.objects.filter(
            job__contractor=user
        )).select_related(
            'job',
            'job__customer',
            'job__contractor'
        ).prefetch_related(
            last_message_prefetch,
            members_prefetch,
            'messages'
        ).annotate(
            last_msg_time=Max('messages__created_at')
        ).order_by('-last_msg_time').distinct()

    def create(self, request, *args, **kwargs):
        from jobs.models import Job

        job_id = request.data.get('job')

        if not job_id:
            return Response({'error': 'job is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Job.objects.select_related('customer', 'contractor').get(pk=job_id)

            if request.user != job.customer and request.user != job.contractor:
                return Response({'error': 'У вас нет прав для создания чата по этой заявке'},
                                status=status.HTTP_403_FORBIDDEN)

            chat_room, created = ChatRoom.objects.get_or_create(job=job)

            if created:
                ChatRoomMember.objects.get_or_create(chat_room=chat_room, user=job.customer)
                if job.contractor:
                    ChatRoomMember.objects.get_or_create(chat_room=chat_room, user=job.contractor)

            serializer = ChatRoomSerializer(chat_room, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Job.DoesNotExist:
            return Response({'error': 'Работа не найдена'}, status=status.HTTP_404_NOT_FOUND)


class ChatRoomDetailView(generics.RetrieveAPIView):
    queryset = ChatRoom.objects.select_related(
        'job',
        'job__customer',
        'job__contractor'
    ).prefetch_related(
        Prefetch('messages', queryset=Message.objects.select_related('sender'))
    ).all()
    serializer_class = ChatRoomSerializer
    permission_classes = (IsAuthenticated,)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    try:
        chat_room = ChatRoom.objects.get(pk=pk)

        if request.user != chat_room.job.customer and request.user != chat_room.job.contractor:
            return Response({'error': 'У вас нет доступа к этому чату'},
                            status=status.HTTP_403_FORBIDDEN)

        member, created = ChatRoomMember.objects.get_or_create(
            chat_room=chat_room,
            user=request.user
        )
        member.last_read_at = timezone.now()
        member.save()

        return Response({
            'status': 'ok',
            'unread_count': 0
        })
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Чат не найден'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_or_get_chat_by_job(request, job_id):
    from jobs.models import Job

    try:
        job = Job.objects.select_related('customer', 'contractor').get(pk=job_id)
        chat_room, created = ChatRoom.objects.get_or_create(job=job)

        if created:
            ChatRoomMember.objects.get_or_create(chat_room=chat_room, user=job.customer)
            if job.contractor:
                ChatRoomMember.objects.get_or_create(chat_room=chat_room, user=job.contractor)

        serializer = ChatRoomSerializer(chat_room, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Job.DoesNotExist:
        return Response({'error': 'Работа не найдена'},
                        status=status.HTTP_404_NOT_FOUND)


class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = (IsAuthenticated,)

    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        chat_room_id = request.data.get('chat_room')

        if job_id and not chat_room_id:
            from jobs.models import Job
            try:
                job = Job.objects.get(pk=job_id)
                chat_room = ChatRoom.objects.get(job=job)

                message = Message.objects.create(
                    chat_room=chat_room,
                    sender=request.user,
                    content=request.data.get('content', '')
                )

                chat_room.save()

                serializer = MessageSerializer(message)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except (Job.DoesNotExist, ChatRoom.DoesNotExist):
                return Response({'error': 'Чат не найден'}, status=status.HTTP_404_NOT_FOUND)

        response = super().create(request, *args, **kwargs)

        if chat_room_id:
            try:
                chat_room = ChatRoom.objects.get(pk=chat_room_id)
                chat_room.save()
            except ChatRoom.DoesNotExist:
                pass

        return response

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
