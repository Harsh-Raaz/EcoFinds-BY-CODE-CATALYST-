def individual_product(product):
    return {
        "id": str(product["_id"]),
        "title": product["title"],
        "description": product.get("description"),
        "category": product["category"],
        "price": product["price"],
        "image_url": product.get("image_url"),
        "user_id": product.get("user_id")
    }

def all_products(products):
    return [individual_product(product) for product in products]
