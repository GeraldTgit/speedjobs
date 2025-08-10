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
    
 
@router.get("/get_job_category")
async def get_job_category():
    try:
        job_category = supabase.from_("job_category").select("category").execute()

        # Only check .error if attribute exists
        if hasattr(job_category, "error") and job_category.error:
            logger.error(f"Supabase error: {job_category.error}")
            raise HTTPException(status_code=500, detail=str(job_category.error))

        if not job_category.data:
            raise HTTPException(status_code=404, detail="No job categories found")

        return job_category.data  # returns list of {"category": "..."}
    except Exception as e:
        logger.error(f"Error fetching job category: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
@router.get("/get_short_desc/{category_id}")
async def get_short_desc(category_id: str):
    try:
        if not category_id or category_id.strip() == "":
            return []

        job_details = (
            supabase.from_("job_details")
            .select("short_desc")
            .eq("category_id", category_id)
            .execute()
        )

        if not job_details.data:
            return []

        return job_details.data
    except Exception as e:
        logger.error(f"Error fetching short descriptions: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
@router.get("/get_categories_with_short_descs")
async def get_categories_with_short_descs():
    """
    Returns a list of categories with their associated short descriptions.
    Example return:
    [
      { "id": 1, "category": "Household & Care Services", "short_descs": ["Nanny", "Babysitter"] },
      ...
    ]
    """
    try:
        # 1) fetch categories
        cat_res = supabase.from_("job_category").select("id,category").execute()
        if hasattr(cat_res, "error") and cat_res.error:
            logger.error(f"Supabase error (categories): {cat_res.error}")
            raise HTTPException(status_code=500, detail="Error fetching categories")

        categories = cat_res.data or []
        if not categories:
            return []

        # 2) fetch job_details (short_descs) for all categories
        jd_res = supabase.from_("job_details").select("category_id,short_desc").execute()
        if hasattr(jd_res, "error") and jd_res.error:
            logger.error(f"Supabase error (job_details): {jd_res.error}")
            raise HTTPException(status_code=500, detail="Error fetching job details")

        job_details = jd_res.data or []

        # 3) aggregate short_descs by category_id
        mapping: dict = {}
        for jd in job_details:
            cid = jd.get("category_id")
            sd = jd.get("short_desc")
            if cid is None or sd is None:
                continue
            mapping.setdefault(cid, []).append(sd)

        # 4) build final payload
        result = []
        for c in categories:
            result.append({
                "id": c.get("id"),
                "category": c.get("category"),
                "short_descs": mapping.get(c.get("id"), [])
            })

        return result

    except Exception as e:
        logger.error(f"Error in get_categories_with_short_descs: {str(e)}")
        # don't leak internals to client, but log details server-side
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/get_long_desc")
async def get_long_desc(short_desc: str = ""):
    """
    Returns {"long_desc": "<text>"} for the given short_desc.
    If short_desc is empty or not found, returns {"long_desc": ""}.
    """
    try:
        # skip if no short_desc supplied
        if not short_desc or short_desc.strip() == "":
            return {"long_desc": ""}

        # try to get single result first
        res = (
            supabase
            .from_("job_details")
            .select("long_desc")
            .eq("short_desc", short_desc)
            .maybe_single()
            .execute()
        )

        # safe error check (different supabase-py versions)
        if hasattr(res, "error") and res.error:
            logger.error(f"Supabase error (get_long_desc): {res.error}")
            raise HTTPException(status_code=500, detail="Error fetching long description")

        data = res.data

        # handle different shapes returned by supabase client
        if isinstance(data, dict) and "long_desc" in data:
            return {"long_desc": data.get("long_desc") or ""}

        # fallback: if data is a list or maybe_single didn't work, try a normal select
        list_res = supabase.from_("job_details").select("long_desc").eq("short_desc", short_desc).execute()
        if hasattr(list_res, "error") and list_res.error:
            logger.error(f"Supabase error (get_long_desc fallback): {list_res.error}")
            raise HTTPException(status_code=500, detail="Error fetching long description")

        if list_res.data and isinstance(list_res.data, list) and len(list_res.data) > 0:
            return {"long_desc": list_res.data[0].get("long_desc", "")}

        # not found
        return {"long_desc": ""}

    except HTTPException:
        # re-raise known HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error fetching long description: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")




    
@router.get("/{job_id}")
async def get_job_by_id(job_id: str, user=Depends(get_current_user)):
    try:
        # Skip if job_id is empty or None — return empty object instead of error
        if not job_id or job_id.strip() == "":
            return {"job": None}

        user_id = user.get("id")
        as_emp_id = await fetch_as_emp_id(user_id)

        if not as_emp_id:
            raise HTTPException(status_code=403, detail="Access denied")

        job_result = (
            supabase.from_("joblist")
            .select("*")
            .eq("id", job_id)
            .eq("as_emp_id", as_emp_id)
            .maybe_single()
            .execute()
        )

        if not job_result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        return {"job": job_result.data}

    except HTTPException:
        # Re-raise HTTP exceptions (like 403, 404)
        raise
    except Exception as e:
        logger.error(f"Error fetching job by ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") 
    
    
    

    



