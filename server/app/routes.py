from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    WebSocket,
    Request,
)
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
import hashlib
import uuid
import time
from datetime import datetime
import PyPDF2
import io
from typing import List
from app.models import (
    ChatMessage,
    ChatResponse,
    ClientConfig,
    OnboardingRequest,
    OnboardingResponse,
)
from app.auth import get_current_user
from app.redis_client import get_redis, RedisClient
from app.utils import generate_ai_response
from app.webhook_utils import webhook_verifier
import logging

logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat_endpoint(request:Request,chat_message: ChatMessage, redis: RedisClient = Depends(get_redis)
):
    """Handle chat messages with semantic search and caching"""
    try:
        start_time = time.time()

        # Generate cache key
        cache_key = hashlib.md5(
            f"{chat_message.client_id}:{chat_message.message}".encode()
        ).hexdigest()

        session_id = chat_message.session_id or str(uuid.uuid4())

        # Check cache first
        # cached_response = await redis.get_cached_response(cache_key)
        # if cached_response:
        #     # Track cache hit
        #     # await redis.track_cache_hit(chat_message.client_id)
        #
        #     response_time = time.time() - start_time
        #
        #     # Store in session history even for cached responses
        #     await redis.store_chat_message(
        #         chat_message.client_id,
        #         session_id,
        #         chat_message.message,
        #         cached_response,
        #         response_time,
        #     )
        #
        #     return ChatResponse(
        #         response=cached_response,
        #         session_id=session_id,
        #         timestamp=datetime.now(),
        #         cached=True,
        #     )

        # Track cache miss
        # await redis.track_cache_miss(chat_message.client_id)

        # Get client config
        config = await redis.get_client_config(chat_message.client_id)
        if not config or not config.enabled:
            raise HTTPException(status_code=404, detail="Client not found or disabled")

        # Perform semantic search
        relevant_chunks = await redis.semantic_search(
            chat_message.client_id, chat_message.message
        )

        # Generate AI response
        if not relevant_chunks:
            await redis.cache_response(
                cache_key,
                "No relevant information found. Please upload more documents.",
            )
            return ChatResponse(
                response="No relevant information found. Please upload more documents.",
                session_id=session_id,
                timestamp=datetime.now(),
                cached=False,
            )

        # Add Chat memory in context
        memory = await redis.get_chat_history(chat_message.client_id, session_id)
        context = "Here is the current chat history:\n" + (memory or "")

        if relevant_chunks:
            context += "\n\nRelevant context:\n" + "\n".join(relevant_chunks)

            print(context)
        print(memory)

        ai_response = await generate_ai_response(
            chat_message.message, context, config.welcome_message
        )

        # Calculate response time
        response_time = time.time() - start_time

        # Cache response
        await redis.cache_response(cache_key, ai_response)

        # Store in session history with response time
        await redis.store_chat_message(
            chat_message.client_id,
            session_id,
            chat_message.message,
            ai_response,
            response_time,
        )

        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            timestamp=datetime.now(),
            cached=False,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.get("/config/{client_id}")
async def get_config(client_id: str, redis: RedisClient = Depends(get_redis)):
    """Get client configuration (public endpoint for widget)"""
    config = await redis.get_client_config(client_id)
    if not config:
        raise HTTPException(status_code=404, detail="Client not found")

    return {
        "theme": config.theme,
        "welcome_message": config.welcome_message,
        "enabled": config.enabled,
    }


@router.get("/config")
async def get_config_authenticated(
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Get client configuration for dashboard (authenticated)"""
    user = await redis.get_user(user_data["sub"])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    config = await redis.get_client_config(user["client_id"])

    if not config:
        raise HTTPException(status_code=404, detail="Client not found")

    return config


@router.post("/config")
async def update_config(
    config: ClientConfig,
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Update client configuration (authenticated)"""

    await redis.store_client_config(config)
    await redis.publish_config_update(user_data["client_id"], config.model_dump())

    return {"message": "Configuration updated successfully"}


# NOT USED
@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Upload and process PDF file"""
    # Get user to find client_id
    user = await redis.get_user(user_data["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        # Read PDF content
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))

        # Extract text chunks
        chunks = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            # Split into chunks of ~500 characters
            chunk_size = 500
            for i in range(0, len(text), chunk_size):
                chunk = text[i : i + chunk_size].strip()
                if chunk:
                    chunks.append(chunk)

        if not chunks:
            raise HTTPException(status_code=400, detail="No text content found in PDF")

        filemeta = {
            "filename": file.filename,
            "size": len(content),
            "num_pages": len(pdf_reader.pages),
            "uploaded_at": datetime.now().isoformat(),
        }

        # Store chunks with embeddings (this will also update analytics)
        await redis.store_chunks(user["client_id"], chunks, filemeta)

        return {
            "message": f"PDF processed successfully. {len(chunks)} chunks stored.",
            "filename": file.filename,
            "chunks_count": len(chunks),
            "pages": len(pdf_reader.pages),
            "file_size": len(content),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")


@router.get("/analytics")
async def get_analytics(
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Get comprehensive analytics data for client"""
    try:
        # Get user to find client_id
        user = await redis.get_user(user_data["sub"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        analytics = await redis.get_analytics(user["client_id"])

        # Add user context to analytics
        analytics["client_info"] = {
            "client_id": user["client_id"],
            "user_name": user["name"],
            "created_at": user["created_at"],
            "onboarded": user.get("onboarded", False),
        }

        return analytics

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get analytics: {str(e)}"
        )


@router.get("/analytics/export")
async def export_analytics(
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Export analytics data as JSON for external analysis"""
    try:
        user = await redis.get_user(user_data["sub"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        analytics = await redis.get_analytics(user["client_id"])

        # Add export metadata
        analytics["export_info"] = {
            "exported_at": datetime.now().isoformat(),
            "exported_by": user["name"],
            "client_id": user["client_id"],
        }

        return JSONResponse(
            content=analytics,
            headers={
                "Content-Disposition": f"attachment; filename=analytics_{user['client_id']}_{datetime.now().strftime('%Y%m%d')}.json"
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to export analytics: {str(e)}"
        )


@router.websocket("/realtime/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket, client_id: str, redis: RedisClient = Depends(get_redis)
):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()

    pubsub = redis.redis.pubsub()
    await pubsub.subscribe(f"config_updates:{client_id}")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"])
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await pubsub.close()
        await websocket.close()


@router.post("/webhooks/clerk")
async def clerk_webhook(
    request: Request,
    redis: RedisClient = Depends(get_redis),
):
    """Handle Clerk webhooks for user creation/updates/deletion"""
    try:
        print("Received webhook")
        webhook_data = await webhook_verifier.verify_webhook(request)

        user_data = webhook_verifier.extract_user_data(webhook_data)
        if not user_data:
            return {"message": "Event not handled"}

        event_type = user_data["event_type"]

        # Handle user.created event
        if event_type == "user.created":

            existing_user = await redis.get_user(user_data["user_id"])
            if existing_user:
                return {"message": "User already exists"}

            client_id = await redis.create_user(user_data)

            return {
                "message": "User created successfully",
                "client_id": client_id,
                "user_id": user_data["user_id"],
            }

        # Handle user.deleted event
        elif event_type == "user.deleted":

            deleted = await redis.delete_user(user_data["user_id"])

            if deleted:
                return {
                    "message": "User deleted successfully",
                    "user_id": user_data["user_id"],
                }
            else:
                return {
                    "message": "User not found for deletion",
                    "user_id": user_data["user_id"],
                }

        return {"message": "Event processed"}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Webhook processing failed: {str(e)}"
        )


@router.get("/user/status")
async def get_user_status(
    user_data: dict = Depends(get_current_user), redis: RedisClient = Depends(get_redis)
):
    """Get current user status and onboarding state"""
    try:

        user = await redis.get_user(user_data["sub"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "user_id": user["user_id"],
            "client_id": user["client_id"],
            "onboarded": user.get("onboarded", False),
            "created_at": user["created_at"],
            "name": user["name"],
            "email": user["email"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get user status: {str(e)}"
        )


@router.post("/onboarding", response_model=OnboardingResponse)
async def complete_onboarding(
    onboarding_data: OnboardingRequest,
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Complete user onboarding process"""
    try:
        user_id = user_data["sub"]  # Clerk user ID

        # Verify this is the correct user
        if onboarding_data.user_id != user_id:
            raise HTTPException(status_code=403, detail="User ID mismatch")

        # Get user data
        user = await redis.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.get("onboarded", False):
            return OnboardingResponse(
                client_id=user["client_id"],
                message="User already onboarded",
                success=True,
            )

        # Update onboarding status in Redis
        success = await redis.update_user_onboarding(
            user_id, onboarding_data.model_dump()
        )

        if success:
            # TODO: Update Clerk user metadata
            # This would require Clerk management API call

            return OnboardingResponse(
                client_id=user["client_id"],
                message="Onboarding completed successfully",
                success=True,
            )
        else:
            raise HTTPException(
                status_code=500, detail="Failed to update onboarding status"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Onboarding failed: {str(e)}")

# NOT USED
@router.get("/files")
async def get_files(
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Get list of all uploaded files for the user"""
    try:
        user = await redis.get_user(user_data["sub"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        files = await redis.get_client_files(user["client_id"])

        return {
            "files": files,
            "total_files": len(files),
            "total_chunks": sum(f["chunk_count"] for f in files),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get files: {str(e)}")


# NOT USED
@router.delete("/files/{filename}")
async def delete_file(
    filename: str,
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Delete a specific file and all its chunks"""
    try:
        user = await redis.get_user(user_data["sub"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # URL decode the filename
        import urllib.parse

        filename = urllib.parse.unquote(filename)

        deleted = await redis.delete_file_chunks(user["client_id"], filename)

        if deleted:
            return {"message": f"File '{filename}' deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.post("/upload/multiple")
async def upload_multiple_pdfs(
    files: List[UploadFile] = File(...),
    user_data: dict = Depends(get_current_user),
    redis: RedisClient = Depends(get_redis),
):
    """Upload and process multiple PDF files"""
    user = await redis.get_user(user_data["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    results = []
    total_chunks = 0

    for file in files:
        if not file.filename.endswith(".pdf"):
            results.append(
                {
                    "filename": file.filename,
                    "status": "error",
                    "message": "Only PDF files are allowed",
                }
            )
            continue

        try:
            # Read PDF content
            content = await file.read()
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))

            # Extract text chunks
            chunks = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                # Split into chunks of ~500 characters
                chunk_size = 500
                for i in range(0, len(text), chunk_size):
                    chunk = text[i : i + chunk_size].strip()
                    if chunk:
                        chunks.append(chunk)

            if not chunks:
                results.append(
                    {
                        "filename": file.filename,
                        "status": "error",
                        "message": "No text content found in PDF",
                    }
                )
                continue

            filemeta = {
                "filename": file.filename,
                "size": len(content),
                "num_pages": len(pdf_reader.pages),
                "uploaded_at": datetime.now().isoformat(),
            }

            # Store chunks with embeddings
            file_id = await redis.store_chunks(user["client_id"], chunks, filemeta)
            total_chunks += len(chunks)

            results.append(
                {
                    "filename": file.filename,
                    "status": "success",
                    "file_id": file_id,
                    "chunks_count": len(chunks),
                    "pages": len(pdf_reader.pages),
                    "file_size": len(content),
                }
            )

        except Exception as e:
            results.append(
                {
                    "filename": file.filename,
                    "status": "error",
                    "message": f"Processing failed: {str(e)}",
                }
            )

    successful_uploads = len([r for r in results if r["status"] == "success"])

    return {
        "message": f"Processed {len(files)} files. {successful_uploads} successful, {len(files) - successful_uploads} failed.",
        "total_chunks_added": total_chunks,
        "results": results,
    }
