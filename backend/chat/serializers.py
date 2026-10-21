from rest_framework import serializers
from .models import ChatRoom, Message, ChatRoomMember
from django.contrib.auth import get_user_model

User = get_user_model()


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


class MessageSerializer(serializers.ModelSerializer):
    sender = MinimalUserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'sender', 'content', 'created_at', 'is_read']
        read_only_fields = ['sender']


class ChatJobSerializer(serializers.ModelSerializer):
    from jobs.models import Job

    customer = ContactUserSerializer(read_only=True)
    contractor = ContactUserSerializer(read_only=True)

    class Meta:
        from jobs.models import Job
        model = Job
        fields = ['id', 'title', 'price', 'customer', 'contractor', 'status', 'payment_method',
                  'is_extended', 'guarantee_days', 'completed_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    job = ChatJobSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'job', 'created_at', 'updated_at', 'messages', 'last_message', 'unread_count']

    def get_last_message(self, obj):
        last_msg = obj.messages.select_related('sender').last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0

        user = request.user
        member = obj.members.filter(user=user).first()

        if not member or not member.last_read_at:
            return obj.messages.exclude(sender=user).count()

        return obj.messages.filter(
            created_at__gt=member.last_read_at
        ).exclude(sender=user).count()


class ChatRoomListSerializer(serializers.ModelSerializer):
    """Упрощенная версия для списка чатов без всех сообщений"""
    last_message = serializers.SerializerMethodField()
    job = ChatJobSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'job', 'created_at', 'updated_at', 'last_message', 'unread_count']

    def get_last_message(self, obj):
        last_msg = obj.messages.select_related('sender').last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0

        user = request.user
        member = obj.members.filter(user=user).first()

        if not member or not member.last_read_at:
            return obj.messages.exclude(sender=user).count()

        return obj.messages.filter(
            created_at__gt=member.last_read_at
        ).exclude(sender=user).count()
