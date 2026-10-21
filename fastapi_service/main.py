from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import json
from datetime import datetime
import httpx
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DJANGO_API_URL = os.getenv('DJANGO_API_URL', 'http://backend:8000')


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Dict[WebSocket, dict]] = {}

    async def connect(self, websocket: WebSocket, chat_id: int, user_id: int, token: Optional[str] = None):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = {}
        self.active_connections[chat_id][websocket] = {'user_id': user_id, 'token': token}

    def disconnect(self, websocket: WebSocket, chat_id: int):
        if chat_id in self.active_connections:
            if websocket in self.active_connections[chat_id]:
                meta = self.active_connections[chat_id][websocket]
                del self.active_connections[chat_id][websocket]
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]

    def get_user_id(self, websocket: WebSocket, chat_id: int) -> Optional[int]:
        if chat_id in self.active_connections:
            meta = self.active_connections[chat_id].get(websocket)
            if meta:
                return meta.get('user_id')
        return None

    def get_token(self, websocket: WebSocket, chat_id: int) -> Optional[str]:
        if chat_id in self.active_connections:
            meta = self.active_connections[chat_id].get(websocket)
            if meta:
                return meta.get('token')
        return None

    async def broadcast(self, message: dict, chat_id: int):
        if chat_id in self.active_connections:
            for connection in list(self.active_connections[chat_id].keys()):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def save_message_to_django(self, chat_id: int, content: str, token: Optional[str] = None):
        if not token:
            return None
        headers = {'Authorization': f'Bearer {token}'}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(
                    f'{DJANGO_API_URL}/api/messages/',
                    json={'chat_room': chat_id, 'content': content},
                    headers=headers,
                )
                if response.status_code >= 400:
                    return None
                return response.json()
            except Exception:
                return None


manager = ConnectionManager()


@app.get("/")
async def root():
    return {"message": "FastAPI WebSocket Service"}


@app.websocket("/ws/chat/{chat_id}")
async def websocket_endpoint(
        websocket: WebSocket,
        chat_id: int,
        user_id: Optional[int] = Query(None),
        token: Optional[str] = Query(None),
):
    if user_id is None:
        await websocket.close(code=1008, reason="user_id required")
        return

    await manager.connect(websocket, chat_id, user_id, token)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                continue

            sender_id = manager.get_user_id(websocket, chat_id) or message_data.get('user_id')
            sender_token = manager.get_token(websocket, chat_id) or message_data.get('token')

            content = (message_data.get('content') or '').strip()
            if not content or not sender_id:
                continue

            saved_message = await manager.save_message_to_django(chat_id, content, sender_token)

            broadcast_data = {
                'sender_id': sender_id,
                'content': content,
                'timestamp': (saved_message.get('created_at') if saved_message else datetime.now().isoformat()),
                'id': (saved_message.get('id') if saved_message else None),
            }

            await manager.broadcast(broadcast_data, chat_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, chat_id)
    except Exception:
        manager.disconnect(websocket, chat_id)
