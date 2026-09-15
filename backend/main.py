import uvicorn
from fastapi import FastAPI

from src.routes.token import api_router
from src.routes.auth import auth_route

app = FastAPI(title="Home Assistant Backend")

app.include_router(auth_route)
app.include_router(api_router)


@app.get("/api/health")
def read_root():
    return {"status": "ok"}