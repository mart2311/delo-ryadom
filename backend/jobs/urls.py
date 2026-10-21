from django.urls import path
from .views import (JobListCreateView, JobDetailView, MyJobsView,
                    JobApplicationCreateView, JobApplicationListView,
                    accept_application, reject_application,
                    ReviewCreateView, ReviewListView,
                    CategoryListView, MyApplicationsView, complete_job, rate_job,
                    get_my_application,
                    JobStageListCreateView, JobStageDetailView,
                    start_stage, complete_stage,
                    GuaranteeClaimListCreateView)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('jobs/', JobListCreateView.as_view(), name='job-list-create'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('jobs/my/', MyJobsView.as_view(), name='my-jobs'),
    path('jobs/<int:job_id>/my-application/', get_my_application, name='my-application'),
    path('applications/my/', MyApplicationsView.as_view(), name='my-applications'),
    path('applications/', JobApplicationCreateView.as_view(), name='application-create'),
    path('jobs/<int:job_id>/applications/', JobApplicationListView.as_view(), name='job-applications'),
    path('applications/<int:pk>/accept/', accept_application, name='accept-application'),
    path('applications/<int:pk>/reject/', reject_application, name='reject-application'),
    path('jobs/<int:pk>/complete/', complete_job, name='complete-job'),
    path('jobs/<int:pk>/rate/', rate_job, name='rate-job'),
    path('reviews/', ReviewCreateView.as_view(), name='review-create'),
    path('users/<int:user_id>/reviews/', ReviewListView.as_view(), name='user-reviews'),

    path('jobs/<int:job_id>/stages/', JobStageListCreateView.as_view(), name='job-stages'),
    path('stages/<int:pk>/', JobStageDetailView.as_view(), name='stage-detail'),
    path('stages/<int:pk>/start/', start_stage, name='stage-start'),
    path('stages/<int:pk>/complete/', complete_stage, name='stage-complete'),

    path('guarantee-claims/', GuaranteeClaimListCreateView.as_view(), name='guarantee-claims'),
]
