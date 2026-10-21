from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination
from .models import Job, JobApplication, Review, Category, JobStage, GuaranteeClaim
from django.contrib.auth import get_user_model

User = get_user_model()


class ReviewPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 20


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']


class MinimalUserSerializer(serializers.ModelSerializer):
    contractor_rating = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'avatar', 'role', 'contractor_rating']

    def get_contractor_rating(self, obj):
        profile = getattr(obj, 'contractor_profile', None)
        if profile:
            return float(profile.rating)
        return None


class ContactUserSerializer(serializers.ModelSerializer):
    contractor_rating = serializers.SerializerMethodField()
    completed_jobs = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email',
                  'phone', 'telegram_username', 'avatar', 'role',
                  'contractor_rating', 'completed_jobs']

    def get_contractor_rating(self, obj):
        profile = getattr(obj, 'contractor_profile', None)
        if profile:
            return float(profile.rating)
        return None

    def get_completed_jobs(self, obj):
        profile = getattr(obj, 'contractor_profile', None)
        if profile:
            return profile.completed_jobs
        return None


class FullUserSerializer(serializers.ModelSerializer):
    from accounts.serializers import ContractorProfileSerializer
    contractor_profile = ContractorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email',
                  'phone', 'telegram_username', 'role', 'avatar',
                  'contractor_profile', 'date_joined']


class MinimalJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['id', 'title', 'status', 'price']


class JobStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobStage
        fields = ['id', 'job', 'order', 'title', 'description',
                  'planned_start', 'planned_end', 'estimated_hours',
                  'resources', 'responsible', 'status',
                  'actual_start', 'actual_end']
        read_only_fields = ['actual_start', 'actual_end']


class GuaranteeClaimSerializer(serializers.ModelSerializer):
    job = MinimalJobSerializer(read_only=True)
    customer = MinimalUserSerializer(read_only=True)

    class Meta:
        model = GuaranteeClaim
        fields = ['id', 'job', 'customer', 'description', 'status',
                  'created_at', 'resolved_at']
        read_only_fields = ['customer', 'status', 'resolved_at']


class JobSerializer(serializers.ModelSerializer):
    customer = ContactUserSerializer(read_only=True)
    contractor = ContactUserSerializer(read_only=True)
    category_details = CategorySerializer(source='category', read_only=True)
    applications_count = serializers.SerializerMethodField()
    stages = JobStageSerializer(many=True, read_only=True)
    guarantee_until = serializers.DateTimeField(read_only=True)
    stages_progress = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ['id', 'title', 'description', 'customer', 'category',
                  'category_details', 'price', 'latitude', 'longitude',
                  'address', 'status', 'contractor', 'created_at',
                  'updated_at', 'deadline', 'applications_count',
                  'payment_method', 'contractor_rating',
                  'is_extended', 'guarantee_days', 'guarantee_description',
                  'completed_at', 'guarantee_until', 'stages', 'stages_progress']
        read_only_fields = ['customer', 'contractor', 'status',
                            'contractor_rating', 'completed_at']

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_stages_progress(self, obj):
        stages = list(obj.stages.all())
        if not stages:
            return None
        done = sum(1 for s in stages if s.status == 'done')
        return {
            'total': len(stages),
            'done': done,
            'percent': round(done * 100 / len(stages))
        }


class JobApplicationSerializer(serializers.ModelSerializer):
    applicant = ContactUserSerializer(source='contractor', read_only=True)
    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all())

    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'applicant', 'message', 'proposed_price',
                  'status', 'created_at']
        read_only_fields = ['applicant', 'status']

    def create(self, validated_data):
        if not validated_data.get('proposed_price'):
            job = validated_data.get('job')
            validated_data['proposed_price'] = job.price
        return super().create(validated_data)


class JobApplicationDetailSerializer(serializers.ModelSerializer):
    applicant = ContactUserSerializer(source='contractor', read_only=True)
    job = JobSerializer(read_only=True)

    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'applicant', 'message', 'proposed_price',
                  'status', 'created_at']
        read_only_fields = ['applicant', 'status']


class ReviewSerializer(serializers.ModelSerializer):
    customer = MinimalUserSerializer(source='reviewer', read_only=True)
    contractor = MinimalUserSerializer(source='reviewee', read_only=True)
    job = MinimalJobSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'job', 'customer', 'contractor', 'rating',
                  'comment', 'created_at']
        read_only_fields = ['customer', 'contractor']
