from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from utils.supabase_client import supabase
import requests
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
import logging
import sys

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Environment variables
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_ANON_KEY"]
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
JWT_SECRET = os.environ.get("JWT_SECRET", "your_jwt_secret")
JWT_ALGORITHM = "HS256"


# Models
class TokenData(BaseModel):
    token: str

security = HTTPBearer()

    
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/google")
async def google_auth(token_data: TokenData):
    token = token_data.token
    try:
        # Step 1: Verify token with Google
        verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        try:
            verify_response = requests.get(verify_url, timeout=5)
            if verify_response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Token verification failed: {verify_response.text}"
                )
            user_info = verify_response.json()
            if not user_info.get("aud"):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid token: no audience"
                )
            if user_info.get("aud") != GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=400,
                    detail="Token audience mismatch."
                )
            # Step 2: Prepare user data
            user_data = {
                "google_id": user_info.get("sub"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "picture_url": user_info.get("picture"),
                "email_verified": user_info.get("email_verified"),
            }
            # Step 3: Save to Supabase
            try:
                existing_user = supabase.from_("users").select("*").eq("google_id", user_data["google_id"]).maybe_single().execute()
                if existing_user is None or existing_user.data is None:
                    supabase.from_("users").insert(user_data).execute()
                else:
                    logger.info(f"User {user_data['email']} already exists.")
                # Fetch the user ID from Supabase
                user_row = supabase.from_("users").select("*").eq("google_id", user_data["google_id"]).maybe_single().execute()
                user_id = user_row.data["id"] if user_row and user_row.data else None
                # Create JWT token
                payload = {
                    "google_id": user_data["google_id"],
                    "id": user_id,
                    "email": user_data["email"]
                }
                token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
                return {
                    "status": "success",
                    "user": user_data,
                    "token": token
                }
            except Exception as supabase_error:
                logger.error(f"Supabase operation failed: {str(supabase_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Database operation failed: {str(supabase_error)}"
                )
        except requests.RequestException as e:
            raise HTTPException(
                status_code=400,
                detail=f"Google token verification failed: {str(e)}"
            )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

