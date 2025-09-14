# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles 
from typing import List

app = FastAPI()

# Mount the "static" directory to serve CSS and JS files --- IGNORE ---
app.mount("/static", StaticFiles(directory="static"), name="static")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

#This endpoint serves main HTML page
@app.get("/")
async def get_page():
    with open("index.html", "r") as f:
        return HTMLResponse(f.read())

#This endpoint handles chat communication
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    print(f"Client #{client_id} connected.")
    await manager.broadcast(f"Client #{client_id} has joined the chat.")
    
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client #{client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client #{client_id} disconnected.")
        await manager.broadcast(f"Client #{client_id} has left the chat.")