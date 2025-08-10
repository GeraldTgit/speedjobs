from supabase import create_client, Client

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

def test_connection():
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Query the job_category table
        response = supabase.from_("job_category").select("category").execute()

        if response.data:
            print("✅ Connection successful! Categories retrieved:")
            for row in response.data:
                print("-", row["category"])
        else:
            print("⚠ No categories found in job_category table.")

        # Only check .error if it exists
        if hasattr(response, "error") and response.error:
            print("❌ Error from Supabase:", response.error)

    except Exception as e:
        print("❌ Exception while connecting:", str(e))

if __name__ == "__main__":
    test_connection()
