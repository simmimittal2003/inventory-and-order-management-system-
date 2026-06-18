from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database, models

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

def map_db_order_to_schema(order: models.Order) -> schemas.OrderResponse:
    items_response = []
    for item in order.items:
        # Gracefully handle if product has been deleted in Cascade
        p_name = item.product.name if item.product else "Unknown Product"
        p_sku = item.product.sku if item.product else "UNKNOWN"
        items_response.append(
            schemas.OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=p_name,
                product_sku=p_sku,
                quantity=item.quantity,
                price_at_order=item.price_at_order
            )
        )
    
    return schemas.OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else "Unknown Customer",
        customer_email=order.customer.email if order.customer else "unknown@example.com",
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items_response
    )

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(database.get_db)):
    try:
        db_order = crud.create_order(db=db, order_in=order_in)
        return map_db_order_to_schema(db_order)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(database.get_db)):
    orders = crud.get_orders(db=db)
    return [map_db_order_to_schema(order) for order in orders]

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(database.get_db)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    return map_db_order_to_schema(db_order)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_order(db=db, order_id=order_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    return None
