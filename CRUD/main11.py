from fastapi import FastAPI, APIRouter, HTTPException
from configurations import collection
from database.schema import all_products
from database.models import Product

app = FastAPI()
router = APIRouter()

@router.get("/")
def get_all_products():
    try:
        data = list(collection.find())  # synchronous
        return all_products(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products: {e}")

@router.post("/")
def create_product(new_product: Product):
    try:
        resp = collection.insert_one(new_product.dict())  # .dict() for Pydantic model
        return {"status_code": 200, "id": str(resp.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {e}")


# @app.get("/products/{product_id}")
# async def get_product(product_id: str):
#     product = collection.find_one({"_id": ObjectId(product_id)})
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
#     product["id"] = str(product["_id"])
#     return product


@router.put("/{product_id}")
def update_product(product_id: str, updated_product: Product):
    try:
        result = collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": updated_product.dict()}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"status_code": 200, "message": "Product updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {e}")

@router.delete("/{product_id}")
def delete_product(product_id: str):
    try:
        result = collection.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"status_code": 200, "message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {e}")
    
    
app.include_router(router)


