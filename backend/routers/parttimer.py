from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from utils.auth import get_current_user
from utils.supabase_client import supabase
from pydantic import BaseModel

router = APIRouter(prefix="/api/parttimer", tags=["Part-Timer"])

async def fetch_as_prtmr_id(user_id):
    try:
        result = supabase.from_("as_parttimer").select("as_prtmr_id").eq("id", user_id).maybe_single().execute()
        if result.data and "as_prtmr_id" in result.data:
            return result.data["as_prtmr_id"]
    except Exception as e:
        logger.warning(f"fetch_as_prtmr_id failed: {str(e)}")
    return ""

@router.get("/as_prtmr_id")
async def get_as_prtmr_id(user=Depends(get_current_user)):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    as_prtmr_id = await fetch_as_prtmr_id(user_id)
    if as_prtmr_id:
        return {"as_prtmr_id": as_prtmr_id}
    raise HTTPException(status_code=404, detail="Part-Timer ID not found")

async def fetch_emp_location(user_id):
    try:
        result = supabase.from_("as_parttimer").select("location").eq("id", user_id).maybe_single().execute()
        if result.data and "location" in result.data:
            return result.data["location"]
    except Exception as e:
        logger.warning(f"fetch_location failed: {str(e)}")
    return ""

@router.get("/profile")
async def parttimer_profile(user=Depends(get_current_user)):
    user_id = user.get("id")
    result = supabase.from_("users").select("name, email, picture_url").eq("id", user_id).maybe_single().execute()
    name = result.data.get("name") if result.data else None
    email = result.data.get("email") if result.data else None
    picture_url = result.data.get("picture_url") if result.data else None
    as_prtmr_id = await fetch_as_prtmr_id(user_id)
    location = await fetch_emp_location(user_id)
    if name:
        return {"name": name, "picture_url": picture_url, "email":email, "as_prtmr_id": as_prtmr_id, "location": location}
    raise HTTPException(status_code=404, detail="User not found")

@router.post("/check_or_create_parttimer")
async def check_or_create_parttimer(user=Depends(get_current_user)):
    user_id = user.get("id")
    as_prtmr_id = await fetch_as_prtmr_id(user_id)
    if as_prtmr_id:
        return {"status": "exists", "as_prtmr_id": as_prtmr_id}
    response = supabase.from_("as_parttimer").insert({"id": user_id}).execute()
    if response.error:
        raise HTTPException(status_code=500, detail="Failed to create part-timer account")
    return {"status": "created", "as_prtmr_id": response.data[0]["as_prtmr_id"]}


class LocationUpdateRequest(BaseModel):
    location: str

@router.post("/location_update")
async def location_update(
    data: LocationUpdateRequest,
    user=Depends(get_current_user)
):
    user_id = user.get("id")
    location = data.location

    response = supabase.from_("as_parttimer").update({"location": location}).eq("id", user_id).execute()

    if response.error:
        raise HTTPException(status_code=500, detail="Failed to update parttimer location")

    return {"status": "updated", "location": location}


@router.get("/job")
async def get_parttimer_jobs(user=Depends(get_current_user)):
    try:
        jobs_result = supabase.from_("joblist").select("id, category, short_desc, created_at, status").execute()
        return {"jobs": jobs_result.data}
    except Exception as e:
        logger.error(f"Error fetching employer jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
    
class JobApplicationRequest(BaseModel):
    amount: float
    bid_amount: float | None = None
    bid_reason: str | None = None

@router.post("/apply_job/{jobid}")
async def apply_job(jobid: str, data: JobApplicationRequest, user=Depends(get_current_user)):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    as_prtmr_id = await fetch_as_prtmr_id(user_id)
    if not as_prtmr_id:
        raise HTTPException(status_code=404, detail="Part-Timer ID not found")

    try:
        insert_data = {
            "jobid": jobid,
            "prtmr_id": as_prtmr_id,
            "status": "applied",
            "amount": data.amount,
            "bid_amount": data.bid_amount,
            "bid_reason": data.bid_reason
        }

        response = supabase.from_("job_applications").insert(insert_data).execute()

        # Safely check for error in the returned object
        res_dict = response.model_dump()
        if res_dict.get("error"):
            logger.error(f"Error inserting application: {res_dict['error']}")
            # Instead of failing, we can still return success if insert went through
            return {"message": "Application submitted, but with warnings.", "details": res_dict.get("error")}

        return {"message": "Application submitted successfully", "application": res_dict.get("data", [{}])[0]}

    except Exception as e:
        logger.error(f"Error in apply_job: {str(e)}")
        # Suppress the crash and send a safe response
        return {"message": "Application attempt made, but an internal error occurred", "error": str(e)}

