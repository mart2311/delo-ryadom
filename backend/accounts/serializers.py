from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ContractorProfile

User = get_user_model()


class ContractorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractorProfile
        fields = ['bio', 'experience_years', 'skills', 'hourly_rate',
                  'portfolio', 'rating', 'completed_jobs']


class UserSerializer(serializers.ModelSerializer):
    contractor_profile = ContractorProfileSerializer(required=False)
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'phone', 'avatar', 'telegram_username',
                  'contractor_profile', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']

    def update(self, instance, validated_data):
        contractor_data = validated_data.pop('contractor_profile', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if contractor_data and instance.role == 'contractor':
            profile, created = ContractorProfile.objects.get_or_create(user=instance)
            for attr, value in contractor_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class PublicUserSerializer(serializers.ModelSerializer):
    contractor_profile = ContractorProfileSerializer(read_only=True)
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email',
                  'phone', 'telegram_username', 'role', 'avatar',
                  'contractor_profile', 'date_joined', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    contractor_profile = ContractorProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name',
                  'last_name', 'role', 'phone', 'contractor_profile']

    def create(self, validated_data):
        contractor_data = validated_data.pop('contractor_profile', None)
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == 'contractor' and contractor_data:
            ContractorProfile.objects.create(user=user, **contractor_data)
        elif user.role == 'contractor':
            ContractorProfile.objects.create(user=user)

        return user
