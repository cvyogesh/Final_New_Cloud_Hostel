from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# ----------------- Load environment variables -----------------
load_dotenv()  # Make sure .env is in the same folder
SQL_USER = os.getenv("SQL_USER")
SQL_PASSWORD = os.getenv("SQL_PASSWORD")
SQL_SERVER = os.getenv("SQL_SERVER")
SQL_DATABASE = os.getenv("SQL_DATABASE")

# ----------------- Connect to Azure SQL -----------------
conn_str = (
    f"mssql+pyodbc://{SQL_USER}:{SQL_PASSWORD}@{SQL_SERVER}:1433/{SQL_DATABASE}"
    "?driver=ODBC+Driver+18+for+SQL+Server"
)
engine = create_engine(conn_str, fast_executemany=True)

# ----------------- Helper function -----------------
def insert_and_get_id(conn, sql, params):
    """Execute an INSERT with OUTPUT INSERTED.ID and return the new ID."""
    result = conn.execute(text(sql), params)
    return result.fetchone()[0]

# ----------------- Insert sample data -----------------
def main():
    try:
        with engine.begin() as conn:
            print("===== Inserting sample data =====")

            # 1️⃣ Insert Hostel Blocks
            block1_id = insert_and_get_id(conn,
                "INSERT INTO HostelBlocks(Name,Gender,WardenEmail) OUTPUT INSERTED.BlockID VALUES (:n,:g,:e)",
                {"n":"Block 1","g":"Male","e":"warden1@hostel.com"}
            )
            block2_id = insert_and_get_id(conn,
                "INSERT INTO HostelBlocks(Name,Gender,WardenEmail) OUTPUT INSERTED.BlockID VALUES (:n,:g,:e)",
                {"n":"Block 2","g":"Female","e":"warden2@hostel.com"}
            )
            print("Inserted Blocks:", block1_id, block2_id)

            # 2️⃣ Insert Rooms
            room1_id = insert_and_get_id(conn,
                "INSERT INTO Rooms(BlockID,RoomNumber,Capacity,Floor,NearMedical) OUTPUT INSERTED.RoomID VALUES (:bid,:num,:cap,:floor,:near)",
                {"bid":block1_id,"num":"101","cap":4,"floor":0,"near":1}  # ground floor + near medical
            )
            room2_id = insert_and_get_id(conn,
                "INSERT INTO Rooms(BlockID,RoomNumber,Capacity,Floor,NearMedical) OUTPUT INSERTED.RoomID VALUES (:bid,:num,:cap,:floor,:near)",
                {"bid":block2_id,"num":"201","cap":4,"floor":1,"near":0}
            )
            print("Inserted Rooms:", room1_id, room2_id)

            # 3️⃣ Insert Beds
            bed_ids = []
            for label in ["B1","B2","B3","B4"]:
                bed_id = insert_and_get_id(conn,
                    "INSERT INTO Beds(RoomID,BedLabel) OUTPUT INSERTED.BedID VALUES (:rid,:lbl)",
                    {"rid":room1_id,"lbl":label}
                )
                bed_ids.append(bed_id)
            for label in ["B1","B2","B3","B4"]:
                bed_id = insert_and_get_id(conn,
                    "INSERT INTO Beds(RoomID,BedLabel) OUTPUT INSERTED.BedID VALUES (:rid,:lbl)",
                    {"rid":room2_id,"lbl":label}
                )
                bed_ids.append(bed_id)
            print("Inserted Beds:", bed_ids)

            # 4️⃣ Insert a sample student (include Password!)
            student_id = insert_and_get_id(conn,
                """
                INSERT INTO Students(FullName,Email,Password,Department,[Year],Gender,PhysicallyDisabled,MedicalCondition)
                OUTPUT INSERTED.StudentID
                VALUES (:name,:email,:pwd,:dept,:year,:gender,:pd,:mc)
                """,
                {"name":"Test Student",
                 "email":"test@student.com",
                 "pwd":"demo123",      # mandatory
                 "dept":"CSE",
                 "year":3,
                 "gender":"Male",
                 "pd":0,
                 "mc":0}
            )
            print("Inserted StudentID:", student_id)

            # 5️⃣ Insert application
            app_id = insert_and_get_id(conn,
                "INSERT INTO Applications(StudentID,PreferredBlock,PreferredRoomType) OUTPUT INSERTED.ApplicationID VALUES (:sid,:block,:rtype)",
                {"sid":student_id,"block":"Block 1","rtype":"Single"}
            )
            print("Inserted ApplicationID:", app_id)

            # 6️⃣ Display all tables
            for table in ["Students","Applications","Beds","Rooms","HostelBlocks"]:
                print(f"\n===== {table} =====")
                for row in conn.execute(text(f"SELECT * FROM {table}")):
                    print(row)

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
