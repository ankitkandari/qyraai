from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class RedisError(Exception):
    pass


class ChatMessage(BaseModel):
    message: str = Field(..., max_length=1000)
    client_id: str = Field(..., min_length=1)
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: datetime
    cached: bool = False


class PDFUpload(BaseModel):
    client_id: str
    filename: str
    content: bytes


class AnalyticsData(BaseModel):
    client_id: str
    total_messages: int
    unique_sessions: int
    avg_response_time: float
    last_24h_messages: int


class User(BaseModel):
    user_id: str  # Clerk user ID
    client_id: str  # Unique client ID for Redis
    email: str
    name: str
    created_at: datetime
    onboarded: bool = False

class ClientConfig(BaseModel):
    client_id: str
    name: str
    theme: Dict[str, Any] = Field(
        default_factory=lambda: {
            "primary_color": "#007bff",
            "background_color": "#ffffff",
            "text_color": "#333333",
        }
    )
    welcome_message: str = "Hello! How can I help you today?"
    enabled: bool = True
    rate_limit: int = 10

class OnboardingRequest(BaseModel):
    user_id: str
    company_name: Optional[str] = None
    website: Optional[str] = None
    use_case: Optional[str] = None

class OnboardingResponse(BaseModel):
    client_id: str
    message: str
    success: bool

class ClerkWebhookEvent(BaseModel):
    data: Dict[str, Any]
    object: str
    type: str
