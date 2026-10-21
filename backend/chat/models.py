from django.db import models
from django.contrib.auth import get_user_model
from jobs.models import Job

User = get_user_model()


class ChatRoom(models.Model):
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='chat_room')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_rooms'

    def __str__(self):
        return f"Чат для {self.job.title}"

    @property
    def last_message(self):
        return self.messages.last()


class ChatRoomMember(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'chat_room_members'
        unique_together = ('chat_room', 'user')

    def __str__(self):
        return f"{self.user.username} в {self.chat_room}"


class Message(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
