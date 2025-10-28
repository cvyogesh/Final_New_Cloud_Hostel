import pyodbc
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=newhostelserver.database.windows.net;"
    "DATABASE=HostelAllocDB1;"
    "UID=newsqladmin;"
    "PWD=Dhoni777;"
    "TrustServerCertificate=yes"
)
if conn:
    print("Connected!")

#print("Connected!")
conn.close()
