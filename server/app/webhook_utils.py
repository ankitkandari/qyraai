import hashlib
import hmac
import json
import os
import base64
from typing import Dict, Any, Optional
from fastapi import HTTPException, Request
import logging

logger = logging.getLogger(__name__)


class WebhookVerifier:
    def __init__(self):
        self.webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
        if not self.webhook_secret:
            logger.warning("CLERK_WEBHOOK_SECRET not found in environment variables")

    async def verify_webhook(self, request: Request) -> Dict[str, Any]:
        """Verify Clerk webhook signature and return parsed data"""
        if not self.webhook_secret:
            raise HTTPException(status_code=500, detail="Webhook secret not configured")

        svix_id = request.headers.get("svix-id")
        svix_timestamp = request.headers.get("svix-timestamp")
        svix_signature = request.headers.get("svix-signature")

        if not all([svix_id, svix_timestamp, svix_signature]):
            raise HTTPException(
                status_code=400, detail="Missing required webhook headers"
            )

        body = await request.body()

        if not self._verify_signature(body, svix_id, svix_timestamp, svix_signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        try:
            return json.loads(body.decode())
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

    def _verify_signature(
        self, payload: bytes, svix_id: str, svix_timestamp: str, svix_signature: str
    ) -> bool:
        """Verify Svix webhook signature (used by Clerk)"""
        try:

            secret_bytes = base64.b64decode(self.webhook_secret.split("_")[1])

            signed_payload = f"{svix_id}.{svix_timestamp}.{payload.decode()}"

            expected_signature = hmac.new(
                secret_bytes, signed_payload.encode(), hashlib.sha256
            ).digest()

            signatures = svix_signature.split(" ")
            for sig in signatures:
                if sig.startswith("v1,"):
                    try:

                        provided_signature = base64.b64decode(sig[3:])
                        if hmac.compare_digest(expected_signature, provided_signature):
                            return True
                    except Exception as decode_error:
                        logger.error(f"Failed to decode signature: {decode_error}")
                        continue

            return False
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            return False

    def extract_user_data(
        self, webhook_data: Dict[str, Any]
    ) -> Optional[Dict[str, str]]:
        """Extract user data from Clerk webhook payload"""
        try:
            event_type = webhook_data.get("type")
            if event_type not in ["user.created", "user.deleted"]:
                return None

            user_data = webhook_data.get("data", {})
            user_id = user_data.get("id")

            if not user_id:
                logger.error("No user ID found in webhook data")
                return None

            if event_type == "user.deleted":
                return {
                    "user_id": user_id,
                    "event_type": event_type,
                    "email": None,
                    "name": None,
                }

            email_addresses = user_data.get("email_addresses", [])
            email = email_addresses[0].get("email_address")
            return {
                "user_id": user_id,
                "event_type": event_type,
                "email": email,
                "name": user_data.get("first_name") + " " + user_data.get("last_name"),
            }

        except Exception as e:
            logger.error(f"Failed to extract user data from webhook: {e}")
            return None


webhook_verifier = WebhookVerifier()
