from sqlalchemy.orm import Session
from sqlalchemy import select
from . import models, schemas
from decimal import Decimal
from typing import List, Optional

# --- PRODUCT CRUD ---

def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.sku == sku.upper()).first()

def get_products(db: Session) -> List[models.Product]:
    return db.query(models.Product).order_by(models.Product.id.desc()).all()

def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    db_product = models.Product(
        name=product.name.strip(),
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: schemas.ProductUpdate) -> Optional[models.Product]:
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "sku":
            setattr(db_product, key, value.upper())
        elif key == "name":
            setattr(db_product, key, value.strip())
        else:
            setattr(db_product, key, value)
            
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True


# --- CUSTOMER CRUD ---

def get_customer(db: Session, customer_id: int) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.email == email.lower().strip()).first()

def get_customers(db: Session) -> List[models.Customer]:
    return db.query(models.Customer).order_by(models.Customer.id.desc()).all()

def create_customer(db: Session, customer: schemas.CustomerCreate) -> models.Customer:
    db_customer = models.Customer(
        name=customer.name.strip(),
        email=customer.email,
        phone=customer.phone.strip() if customer.phone else None
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int) -> bool:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return False
    db.delete(db_customer)
    db.commit()
    return True


# --- ORDER CRUD ---

def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session) -> List[models.Order]:
    return db.query(models.Order).order_by(models.Order.id.desc()).all()

def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    # 1. Verify Customer
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise ValueError("Customer not found")

    # 2. Check for duplicate products in the request
    product_quantities = {}
    for item in order_in.items:
        if item.product_id in product_quantities:
            product_quantities[item.product_id] += item.quantity
        else:
            product_quantities[item.product_id] = item.quantity

    # 3. Create the Order in memory / flush to DB to get ID
    db_order = models.Order(
        customer_id=order_in.customer_id,
        total_amount=Decimal("0.00")
    )
    db.add(db_order)
    db.flush()  # Gives us db_order.id without committing yet

    total_amount = Decimal("0.00")

    # 4. Check stock and create OrderItems
    for product_id, quantity in product_quantities.items():
        # Retrieve product with row-level locking to prevent race conditions
        product = db.query(models.Product).filter(models.Product.id == product_id).with_for_update().first()
        if not product:
            raise ValueError(f"Product with ID {product_id} not found")
        
        if product.quantity < quantity:
            raise ValueError(
                f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                f"Requested: {quantity}, Available: {product.quantity}"
            )

        # Reduce product stock
        product.quantity -= quantity
        
        # Calculate item total
        item_price = product.price
        item_total = item_price * quantity
        total_amount += item_total

        # Create OrderItem
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=product_id,
            quantity=quantity,
            price_at_order=item_price
        )
        db.add(db_item)

    # 5. Set the final calculated total amount
    db_order.total_amount = total_amount
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int) -> bool:
    # Retrieve order with row-level locking for updates
    db_order = db.query(models.Order).filter(models.Order.id == order_id).with_for_update().first()
    if not db_order:
        return False
    
    # Restores inventory stock for all order items when order is canceled/deleted
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
        if product:
            product.quantity += item.quantity
            
    db.delete(db_order)
    db.commit()
    return True
