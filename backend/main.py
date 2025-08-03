from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from supabase import create_client, Client
import logging
import sys
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI()

# CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Environment variables
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_ANON_KEY"]
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
JWT_SECRET = os.environ.get("JWT_SECRET", "your_jwt_secret")
JWT_ALGORITHM = "HS256"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Models
class TokenData(BaseModel):
    token: str

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/auth/google")
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
     
# AS EMPLOYER API ENDPOINTS        
# Helper function to get as_emp_id
async def fetch_as_emp_id(user_id):
    try:
        emp_result = supabase.from_("as_employer").select("as_emp_id").eq("id", user_id).maybe_single().execute()
        if emp_result.data and "as_emp_id" in emp_result.data:
            return emp_result.data["as_emp_id"]
    except Exception as e:
        # Optional: log the error if needed
        logger.warning(f"fetch_as_emp_id failed: {str(e)}")
    
    # Do nothing if not found or error — return None
    return ""


@app.get("/api/employer/as_emp_id")
async def get_as_emp_id(user=Depends(get_current_user)):
    try:
        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        as_emp_id = await fetch_as_emp_id(user_id)
        if as_emp_id:
            return {"as_emp_id": as_emp_id}
        else:
            raise HTTPException(status_code=404, detail="Employer ID not found")
    except Exception as e:
        logger.error(f"Error fetching employer ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/employer/profile")
async def employer_profile(user=Depends(get_current_user)):
    try:
        user_id = user.get("id")
        user_result = supabase.from_("users").select("name, picture_url").eq("id", user_id).maybe_single().execute()
        name = user_result.data.get("name") if user_result.data else None
        picture_url = user_result.data.get("picture_url") if user_result.data else None
        as_emp_id = await fetch_as_emp_id(user_id)
        if name:
            return {"name": name, "picture_url": picture_url, "as_emp_id": as_emp_id}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Error fetching employer profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
# Check for existing employer account and save if not exists
@app.post("/api/save_as_employer")
async def check_or_create_employer(user=Depends(get_current_user)):
    try:
        user_id = user.get("id")

        # Check if already exists
        as_emp_id = await fetch_as_emp_id(user_id)

        if as_emp_id:
            return {"status": "exists", "as_emp_id": as_emp_id}

        # Insert new employer record
        response = supabase.from_("as_employer").insert({"id": user_id}).execute()

        if response.error:
            logger.error(f"Insertion error: {response.error}")
            raise HTTPException(status_code=500, detail="Failed to create employer account")

        return {"status": "created", "as_emp_id": response.data[0]["as_emp_id"]}
    except Exception as e:
        logger.error(f"Error checking or creating employer: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

class JobForm(BaseModel):
    category: str
    location: str
    duration_from: str
    duration_upto: str
    start_of_shift: str
    end_of_shift: str
    break_: Optional[float] = 0  # renamed because "break" is a Python keyword
    salary: float
    salary_condition: Optional[str] = ""
    short_desc: str
    long_desc: str

@app.post("/api/joblist")
async def save_job(form: JobForm, user=Depends(get_current_user)):
    try:
        user_id = user.get("id")

        # Get as_emp_id from as_employer table
        as_emp_id = await fetch_as_emp_id(user_id)

        job_data = {
            "category": form.category,
            "location": form.location,
            "duration_from": form.duration_from,
            "duration_upto": form.duration_upto,
            "start_of_shift": form.start_of_shift,
            "end_of_shift": form.end_of_shift,
            "break": form.break_,
            "salary": form.salary,
            "salary_condition": form.salary_condition,
            "short_desc": form.short_desc,
            "long_desc": form.long_desc,
            "as_emp_id": as_emp_id,
            "status": "active",  # Default status
        }

        response = supabase.from_("joblist").insert(job_data).execute()

        # ✅ Check if insertion returned data
        if not response.data:
            raise HTTPException(status_code=500, detail="Job insertion failed")

        return {"status": "success", "message": "Job saved successfully", "job": response.data}
    except Exception as e:
        logger.error(f"Error saving job: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/employer/jobs")
async def get_employer_jobs(user=Depends(get_current_user)):
    try:
        user_id = user.get("id")
        # Get as_emp_id
        as_emp_id = await fetch_as_emp_id(user_id)

        if not as_emp_id:
            raise HTTPException(status_code=404, detail="Employer ID not found")

        jobs_result = supabase.from_("joblist").select("id, category, short_desc, created_at, status").eq("as_emp_id", as_emp_id).execute()
        return {"jobs": jobs_result.data}
    except Exception as e:
        logger.error(f"Error fetching employer jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
@app.get("/api/joblist/{job_id}")
async def get_job_by_id(job_id: str, user=Depends(get_current_user)):
    try:
        user_id = user.get("id")
        as_emp_id = await fetch_as_emp_id(user_id)

        if not as_emp_id:
            raise HTTPException(status_code=403, detail="Access denied")

        job_result = supabase.from_("joblist").select("*").eq("id", job_id).eq("as_emp_id", as_emp_id).maybe_single().execute()
        if not job_result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        return {"job": job_result.data}
    except Exception as e:
        logger.error(f"Error fetching job by ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# AS PART-TIMER API ENDPOINTS
# Part-timer profile
async def fetch_as_prtmr_id(user_id):
    try:
        prtmr_result = supabase.from_("as_parttimer").select("as_prtmr_id").eq("id", user_id).maybe_single().execute()
        if prtmr_result.data and "as_prtmr_id" in prtmr_result.data:
            return prtmr_result.data["as_prtmr_id"]
    except Exception as e:
        # Optional: log the error if needed
        logger.warning(f"fetch_as_prtmr_id failed: {str(e)}")
    
    # Do nothing if not found or error — return None
    return ""

@app.get("/api/parttimer/as_prtmr_id")
async def get_as_prtmr_id(user=Depends(get_current_user)):
    try:
        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        as_prtmr_id = await fetch_as_prtmr_id(user_id)
        if as_prtmr_id:
            return {"as_prtmr_id": as_prtmr_id}
        else:
            raise HTTPException(status_code=404, detail="Part-Timer ID not found")
    except Exception as e:
        logger.error(f"Error fetching part-timer ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/parttimer/profile")
async def parttimer_profile(user=Depends(get_current_user)):
    try:
        user_id = user.get("id")
        user_result = supabase.from_("users").select("name, picture_url").eq("id", user_id).maybe_single().execute()
        name = user_result.data.get("name") if user_result.data else None
        picture_url = user_result.data.get("picture_url") if user_result.data else None
        as_prtmr_id = await fetch_as_prtmr_id(user_id)
        if name:
            return {"name": name, "picture_url": picture_url, "as_prtmr_id": as_prtmr_id}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Error fetching part-timer profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
# Check for existing employer account and save if not exists
@app.post("/api/save_as_prtmr")
async def check_or_create_prtmr(user=Depends(get_current_user)):
    try:
        user_id = user.get("id")

        # Check if already exists
        as_prtmr_id = await fetch_as_prtmr_id(user_id)

        if as_prtmr_id:
            return {"status": "exists", "as_prtmr_id": as_prtmr_id}

        # Insert new parttimer record
        response = supabase.from_("as_parttimer").insert({"id": user_id}).execute()

        if response.error:
            logger.error(f"Insertion error: {response.error}")
            raise HTTPException(status_code=500, detail="Failed to create part-timer account")

        return {"status": "created", "as_prtmr_id": response.data[0]["as_prtmr_id"]}
    except Exception as e:
        logger.error(f"Error checking or creating part-timer: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")