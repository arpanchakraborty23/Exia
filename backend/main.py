import uvicorn
from fastapi import FastAPI
from src.routes.token import api_router

app = FastAPI(title="Home Assistant Backend")

app.include_router(api_router)


@app.get("/")
def read_root():
    return {"status": "ok"}