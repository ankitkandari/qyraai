import jwt
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer
import os
from dotenv import load_dotenv
from clerk_backend_api import Clerk
import requests
from app.redis_client import get_redis

load_dotenv()

security = HTTPBearer()


class ClerkAuth:
    def __init__(self):
        self.clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
        self.clerk_publishable_key = os.getenv("CLERK_PUBLISHABLE_KEY")
        self.jwks_url = os.getenv("CLERK_JWKS_URL")

        if not self.clerk_secret_key:
            raise ValueError("CLERK_SECRET_KEY environment variable is required")
        if not self.clerk_publishable_key:
            raise ValueError("CLERK_PUBLISHABLE_KEY environment variable is required")
        if not self.jwks_url:
            raise ValueError("CLERK_JWKS_URL environment variable is required")

        self.clerk = Clerk(bearer_auth=self.clerk_secret_key)
        self.jwks_cache = None
        self.jwks_cache_time = 0

    async def get_jwks(self):
        """Get Clerk's JWKS (JSON Web Key Set) for JWT verification"""
        import time

        current_time = time.time()

        if self.jwks_cache and (current_time - self.jwks_cache_time) < 3600:
            return self.jwks_cache

        try:
            response = requests.get(self.jwks_url)
            response.raise_for_status()

            self.jwks_cache = response.json()
            self.jwks_cache_time = current_time
            return self.jwks_cache
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to fetch JWKS: {str(e)}"
            )

    async def verify_jwt_token(self, request: Request) -> dict:
        """Verify JWT token from Authorization: Bearer header"""
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise HTTPException(
                    status_code=401, detail="Missing or invalid Authorization header"
                )

            token = auth_header.replace("Bearer ", "")

            # Get JWKS for verification
            jwks = await self.get_jwks()

            # Decode JWT header to get the key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")

            if not kid:
                raise HTTPException(status_code=401, detail="Token missing key ID")

            # Find the matching key in JWKS
            public_key = None
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break

            if not public_key:
                raise HTTPException(status_code=401, detail="Public key not found")

            # Verify and decode the JWT
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False},  # Clerk doesn't always include aud
            )

            # Extract user ID from payload
            user_id = payload.get("sub")  # 'sub' contains the Clerk user ID
            if not user_id:
                raise HTTPException(
                    status_code=401, detail="User ID not found in token"
                )

            # Get full user details from Clerk
            user = self.clerk.users.get(user_id=user_id)

            redis = await get_redis()
            client = await redis.get_user(user_id)

            return {
                "sub": user.id,  # Keep 'sub' for compatibility
                "user_id": user.id,
                "client_id": client["client_id"],
                "email": (
                    user.email_addresses[0].email_address
                    if user.email_addresses
                    else None
                ),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "session_id": payload.get("sid"),  # Session ID from JWT
                "payload": payload,  # Include full payload if needed
            }

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        except Exception as e:
            raise HTTPException(
                status_code=401, detail=f"JWT verification failed: {str(e)}"
            )

    async def get_user_by_id(self, user_id: str) -> dict:
        """Get user details by user ID"""
        try:
            user = self.clerk.users.get_user(user_id=user_id)
            return {
                "user_id": user.id,
                "email": (
                    user.email_addresses[0].email_address
                    if user.email_addresses
                    else None
                ),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"User not found: {str(e)}")


clerk_auth = ClerkAuth()


async def get_current_user(request: Request):
    """Get current user from JWT token in Authorization header"""
    return await clerk_auth.verify_jwt_token(request)

# NOT USED
async def verify_client_access(client_id: str, user_data: dict) -> bool:
    """Verify user has access to specific client"""
    user_id = user_data.get("user_id")
    return True
