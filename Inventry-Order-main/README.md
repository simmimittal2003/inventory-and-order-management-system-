# StockFlow | Inventory & Order Management System

StockFlow is a production-ready, fully containerized full-stack Inventory & Order Management System designed to help businesses manage their products, customers, and orders with automated inventory tracking, validation, and a sleek dashboard.

## 🚀 Technology Stack
*   **Frontend**: React, React Hooks, custom Vanilla CSS Design Tokens (Premium Dark Mode)
*   **Bundler/Server**: Vite (Builds served via **Nginx** container)
*   **Backend API**: Python FastAPI (ASGI web server via **Uvicorn**)
*   **Database**: PostgreSQL (OR-mapped using **SQLAlchemy** with atomic transactions)
*   **Containerization**: Docker & Docker Compose

---

## 🛠️ Architecture & Relational Schema
The database enforces strict constraints:
*   **Products**: Has a unique SKU/code constraint. Price and quantity must be non-negative.
*   **Customers**: Has a unique email address constraint with validation.
*   **Orders**: Calculated automatically by the backend. Adjusting or placing an order reduces inventory stock atomically using row-level locking (`with_for_update`) to prevent race conditions.
*   **Cancellations**: Deleting an order restores the items back into inventory atomically.

---

## 📦 Running the System (Docker Compose)
Make sure you have Docker and Docker Compose installed.

1.  **Clone / open the repository** and ensure your `.env` settings are defined (a default `.env` is provided):
    ```env
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=inventory_db
    DATABASE_URL=postgresql://postgres:postgres@db:5432/inventory_db
    VITE_API_URL=http://localhost:8000
    ```

2.  **Build and start all containers**:
    ```bash
    docker-compose up --build
    ```
    This launches three services:
    *   **PostgreSQL database** (`db`) on port `5432` with a named volume for persistent storage.
    *   **FastAPI API backend** (`backend`) on port `8000` (Swagger UI documentation available at `http://localhost:8000/docs`).
    *   **React frontend** served via **Nginx** (`frontend`) on port `3000` (accessible at `http://localhost:3000`).

---

## 🧪 Local Verification & Running Tests
To verify all APIs and business logic constraints (SKU uniqueness, email checks, stock subtraction/restoration) without starting Docker, you can run the automated test suite locally:

1.  **Set up a local virtual environment and install dependencies**:
    ```bash
    cd backend
    python -m venv .venv
    .venv\Scripts\activate      # On Windows
    source .venv/bin/activate    # On macOS/Linux
    pip install -r requirements.txt requests httpx
    ```

2.  **Execute the automated test suite**:
    ```bash
    python -m unittest path/to/test_api.py
    ```

---

## 🌐 Production Deployment Guide

### Backend API (Render/Railway/Fly.io)
1.  Set up a PostgreSQL database instance on your provider.
2.  Deploy the `backend` folder as a Python web service (or Docker service).
3.  Configure the environment variables:
    *   `DATABASE_URL`: Set to your production PostgreSQL connection string.
    *   `BACKEND_PORT`: `8000`

### Frontend (Vercel/Netlify)
1.  Connect your repository and specify the build settings:
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
2.  Add Environment Variables:
    *   `VITE_API_URL`: Set to your live Backend API URL (e.g. `https://your-backend.onrender.com`).
