# main.py (Updated)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import employer, parttimer, joblist  # <- new imports
from utils import auth  # <- new import

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

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(auth.router)
app.include_router(employer.router)
app.include_router(parttimer.router)
app.include_router(joblist.router)
