from pydantic import BaseModel
from typing import Optional

class Product(BaseModel):
    title: str
    description: str
    category: str
    price: float
    image_url: str
    user_id: str
