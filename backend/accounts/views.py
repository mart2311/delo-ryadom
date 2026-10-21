from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, PublicUserSerializer

User = get_user_model()


class JobsPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.select_related('contractor_profile').all()
    serializer_class = PublicUserSerializer
    permission_classes = (IsAuthenticated,)


class UserJobsView(generics.ListAPIView):
    """Все заявки пользователя (как заказчик или исполнитель)"""
    permission_classes = (IsAuthenticated,)
    pagination_class = JobsPagination

    def get_queryset(self):
        from jobs.models import Job

        user_id = self.kwargs.get('user_id')

        jobs = Job.objects.filter(
            contractor_id=user_id
        ) | Job.objects.filter(
            customer_id=user_id
        )

        return jobs.select_related('customer', 'contractor', 'category').distinct().order_by('-created_at')

    def list(self, request, *args, **kwargs):
        from jobs.serializers import JobSerializer

        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = JobSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = JobSerializer(queryset, many=True)
        return Response(serializer.data)


class UserContractorJobsView(generics.ListAPIView):
    """Заявки где пользователь был исполнителем"""
    permission_classes = (IsAuthenticated,)
    pagination_class = JobsPagination

    def get_queryset(self):
        from jobs.models import Job

        user_id = self.kwargs.get('user_id')

        return Job.objects.filter(
            contractor_id=user_id
        ).select_related('customer', 'contractor', 'category').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        from jobs.serializers import JobSerializer

        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = JobSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = JobSerializer(queryset, many=True)
        return Response(serializer.data)


class UserCustomerJobsView(generics.ListAPIView):
    """Заявки где пользователь был заказчиком"""
    permission_classes = (IsAuthenticated,)
    pagination_class = JobsPagination

    def get_queryset(self):
        from jobs.models import Job

        user_id = self.kwargs.get('user_id')

        return Job.objects.filter(
            customer_id=user_id
        ).select_related('customer', 'contractor', 'category').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        from jobs.serializers import JobSerializer

        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = JobSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = JobSerializer(queryset, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    user = request.user
    if 'avatar' in request.FILES:
        user.avatar = request.FILES['avatar']
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)
    return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
