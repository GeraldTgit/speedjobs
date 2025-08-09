from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from loguru import logger
from routers.employer import fetch_as_emp_id  # Importing the function to fetch as_emp_id
from utils.auth import get_current_user
from utils.supabase_client import supabase

router = APIRouter(prefix="/api/joblist", tags=["Joblist"])

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

@router.post("/listNewJob")
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
    
@router.get("/{job_id}")
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
