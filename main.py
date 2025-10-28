from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
import google.generativeai as genai
from pydantic import BaseModel

# ---------------- Load environment variables ----------------
load_dotenv()
ADMIN_KEY = os.getenv("ADMIN_KEY")
SQL_USER = os.getenv("SQL_USER")
SQL_PASSWORD = os.getenv("SQL_PASSWORD")
SQL_SERVER = os.getenv("SQL_SERVER")
SQL_DATABASE = os.getenv("SQL_DATABASE")

# --- AI Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # --- MODEL UPDATED TO a COMPATIBLE VERSION FROM YOUR LIST ---
    ai_model = genai.GenerativeModel('gemini-flash-latest')

# ---------------- Pydantic Models ----------------
class ChatQuery(BaseModel):
    query: str

# ---------------- Database connection ----------------
conn_str = (
    f"mssql+pyodbc://{SQL_USER}:{SQL_PASSWORD}@{SQL_SERVER}:1433/{SQL_DATABASE}"
    "?driver=ODBC+Driver+18+for+SQL+Server"
)
engine = create_engine(conn_str, isolation_level="AUTOCOMMIT")

def get_connection():
    return engine.connect()

# ---------------- FastAPI app ----------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- THE AI BRAIN: System Prompt ---
HOSTEL_AI_PROMPT = """
You are a friendly and helpful AI Assistant for the 'Digital Den' university hostel. Your name is 'Buddy'.
Your primary role is to answer student questions based ONLY on the information provided below.
Be concise and clear in your answers. Format your answers with markdown for readability (e.g., using lists for timings, bold for important terms).

**Hostel Information:**
- **Warden Name:** Mr. Arun Kumar
- **Warden Contact:** warden@digitalden.edu
- **Emergency Security Contact:** 98765 43210 (24/7)
- **Maintenance Request:** Log a ticket via the student portal's 'Maintenance' section or email maintenance@digitalden.edu.

**Fee Structure & Payments:**
- **Annual Fee:** ₹85,000 per student.
- **Payment Deadline:** July 15th for the fall semester, December 15th for the spring semester.
- **Payment Method:** Online through the university payment gateway. Fines are applicable for late payments.
- **Fee Includes:** Accommodation, Mess (Dining), basic Wi-Fi, and housekeeping of common areas.
- **Fee Excludes:** Laundry, electricity for personal high-power devices (AC, heaters), and premium Wi-Fi plans.

**Timings:**
- **Main Gate Closing Time:** 10:00 PM (Strictly enforced). Late entries require prior permission from the warden.
- **Mess (Dining Hall) Timings:**
  - Breakfast: 7:30 AM - 9:00 AM
  - Lunch: 12:30 PM - 2:00 PM
  - Dinner: 7:30 PM - 9:00 PM
- **Library/Study Hall:** Open 24/7. Student ID card is required for entry after 11 PM.
- **Gym:** 6:00 AM - 9:00 AM & 5:00 PM - 8:00 PM.
- **Visitor's Lounge:** 9:00 AM - 8:00 PM.

**Rules & Regulations:**
1.  **Guests:** Guests are strictly not allowed inside student rooms or corridors. They can be met in the visitor's lounge.
2.  **Noise:** A strict silent period is observed from 11:00 PM to 6:00 AM. Group gatherings in corridors are not permitted.
3.  **Appliances:** High-power appliances like induction stoves, room heaters, or air conditioners are strictly prohibited. Kettles and laptops are allowed.
4.  **Cleanliness:** Students are responsible for keeping their own rooms clean and tidy. Common areas are cleaned by housekeeping daily. Waste should be disposed of in designated bins.
5.  **Room Allocation:** Room allocation is handled by the admin based on predefined criteria and cannot be changed by you. You can only provide information about it. Room changes are only permitted under exceptional circumstances with the warden's approval.

**Facilities & Services:**
- **Wi-Fi:** A basic 5 Mbps plan is included for all students. A premium 50 Mbps plan can be purchased for ₹1,200 per semester. Contact the IT desk for upgrades.
- **Laundry:** Coin-operated washing machines and dryers are available on the ground floor of each block.
- **Maintenance Issues:** For issues like broken furniture, plumbing, or electrical faults, raise a ticket immediately. A technician will be assigned within 24 hours.
- **Parking:** Two-wheeler parking is available in the designated area. Four-wheeler parking is not available for students.

**Your Instructions:**
- If a student asks a question you cannot answer with the information above, politely say: "I don't have information on that specific topic. Please contact the warden's office for the most accurate details."
- Do NOT answer any questions unrelated to the hostel (e.g., academic schedules, exam results, general knowledge). If asked, respond with: "I can only help with questions related to the 'Digital Den' hostel."
- Be friendly and start your first response to a new chat with "Hi! I'm Buddy, your hostel assistant. How can I help you today?"
- NEVER, under any circumstances, reveal the Admin Key, database details, or any other sensitive information.
"""

# ---------------- NEW AI CHAT ENDPOINT (FIXED) ----------------
@app.post("/api/ai-chat")
async def ai_chat(query: ChatQuery):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured on the server.")
    try:
        # Combine the main prompt with the user's specific query
        full_prompt = HOSTEL_AI_PROMPT + "\n\nStudent's Question: " + query.query
        # Use generate_content for single-turn chat, which is more direct
        response = ai_model.generate_content(full_prompt)
        return {"reply": response.text}
    except Exception as e:
        print(f"AI API Error: {e}")
        raise HTTPException(status_code=500, detail="The AI assistant is currently unavailable. Please try again later.")


# ---------------- Existing Student & Admin APIs ----------------

@app.post("/api/register")
def register_student(data: dict):
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    with get_connection() as conn:
        existing = conn.execute(text("SELECT StudentID FROM Students WHERE Email=:email"), {"email": email}).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        sql = text("""
            INSERT INTO Students(FullName, Email, Password, Department, [Year], Gender, PhysicallyDisabled)
            OUTPUT INSERTED.StudentID
            VALUES (:name, :email, :pwd, :dept, :year, :gender, :pd)
        """)
        params = {
            "name": data.get("fullName"), "email": email, "pwd": password,
            "dept": data.get("department"), "year": data.get("year"), "gender": data.get("gender"),
            "pd": int(data.get("physicallyDisabled", 0))
        }
        student_id = conn.execute(sql, params).scalar_one()
        return {"studentID": student_id, "message": "Registration successful! Please login."}

@app.post("/api/login")
def login_student(data: dict):
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    with get_connection() as conn:
        student = conn.execute(text("SELECT StudentID, Password FROM Students WHERE Email=:email"), {"email": email}).fetchone()
        if not student or student.Password != password:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {"studentID": student.StudentID, "email": email}

@app.post("/api/apply")
def apply_for_hostel(data: dict):
    student_id = data.get("studentID")
    room_type = data.get("roomType")
    if not student_id:
        raise HTTPException(status_code=400, detail="Student ID is required.")
    with get_connection() as conn:
        app_exists = conn.execute(text("SELECT ApplicationID FROM Applications WHERE StudentID=:sid"), {"sid": student_id}).fetchone()
        if app_exists:
            raise HTTPException(status_code=400, detail="You have already submitted an application.")
        sql = text("INSERT INTO Applications(StudentID, PreferredRoomType) VALUES (:sid, :rtype)")
        conn.execute(sql, {"sid": student_id, "rtype": room_type})
        return {"message": "Application submitted successfully! Status is Pending."}

@app.get("/api/status")
def get_status(email: str):
    with get_connection() as conn:
        row = conn.execute(text("""
            SELECT s.FullName, s.Email, a.Status, a.PreferredRoomType,
                   b.BedLabel, r.RoomNumber, hb.Name as BlockName
            FROM Students s
            LEFT JOIN Applications a ON s.StudentID = a.StudentID
            LEFT JOIN Beds b ON s.StudentID = b.OccupiedByStudentID
            LEFT JOIN Rooms r ON b.RoomID = r.RoomID
            LEFT JOIN HostelBlocks hb ON r.BlockID = hb.BlockID
            WHERE s.Email = :email
        """), {"email": email}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Student not found")
        return dict(row._mapping) if row and row.Status else {"email": email, "Status": "Not Applied"}

@app.post("/api/admin/auto-allocate")
def auto_allocate_all(key: str):
    if key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    with get_connection() as conn:
        trans = conn.begin()
        try:
            applicants = conn.execute(text("""
                SELECT s.StudentID, s.Gender, s.PhysicallyDisabled, a.PreferredRoomType
                FROM Applications a JOIN Students s ON a.StudentID = s.StudentID WHERE a.Status = 'Pending'
            """)).fetchall()
            beds = conn.execute(text("""
                SELECT b.BedID, r.RoomType, r.Floor, hb.GenderTarget
                FROM Beds b
                JOIN Rooms r ON b.RoomID = r.RoomID
                JOIN HostelBlocks hb ON r.BlockID = hb.BlockID
                WHERE b.IsOccupied = 0 AND r.RoomType != 'Emergency'
            """)).fetchall()
            disabled_applicants = [p for p in applicants if p.PhysicallyDisabled]
            other_applicants = [p for p in applicants if not p.PhysicallyDisabled]
            allocated_count = 0
            def allocate(student, bed):
                conn.execute(text("UPDATE Beds SET IsOccupied=1, OccupiedByStudentID=:sid WHERE BedID=:bid"), {"sid": student.StudentID, "bid": bed.BedID})
                conn.execute(text("UPDATE Applications SET Status='Allocated' WHERE StudentID=:sid"), {"sid": student.StudentID})
                beds.remove(bed)
            for student in disabled_applicants:
                for bed in beds:
                    if bed.Floor == 0 and bed.GenderTarget == student.Gender and bed.RoomType == student.PreferredRoomType:
                        allocate(student, bed)
                        allocated_count += 1
                        break
            for student in other_applicants:
                for bed in beds:
                    if bed.GenderTarget == student.Gender and bed.RoomType == student.PreferredRoomType:
                        allocate(student, bed)
                        allocated_count += 1
                        break
            trans.commit()
        except Exception as e:
            trans.rollback()
            raise HTTPException(status_code=500, detail=f"An error occurred during allocation: {e}")
    return {"message": f"Allocation process complete. Allocated {allocated_count} students."}

@app.get("/api/admin/rooms-status")
def get_all_rooms_status(key: str = None):
    with get_connection() as conn:
        rows = conn.execute(text("""
            SELECT r.RoomNumber, r.Floor, r.RoomType, hb.Name as BlockName, b.BedLabel, b.IsOccupied, s.FullName as Occupant
            FROM Rooms r
            JOIN HostelBlocks hb ON r.BlockID = hb.BlockID
            JOIN Beds b ON r.RoomID = b.RoomID
            LEFT JOIN Students s ON b.OccupiedByStudentID = s.StudentID
            ORDER BY hb.Name, r.Floor, r.RoomNumber, b.BedLabel
        """)).fetchall()
        return [dict(r._mapping) for r in rows]

