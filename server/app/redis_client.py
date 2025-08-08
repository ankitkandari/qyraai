import redis.asyncio as redis
import json
import numpy as np
from dotenv import load_dotenv
from google import genai
from typing import List, Dict, Any, Optional
import os
import logging
from datetime import datetime, timedelta
from app.models import RedisError, ClientConfig
from redis.commands.search.field import VectorField, TextField, TagField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from google.genai import types
from clerk_backend_api import Clerk

logger = logging.getLogger(__name__)

load_dotenv()


class RedisClient:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:7379")
        self.geminiClient = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
        self.redis = None
        # self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        self.vector_dim = 768

        if not self.clerk_secret_key:
            raise ValueError("CLERK_SECRET_KEY environment variable is required")

        self.clerk = Clerk(bearer_auth=self.clerk_secret_key)

    async def connect(self):
        """Initialize Redis connection and create indexes"""
        try:
            # self.redis = redis.from_url(self.redis_url, decode_responses=True)
            self.redis = redis.Redis(
                host=os.getenv("REDIS_HOST", ""),
                port=os.getenv("REDIS_PORT", ""),
                decode_responses=True,
                username=os.getenv("REDIS_USERNAME", ""),
                password=os.getenv("REDIS_PASSWORD", ""),
            )

            await self.redis.ping()
            await self.create_vector_index()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            raise RedisError(f"Failed to connect to Redis: {e}")

    async def close(self):
        """Properly close Redis connection"""
        if self.redis:
            # Close the main Redis connection
            await self.redis.close()
            self.redis = None
            logger.info("Redis connection close")

    # Messaging

    async def get_cached_response(self, key: str) -> Optional[str]:
        """Get cached AI response"""
        try:
            return await self.redis.get(f"cache:{key}")
        except Exception as e:
            logger.error(f"Failed to get cached response: {e}")
            return None

    async def track_cache_hit(self, client_id: str):
        """Track cache hit for analytics"""
        await self._increment_analytics(client_id, "cache_hits", 1)

    async def store_chat_message(
        self,
        client_id: str,
        session_id: str,
        message: str,
        response: str,
        response_time: float = 0.0,
        cached: bool = False,
    ):
        """Store chat message in unified analytics document"""
        try:
            # Store message in analytics stream (single source of truth)
            analytics_key = f"analytics:{client_id}"
            message_data = {
                "timestamp": datetime.now().isoformat(),
                "session_id": session_id,
                "message": message,
                "response": response,
                "response_time": str(response_time),
                "cached": "1" if cached else "0",
            }
            await self.redis.xadd(analytics_key, message_data)

            # Keep last 10000 messages (adjust as needed)
            await self.redis.xtrim(analytics_key, maxlen=10000)

            # Update client summary (lightweight counters)
            await self._update_client_summary(client_id, response_time, cached)

        except Exception as e:
            logger.error(f"Failed to store chat message: {e}")

    async def track_cache_miss(self, client_id: str):
        """Track cache miss for analytics"""
        await self._increment_analytics(client_id, "cache_misses", 1)

    async def semantic_search(
        self, client_id: str, query: str, top_k: int = 3
    ) -> List[str]:
        """Perform semantic search on stored chunks"""
        try:

            chunk_keys = await self.redis.keys(f"chunk:{client_id}:*")
            logger.info(f"Found {len(chunk_keys)} chunk keys for client {client_id}")

            if not chunk_keys:
                logger.warning(f"No chunks found for client {client_id}")
                return []

            # Generate query embedding
            # query_embedding = self.model.encode(query).astype(np.float32)

            # Generate query embedding with Google Gemini
            response = self.geminiClient.models.embed_content(
                model="gemini-embedding-001",
                contents=query,
                config=types.EmbedContentConfig(output_dimensionality=self.vector_dim),
            )

            query_embedding = np.array(response.embeddings[0].values, dtype=np.float32)

            # Use KNN search within the client's documents
            vector_query = (
                f"@client_id:{{{client_id}}}=>[KNN {top_k} @embedding $vec AS score]"
            )

            query_obj = (
                Query(vector_query)
                .return_fields("content", "score", "filename", "chunk_index", "file_id")
                .sort_by("score")
                .paging(0, top_k)
                .dialect(2)
            )

            results = await self.redis.ft("chunks_idx").search(
                query_obj, query_params={"vec": query_embedding.tobytes()}
            )

            # Extract content from results
            content_results = []
            for doc in results.docs:
                content_results.append(doc.content)

            return content_results

        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []

    async def cache_response(self, key: str, response: str, ttl: int = 3600):
        """Cache AI response"""
        try:
            await self.redis.setex(f"cache:{key}", ttl, response)
        except Exception as e:
            logger.error(f"Failed to cache response: {e}")

    async def get_chat_history(self, client_id: str, session_id: str, limit: int = 50):
        """Get chat history for a session from analytics stream, limited to 40,000 characters"""
        try:
            analytics_key = f"analytics:{client_id}"

            # Get messages from analytics stream for this specific session
            all_messages = await self.redis.xrevrange(
                analytics_key, count=limit * 3
            )  # Get more to filter

            if not all_messages:
                logger.info(
                    f"No chat history found for client {client_id}, session {session_id}"
                )
                return ""

            # Filter messages for this specific session
            session_messages = []
            for msg_id, message_data in all_messages:
                if message_data.get("session_id") == session_id:
                    session_messages.append((msg_id, message_data))
                    if len(session_messages) >= limit:
                        break

            if not session_messages:
                logger.info(f"No messages found for session {session_id}")
                return ""

            history_parts = []
            total_chars = 0
            char_limit = 40000

            # Process messages in chronological order (reverse the list since we got them in reverse)
            for _, message_data in reversed(session_messages):
                user_msg = message_data.get("message", "")
                ai_msg = message_data.get("response", "")
                timestamp = message_data.get("timestamp", "")

                # Format the entry with timestamp for better context
                entry = f"[{timestamp}]\nUser: {user_msg}\nAI: {ai_msg}\n\n"

                if total_chars + len(entry) > char_limit:
                    logger.warning(
                        f"Chat history for session {session_id} exceeds 40k character limit"
                    )
                    break

                history_parts.append(entry)
                total_chars += len(entry)

            history = "".join(history_parts)
            logger.info(
                f"Retrieved {len(session_messages)} messages ({total_chars} chars) for session {session_id}"
            )
            return history

        except Exception as e:
            logger.error(f"Failed to get chat history: {e}")
            return ""

    # Client

    async def get_client_config(self, client_id: str) -> Optional[ClientConfig]:
        """Get client configuration"""
        try:
            key = f"client:{client_id}:config"
            data = await self.redis.json().get(key)
            if data:
                return ClientConfig(**data)
            return None
        except Exception as e:
            raise RedisError(f"Failed to get client config: {e}")

    async def get_user(self, user_id: str) -> Optional[dict]:
        """Get user by user_id"""
        try:
            user_key = f"user:{user_id}"
            user_data = await self.redis.json().get(user_key)
            return user_data
        except Exception as e:
            logger.error(f"Failed to get user: {e}")
            return None

    async def store_client_config(self, config: ClientConfig):
        """Store client configuration"""
        try:
            key = f"client:{config.client_id}:config"
            await self.redis.json().set(key, "$", config.model_dump())
            # Set expiration to 30 days
            await self.redis.expire(key, 30 * 24 * 3600)
        except Exception as e:
            raise RedisError(f"Failed to store client config: {e}")

    async def publish_config_update(self, client_id: str, config: dict):
        """Publish configuration update via Pub/Sub"""
        try:
            channel = f"config_updates:{client_id}"
            await self.redis.publish(channel, json.dumps(config))
        except Exception as e:
            logger.error(f"Failed to publish config update: {e}")

    async def create_vector_index(self):
        """Create vector search index if it doesn't exist"""
        try:
            # Check if index exists
            try:
                await self.redis.ft("chunks_idx").info()
                logger.info("Vector index already exists")
                return  # Index already exists
            except:
                logger.info("Creating new vector index")

            # FIXED: Create proper vector index with correct field types
            fields = [
                TagField("client_id"),
                TextField(
                    "content"
                ),  # Changed from TagField to TextField for text search
                TextField("filename"),  # Add filename as searchable text field
                TextField("file_id"),  # Add file_id as text field
                VectorField(
                    "embedding",
                    "HNSW",
                    {
                        "TYPE": "FLOAT32",
                        "DIM": self.vector_dim,
                        "DISTANCE_METRIC": "COSINE",
                    },
                ),
            ]

            definition = IndexDefinition(prefix=["chunk:"], index_type=IndexType.HASH)

            await self.redis.ft("chunks_idx").create_index(
                fields=fields, definition=definition
            )
            logger.info("Vector index created successfully")

        except Exception as e:
            logger.error(f"Failed to create vector index: {e}")

    # User

    async def create_user(self, user_data: dict) -> str:
        """Create a new user and return unique client_id"""
        try:
            import uuid

            client_id = f"client_{uuid.uuid4().hex[:12]}"

            user = {
                "user_id": user_data["user_id"],
                "client_id": client_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "created_at": datetime.now().isoformat(),
                "onboarded": False,
            }

            # Store user data
            user_key = f"user:{user_data['user_id']}"
            await self.redis.json().set(user_key, "$", user)

            # Create reverse mapping client_id -> user_id
            await self.redis.set(f"client_mapping:{client_id}", user_data["user_id"])

            # Create default client config
            default_config = {
                "client_id": client_id,
                "name": user_data["name"],
                "theme": {
                    "primary_color": "#007bff",
                    "background_color": "#ffffff",
                    "text_color": "#333333",
                },
                "welcome_message": "Hello! How can I help you today?",
                "enabled": True,
                "rate_limit": 10,
            }

            config_key = f"client:{client_id}:config"
            await self.redis.json().set(config_key, "$", default_config)

            # Initialize analytics
            # await self._initialize_analytics(client_id)

            # Add metadata to clerk user
            clerk_user = self.clerk.users.update_metadata(
                user_id=user_data["user_id"],
                public_metadata={
                    "onboarded": False,
                },
            )

            logger.info(
                f"Created user {user_data['user_id']} with client_id {client_id}"
            )
            return client_id

        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            raise RedisError(f"Failed to create user: {e}")

    async def delete_user(self, user_id: str) -> bool:
        """Delete a user and all associated data, return True if user was found and deleted"""
        try:
            # First check if user exists
            user_key = f"user:{user_id}"
            user_exists = await self.redis.exists(user_key)

            if not user_exists:
                logger.warning(f"User {user_id} not found for deletion")
                return False

            # Get user data to find client_id
            user_data = await self.redis.json().get(user_key)
            if not user_data:
                logger.warning(f"User data not found for {user_id}")
                return False

            client_id = user_data.get("client_id")

            # Delete all user-related keys
            keys_to_delete = [
                user_key,  # Main user data
            ]

            # Add client mapping if client_id exists
            if client_id:
                keys_to_delete.extend(
                    [
                        f"client_mapping:{client_id}",  # Reverse mapping
                        f"client:{client_id}:config",  # Client config
                    ]
                )

                # Delete analytics data
                analytics_patterns = [
                    f"analytics:{client_id}",
                    f"client:{client_id}:sessions:*",
                    f"chunk:{client_id}:*",
                    f"cache:*{client_id}*",
                    f"file_counter:{client_id}",
                    f"files:{client_id}",
                    f"summary:{client_id}",
                    f"file:*{client_id}:*",
                ]

                # Find and add keys matching patterns
                for pattern in analytics_patterns:
                    matching_keys = await self.redis.keys(pattern)
                    keys_to_delete.extend(matching_keys)

            # Remove duplicates and filter out empty keys
            keys_to_delete = list(set(filter(None, keys_to_delete)))

            if keys_to_delete:
                # Delete all keys in a pipeline for efficiency
                pipe = self.redis.pipeline()
                for key in keys_to_delete:
                    pipe.delete(key)
                await pipe.execute()

                logger.info(
                    f"Deleted user {user_id} with client_id {client_id} and {len(keys_to_delete)} associated keys"
                )
            else:
                logger.info(f"No keys found to delete for user {user_id}")

            return True

        except Exception as e:
            logger.error(f"Failed to delete user {user_id}: {e}")
            raise RedisError(f"Failed to delete user: {e}")

    # Onboarding

    async def update_user_onboarding(self, user_id: str, onboarding_data: dict) -> bool:
        """Update user onboarding status and data"""
        try:
            user_key = f"user:{user_id}"

            # Update user data
            updates = {
                "onboarded": True,
                "company_name": onboarding_data.get("company_name"),
                "website": onboarding_data.get("website"),
                "use_case": onboarding_data.get("use_case"),
                "onboarded_at": datetime.now().isoformat(),
            }

            for key, value in updates.items():
                if value is not None:
                    await self.redis.json().set(user_key, f"$.{key}", value)

            # Update Clerk user metadata
            clerk_user = self.clerk.users.update_metadata(
                user_id=user_id,
                public_metadata={
                    "onboarded": True,
                },
            )

            logger.info(f"Updated onboarding for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to update user onboarding: {e}")
            return False

    # PDF

    async def store_chunks(
        self, client_id: str, chunks: List[str], filemeta: Dict[str, Any]
    ):
        """Store chunks and update file analytics"""
        try:
            file_id = await self.redis.incr(f"file_counter:{client_id}")

            # Store file metadata
            file_key = f"file:{client_id}:{file_id}"
            file_data = {
                "filename": filemeta.get("filename", "unknown"),
                "size": filemeta.get("size", 0),
                "num_pages": filemeta.get("num_pages", 0),
                "uploaded_at": datetime.now().isoformat(),
                "chunk_count": len(chunks),
            }
            await self.redis.hset(file_key, mapping=file_data)

            # Generate embeddings and store chunks
            # embeddings = self.model.encode(chunks)
            response = self.geminiClient.models.embed_content(
                model="gemini-embedding-001",
                contents=chunks,
                config=types.EmbedContentConfig(output_dimensionality=self.vector_dim),
            )

            embeddings = response.embeddings

            for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_key = f"chunk:{client_id}:{file_id}:{idx}"
                embedding_array = np.array(embedding.values, dtype=np.float32)
                chunk_data = {
                    "client_id": client_id,
                    "file_id": str(file_id),
                    "content": chunk,
                    "embedding": embedding_array.tobytes(),
                    "chunk_index": str(idx),
                    "total_chunks": str(len(chunks)),
                    "filename": filemeta.get("filename", "unknown"),
                }
                await self.redis.hset(chunk_key, mapping=chunk_data)

            await self.redis.sadd(f"files:{client_id}", file_id)

            # Update summary with file info
            await self._update_files_summary(
                client_id, len(chunks), filemeta.get("size", 0)
            )

            logger.info(
                f"Stored {len(chunks)} chunks for client {client_id}, file {file_id}"
            )
            return file_id

        except Exception as e:
            logger.error(f"Failed to store chunks: {e}")
            raise RedisError(f"Failed to store chunks: {e}")

    async def delete_file_chunks(self, client_id: str, filename: str) -> bool:
        """Delete all chunks for a specific file"""
        try:
            # Get all chunk keys for this client
            chunk_keys = await self.redis.keys(f"chunk:{client_id}:*")

            deleted_count = 0
            for chunk_key in chunk_keys:
                chunk_data = await self.redis.hgetall(chunk_key)
                if "filemeta" in chunk_data:
                    try:
                        filemeta = json.loads(chunk_data["filemeta"])
                        if filemeta.get("filename") == filename:
                            await self.redis.delete(chunk_key)
                            deleted_count += 1
                    except (json.JSONDecodeError, KeyError):
                        continue

            if deleted_count > 0:
                # Update analytics
                await self._increment_analytics(client_id, "files_uploaded", -1)
                await self._increment_analytics(
                    client_id, "chunks_stored", -deleted_count
                )
                logger.info(f"Deleted {deleted_count} chunks for file {filename}")

            return deleted_count > 0

        except Exception as e:
            logger.error(f"Failed to delete file chunks: {e}")
            return False

    # Analytics

    async def get_analytics(self, client_id: str) -> Dict[str, Any]:
        """Get comprehensive analytics from unified documents"""
        try:
            # Get summary data
            summary = await self.redis.json().get(f"summary:{client_id}") or {
                "total_messages": 0,
                "total_response_time": 0.0,
                "cache_hits": 0,
                "files_info": {"total_files": 0, "total_size": 0, "total_chunks": 0},
            }

            # Get recent messages from analytics stream
            analytics_key = f"analytics:{client_id}"

            # Get all messages (or last 1000 for performance)
            all_messages = await self.redis.xrevrange(analytics_key, count=1000)

            # Get file list
            files_list = await self.get_client_files(client_id)

            if not all_messages:
                return self._empty_analytics(files_list, summary)

            # Process messages for analytics
            sessions = {}
            daily_activity = {}
            daily_response_times = {}
            recent_sessions = []
            last_24h_count = 0
            cache_hits = 0

            now = datetime.now()
            yesterday = now - timedelta(hours=24)

            for msg_id, data in all_messages:
                timestamp_str = data.get("timestamp", "")
                session_id = data.get("session_id", "")
                response_time = float(data.get("response_time", 0))
                is_cached = data.get("cached", "0") == "1"

                try:
                    msg_time = datetime.fromisoformat(
                        timestamp_str.replace("Z", "+00:00")
                    )
                except:
                    continue

                # Count last 24h messages
                if msg_time >= yesterday:
                    last_24h_count += 1

                # Track cache hits
                if is_cached:
                    cache_hits += 1

                # Group by session
                if session_id not in sessions:
                    sessions[session_id] = {
                        "message_count": 0,
                        "total_response_time": 0.0,
                        "last_activity": msg_time,
                        "first_activity": msg_time,
                    }

                sessions[session_id]["message_count"] += 1
                sessions[session_id]["total_response_time"] += response_time
                if msg_time > sessions[session_id]["last_activity"]:
                    sessions[session_id]["last_activity"] = msg_time
                if msg_time < sessions[session_id]["first_activity"]:
                    sessions[session_id]["first_activity"] = msg_time

                # Daily activity
                date_key = msg_time.strftime("%Y-%m-%d")
                daily_activity[date_key] = daily_activity.get(date_key, 0) + 1

                # Daily response times
                if date_key not in daily_response_times:
                    daily_response_times[date_key] = []
                daily_response_times[date_key].append(response_time)

            # Calculate metrics
            total_messages = summary["total_messages"]
            unique_sessions = len(sessions)
            avg_response_time = (
                (summary["total_response_time"] / max(total_messages, 1))
                if total_messages > 0
                else 0
            )
            cache_efficiency = (
                (cache_hits / max(total_messages, 1)) * 100 if total_messages > 0 else 0
            )
            avg_messages_per_session = (
                total_messages / max(unique_sessions, 1) if unique_sessions > 0 else 0
            )

            # Recent sessions (last 10)
            recent_sessions = sorted(
                [(sid, data) for sid, data in sessions.items()],
                key=lambda x: x[1]["last_activity"],
                reverse=True,
            )[:10]

            # Daily activity chart data
            daily_chart = [
                {"date": date, "messages": count}
                for date, count in sorted(daily_activity.items())[-30:]  # Last 30 days
            ]

            # Daily response time chart
            response_time_chart = []
            for date, times in sorted(daily_response_times.items())[-30:]:
                avg_time = sum(times) / len(times)
                response_time_chart.append(
                    {
                        "date": date,
                        "avg_response_time": round(avg_time, 2),
                        "target": 200,  # 200ms target
                    }
                )

            return {
                # Basic metrics
                "total_messages": total_messages,
                "unique_sessions": unique_sessions,
                "avg_response_time": round(avg_response_time, 2),
                "last_24h_messages": last_24h_count,
                # Charts
                "daily_activity": daily_chart,
                "response_time_trend": response_time_chart,
                # Session analytics
                "recent_activity": [
                    {
                        "session_id": sid[:8] + "...",  # Shortened for privacy
                        "message_count": data["message_count"],
                        "avg_response_time": round(
                            data["total_response_time"] / data["message_count"], 2
                        ),
                        "last_activity": data["last_activity"].isoformat(),
                        "duration_minutes": int(
                            (
                                data["last_activity"] - data["first_activity"]
                            ).total_seconds()
                            / 60
                        ),
                    }
                    for sid, data in recent_sessions
                ],
                # Summary metrics
                "total_interactions": unique_sessions,
                "knowledge_base_size": summary["files_info"]["total_size"],
                "cache_efficiency": round(cache_efficiency, 1),
                "avg_messages_per_session": round(avg_messages_per_session, 1),
                "avg_response_time_per_session": round(avg_response_time, 2),
                # File metrics
                "total_files": summary["files_info"]["total_files"],
                "total_chunks": summary["files_info"]["total_chunks"],
                "files_list": files_list,
                # Additional useful metrics
                "peak_activity_day": (
                    max(daily_activity.items(), key=lambda x: x[1])[0]
                    if daily_activity
                    else None
                ),
                "busiest_hour": self._get_busiest_hour(all_messages),
                "avg_session_duration": self._calculate_avg_session_duration(sessions),
                "last_updated": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Failed to get analytics: {e}")
            return self._empty_analytics()

    async def get_client_files(self, client_id: str) -> List[Dict[str, Any]]:
        try:
            file_ids = await self.redis.smembers(f"files:{client_id}")
            files = []

            for file_id in file_ids:
                file_key = f"file:{client_id}:{file_id}"
                file_data = await self.redis.hgetall(file_key)
                if file_data:
                    files.append(
                        {
                            "file_id": file_id,
                            "filename": file_data.get("filename"),
                            "size": int(file_data.get("size", 0)),
                            "num_pages": int(file_data.get("num_pages", 0)),
                            "uploaded_at": file_data.get("uploaded_at"),
                            "chunk_count": int(file_data.get("chunk_count", 0)),
                        }
                    )

            return sorted(files, key=lambda x: int(x["file_id"]))

        except Exception as e:
            logger.error(f"Failed to get client files: {e}")
            return []

    async def _update_files_summary(
        self, client_id: str, chunks_added: int, file_size: int
    ):
        """Update file summary in client summary"""
        try:
            summary_key = f"summary:{client_id}"
            current = await self.redis.json().get(summary_key) or {
                "total_messages": 0,
                "total_response_time": 0.0,
                "cache_hits": 0,
                "last_updated": datetime.now().isoformat(),
                "files_info": {"total_files": 0, "total_size": 0, "total_chunks": 0},
            }

            current["files_info"]["total_files"] += 1
            current["files_info"]["total_size"] += file_size
            current["files_info"]["total_chunks"] += chunks_added
            current["last_updated"] = datetime.now().isoformat()

            await self.redis.json().set(summary_key, "$", current)

        except Exception as e:
            logger.error(f"Failed to update files summary: {e}")

    async def _update_client_summary(
        self, client_id: str, response_time: float, cached: bool = False
    ):
        """Update lightweight client summary"""
        try:
            summary_key = f"summary:{client_id}"

            # Get current summary
            current = await self.redis.json().get(summary_key) or {
                "total_messages": 0,
                "total_response_time": 0.0,
                "cache_hits": 0,
                "last_updated": datetime.now().isoformat(),
                "files_info": {"total_files": 0, "total_size": 0, "total_chunks": 0},
            }

            # Update counters
            current["total_messages"] += 1
            current["total_response_time"] += response_time
            if cached:
                current["cache_hits"] += 1
            current["last_updated"] = datetime.now().isoformat()

            await self.redis.json().set(summary_key, "$", current)

        except Exception as e:
            logger.error(f"Failed to update client summary: {e}")

    def _empty_analytics(self, files_list: List[Dict[str, Any]] = [],summary: Dict[str, Any] = None):
        """Return empty analytics structure"""
        return {
            "total_messages": 0,
            "unique_sessions": 0,
            "avg_response_time": 0.0,
            "last_24h_messages": 0,
            "daily_activity": [],
            "response_time_trend": [],
            "recent_activity": [],
            "total_interactions": 0,
            "knowledge_base_size": summary["files_info"]["total_size"] if summary else 0,
            "cache_efficiency": 0.0,
            "avg_messages_per_session": 0.0,
            "total_files": summary["files_info"]["total_files"] if summary else 0,
            "total_chunks": summary["files_info"]["total_chunks"] if summary else 0,
            "files_list": files_list,
            "last_updated": datetime.now().isoformat(),
        }

    def _get_busiest_hour(self, messages):
        """Find the busiest hour of the day"""
        try:
            hour_counts = {}
            for _, data in messages:
                try:
                    timestamp = datetime.fromisoformat(
                        data.get("timestamp", "").replace("Z", "+00:00")
                    )
                    hour = timestamp.hour
                    hour_counts[hour] = hour_counts.get(hour, 0) + 1
                except:
                    continue

            if not hour_counts:
                return None

            busiest_hour = max(hour_counts.items(), key=lambda x: x[1])[0]
            return f"{busiest_hour:02d}:00"
        except:
            return None

    def _calculate_avg_session_duration(self, sessions):
        """Calculate average session duration in minutes"""
        try:
            if not sessions:
                return 0.0

            total_duration = 0
            valid_sessions = 0

            for session_data in sessions.values():
                if (
                    session_data["message_count"] > 1
                ):  # Only count sessions with multiple messages
                    duration = (
                        session_data["last_activity"] - session_data["first_activity"]
                    ).total_seconds() / 60
                    total_duration += duration
                    valid_sessions += 1

            return round(total_duration / max(valid_sessions, 1), 1)
        except:
            return 0.0


# Global Redis client instance
redis_client = RedisClient()


async def init_redis():
    """Initialize Redis connection"""
    await redis_client.connect()


async def get_redis() -> RedisClient:
    """Dependency to get Redis client"""
    return redis_client


async def close_redis():
    """Properly close Redis connection"""
    await redis_client.close()
