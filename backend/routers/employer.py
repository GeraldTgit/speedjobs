from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from utils.auth import get_current_user
from utils.supabase_client import supabase
from pydantic import BaseModel

router = APIRouter(prefix="/api/employer", tags=["Employer"])

async def fetch_as_emp_id(user_id):
    try:
        result = supabase.from_("as_employer").select("as_emp_id").eq("id", user_id).maybe_single().execute()
        if result.data and "as_emp_id" in result.data:
            return result.data["as_emp_id"]
    except Exception as e:
        logger.warning(f"fetch_as_emp_id failed: {str(e)}")
    return ""

@router.get("/as_emp_id")
async def get_as_emp_id(user=Depends(get_current_user)):
    user_id = user.get("id")
    as_emp_id = await fetch_as_emp_id(user_id)
    if as_emp_id:
        return {"as_emp_id": as_emp_id}
    raise HTTPException(status_code=404, detail="Employer ID not found")


async def fetch_emp_location(user_id):
    try:
        result = supabase.from_("as_employer").select("location").eq("id", user_id).maybe_single().execute()
        if result.data and "location" in result.data:
            return result.data["location"]
    except Exception as e:
        logger.warning(f"fetch_location failed: {str(e)}")
    return ""

@router.get("/location")
async def get_as_emp_id(user=Depends(get_current_user)):
    user_id = user.get("id")
    location = await fetch_emp_location(user_id)
    if location:
        return {"location": location}
    raise HTTPException(status_code=404, detail="Employer Location not found")


async def fetch_emp_status(user_id):
    try:
        result = supabase.from_("as_employer").select("status").eq("id", user_id).maybe_single().execute()
        if result.data and "status" in result.data:
            return result.data["status"]
    except Exception as e:
        logger.warning(f"fetch_status failed: {str(e)}")
    return ""

@router.get("/status")
async def get_as_emp_id(user=Depends(get_current_user)):
    user_id = user.get("id")
    status = await fetch_emp_status(user_id)
    if status:
        return {"status": status}
    raise HTTPException(status_code=404, detail="Employer status not found")


@router.get("/profile")
async def employer_profile(user=Depends(get_current_user)):
    user_id = user.get("id")
    user_result = supabase.from_("users").select("name, picture_url, email").eq("id", user_id).maybe_single().execute()
    name = user_result.data.get("name") if user_result.data else None
    picture_url = user_result.data.get("picture_url") if user_result.data else None
    email = user_result.data.get("email") if user_result.data else None
    as_emp_id = await fetch_as_emp_id(user_id)
    location = await fetch_emp_location(user_id)
    status = await fetch_emp_status(user_id)
    if name:
        return {"name": name, "picture_url": picture_url, "email":email, "as_emp_id": as_emp_id, "location": location, "status": status}
    raise HTTPException(status_code=404, detail="User not found")

@router.post("/check_or_create_employer")
async def check_or_create_employer(user=Depends(get_current_user)):
    user_id = user.get("id")
    as_emp_id = await fetch_as_emp_id(user_id)
    if as_emp_id:
        return {"status": "exists", "as_emp_id": as_emp_id}
    response = supabase.from_("as_employer").insert({"id": user_id}).execute()
    if response.error:
        raise HTTPException(status_code=500, detail="Failed to create employer account")
    return {"status": "created", "as_emp_id": response.data[0]["as_emp_id"]}


class LocationUpdateRequest(BaseModel):
    location: str
    status: str

@router.post("/location_update")
async def location_update(
    data: LocationUpdateRequest,
    user=Depends(get_current_user)
):
    try:
        user_id = user.get("id")
        location = data.location
        status = data.status.lower() == "true"  # convert string to boolean

        response = supabase.from_("as_employer").update({
            "location": location,
            "status": status
        }).eq("id", user_id).execute()

        if response.error:
            print("Supabase update error:", response.error)
            return {"status": "failed", "error": str(response.error)}

        return {"status": "updated", "location": location, "status_value": status}

    except Exception as e:
        print("Unhandled exception:", str(e))
        return {"status": "failed", "error": "Something went wrong"}

 


@router.get("/jobs")
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

    
@router.get("/available-parttimers")
async def get_available_as_parttimer(user=Depends(get_current_user)):
    try:

        # Get all part-timers
        as_parttimer_info = supabase.from_("as_parttimer").select("id, as_prtmr_id, location").execute()
        parttimer_data = as_parttimer_info.data

        if not parttimer_data:
            return {"as_parttimer": []}

        # Get all related user_ids
        user_ids = [item["id"] for item in parttimer_data]

        # Fetch all user info in one query
        parttimer_user_data = supabase.from_("users").select("id, name, picture_url, email").in_("id", user_ids).execute()
        user_data_map = {user["id"]: user for user in parttimer_user_data.data}

        # Merge the data
        result = []
        for p in parttimer_data:
            user_info = user_data_map.get(p["id"], {})
            result.append({
                "id": p["id"],
                "location": p.get("location"),
                "as_prtmr_id": p.get("as_prtmr_id"),
                "name": user_info.get("name"),
                "email": user_info.get("email"),
                "picture_url": user_info.get("picture_url")
            })

        return {"as_parttimer": result}

    except Exception as e:
        logger.error(f"Error fetching available part-timers: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

class StatusUpdateRequest(BaseModel):
    status: bool

@router.post("/status_update")
async def status_update(data: StatusUpdateRequest, user=Depends(get_current_user)):
    user_id = user.get("id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Unauthorized")

    response = supabase.from_("as_employer").update({"status": data.status}).eq("id", user_id).execute()

    if response.error:
        raise HTTPException(status_code=500, detail="Failed to update status")

    return {"message": "Status updated", "status": data.status}
