from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (RegisterView, ProfileView, UserDetailView, upload_avatar,
                    UserJobsView, CurrentUserView, UserContractorJobsView,
                    UserCustomerJobsView)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('upload-avatar/', upload_avatar, name='upload-avatar'),
    path('users/me/', ProfileView.as_view(), name='user-profile'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/jobs/', UserJobsView.as_view(), name='user-jobs'),
    path('users/<int:user_id>/contractor-jobs/', UserContractorJobsView.as_view(), name='user-contractor-jobs'),
    path('users/<int:user_id>/customer-jobs/', UserCustomerJobsView.as_view(), name='user-customer-jobs'),
]
