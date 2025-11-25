from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import json
import os

STORE_PATH = os.path.join(os.path.dirname(__file__), 'mcp_store.json')


class ContextItem(BaseModel):
    id: str
    type: Optional[str] = None
    source: Optional[str] = None
    content: Dict[str, Any]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


def read_store() -> Dict[str, ContextItem]:
    if not os.path.exists(STORE_PATH):
        return {}
    with open(STORE_PATH, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    return raw


def write_store(store: Dict[str, Any]):
    with open(STORE_PATH, 'w', encoding='utf-8') as f:
        json.dump(store, f, indent=2, ensure_ascii=False)


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        data = json.dumps(message, default=str)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(data)
            except Exception:
                try:
                    await connection.close()
                except Exception:
                    pass
                self.disconnect(connection)


router = APIRouter()
manager = WebSocketManager()


@router.get('/contexts')
async def list_contexts(type: Optional[str] = None):
    store = read_store()
    items = list(store.values())
    if type:
        items = [i for i in items if i.get('type') == type]
    return items


@router.get('/contexts/{context_id}')
async def get_context(context_id: str):
    store = read_store()
    if context_id not in store:
        raise HTTPException(status_code=404, detail='Context not found')
    return store[context_id]


@router.post('/contexts')
async def create_or_update_context(item: ContextItem):
    store = read_store()
    now = datetime.utcnow().isoformat() + 'Z'
    existing = store.get(item.id)
    obj = item.dict()
    obj['created_at'] = existing.get('created_at') if existing else now
    obj['updated_at'] = now
    store[item.id] = obj
    write_store(store)
    # broadcast to subscribers
    await manager.broadcast({"event": "context_updated", "context": obj})
    return JSONResponse(status_code=200, content=obj)


@router.delete('/contexts/{context_id}')
async def delete_context(context_id: str):
    store = read_store()
    if context_id in store:
        del store[context_id]
        write_store(store)
        await manager.broadcast({"event": "context_deleted", "id": context_id})
        return {"ok": True}
    raise HTTPException(status_code=404, detail='Context not found')


@router.websocket('/mcp/ws')
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We simply echo messages for now or handle commands
            msg = await websocket.receive_text()
            # For now, just echo back what client sent
            await websocket.send_text(json.dumps({"event": "echo", "message": msg}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
