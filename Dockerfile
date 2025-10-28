# Stage 1: Use an official Python runtime as a parent image
FROM python:3.12-slim

# ==============================================================================
# NEW STAGE: Install system dependencies for the Microsoft ODBC Driver
# This is required for the 'pyodbc' library to connect to MS SQL Server.
# ==============================================================================
RUN apt-get update && apt-get install -y curl gnupg

# Add Microsoft's official GPG key
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg

# Add Microsoft's package repository for Debian 12 (which python:3.12-slim is based on)
RUN curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list

# Update package lists again and install the driver
# The "ACCEPT_EULA=Y" is required for a non-interactive installation.
RUN apt-get update && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev
# ==============================================================================

# Stage 2: Set the working directory inside the container
WORKDIR /app

# Stage 3: Copy the dependency file and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 4: Copy the rest of your application code into the container
COPY . .

# Stage 5: Expose the port the app runs on
EXPOSE 8000

# Stage 6: Define the command to run your application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

