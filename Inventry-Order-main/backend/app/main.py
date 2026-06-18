from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .routes import products, customers, orders
from . import models, schemas

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Backend API for managing products, customers, and orders",
    version="1.0.0"
)

# CORS configuration to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)

# Health Check
@app.get("/", tags=["General"])
def health_check():
    return {
        "status": "healthy",
        "service": "Inventory & Order Management API",
        "version": "1.0.0"
    }

# Dashboard Statistics Endpoint
@app.get("/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats(threshold: int = 10, db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Retrieve details of products with quantity below the threshold
    low_stock_products = db.query(models.Product).filter(models.Product.quantity < threshold).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_threshold": threshold,
        "low_stock_products": [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "price": p.price,
                "quantity": p.quantity
            }
            for p in low_stock_products
        ]
    }
