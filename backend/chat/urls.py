from django.urls import path
from .views import (ChatRoomListCreateView, ChatRoomDetailView,
                    create_or_get_chat_by_job, MessageCreateView, mark_read)

urlpatterns = [
    path('chats/', ChatRoomListCreateView.as_view(), name='chat-list-create'),
    path('chats/<int:pk>/', ChatRoomDetailView.as_view(), name='chat-detail'),
    path('chats/<int:pk>/mark_read/', mark_read, name='chat-mark-read'),
    path('chats/job/<int:job_id>/', create_or_get_chat_by_job, name='create-chat-by-job'),
    path('messages/', MessageCreateView.as_view(), name='message-create'),
]
