import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.routes import router, limiter
from app.redis_client import init_redis, close_redis
from app.models import RedisError
import logging

logging.basicConfig(level=logging.INFO)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_redis()
    except RedisError as e:
        print(f"Redis connection failed during startup: {e}")
        print("Application will continue without Redis functionality")
    yield
    # Shutdown
    print("Shutting down application...")
    await close_redis()
    pass

app = FastAPI(
    title="Redis AI Chatbot API",
    description="Production-ready AI chatbot with Redis vector search",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(router, prefix="/v1")

@app.get("/")
async def root():
    return {"message": "AI Chatbot API", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
