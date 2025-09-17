from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class SkinType(str, Enum):
    DRY = "dry"
    OILY = "oily"
    SENSITIVE = "sensitive"
    COMBO = "combination"

class Category(str, Enum):
    SKINCARE = "skincare"
    LIPS = "lips"
    EYES = "eyes"
    TOOLS = "tools"

# Product Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    short_description: str
    price: float
    original_price: Optional[float] = None
    category: Category
    skin_types: List[SkinType]
    ingredients: List[str]
    tags: List[str]
    image_url: str
    images: List[str] = []
    rating: float = 5.0
    review_count: int = 0
    stock: int = 100
    is_featured: bool = False
    is_new: bool = False
    is_viral: bool = False
    benefits: List[str] = []
    how_to_use: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    short_description: str
    price: float
    original_price: Optional[float] = None
    category: Category
    skin_types: List[SkinType]
    ingredients: List[str]
    tags: List[str]
    image_url: str
    images: List[str] = []
    is_featured: bool = False
    is_new: bool = False
    is_viral: bool = False
    benefits: List[str] = []
    how_to_use: str = ""

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    quantity: int
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1

class NewsletterSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    subscribed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewsletterSubscriptionCreate(BaseModel):
    email: str

# Helper function to prepare data for MongoDB
def prepare_for_mongo(data):
    if isinstance(data, dict):
        if 'created_at' in data and isinstance(data['created_at'], datetime):
            data['created_at'] = data['created_at'].isoformat()
        if 'added_at' in data and isinstance(data['added_at'], datetime):
            data['added_at'] = data['added_at'].isoformat()
        if 'subscribed_at' in data and isinstance(data['subscribed_at'], datetime):
            data['subscribed_at'] = data['subscribed_at'].isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        if 'created_at' in item and isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if 'added_at' in item and isinstance(item['added_at'], str):
            item['added_at'] = datetime.fromisoformat(item['added_at'])
        if 'subscribed_at' in item and isinstance(item['subscribed_at'], str):
            item['subscribed_at'] = datetime.fromisoformat(item['subscribed_at'])
    return item

# Routes
@api_router.get("/")
async def root():
    return {"message": "Beauty Dropship API"}

# Product routes
@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[Category] = None,
    skin_type: Optional[SkinType] = None,
    featured: Optional[bool] = None,
    new: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    query = {}
    if category:
        query["category"] = category
    if skin_type:
        query["skin_types"] = {"$in": [skin_type]}
    if featured is not None:
        query["is_featured"] = featured
    if new is not None:
        query["is_new"] = new
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        if "price" in query:
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$lte": max_price}
    
    products = await db.products.find(query).to_list(length=None)
    return [Product(**parse_from_mongo(product)) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**parse_from_mongo(product))

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate):
    product = Product(**product_data.dict())
    product_dict = prepare_for_mongo(product.dict())
    await db.products.insert_one(product_dict)
    return product

# Cart routes
@api_router.get("/cart", response_model=List[CartItem])
async def get_cart():
    cart_items = await db.cart.find().to_list(length=None)
    return [CartItem(**parse_from_mongo(item)) for item in cart_items]

@api_router.post("/cart", response_model=CartItem)
async def add_to_cart(item_data: CartItemCreate):
    # Check if product exists
    product = await db.products.find_one({"id": item_data.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already in cart
    existing_item = await db.cart.find_one({"product_id": item_data.product_id})
    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + item_data.quantity
        await db.cart.update_one(
            {"product_id": item_data.product_id},
            {"$set": {"quantity": new_quantity}}
        )
        existing_item["quantity"] = new_quantity
        return CartItem(**parse_from_mongo(existing_item))
    else:
        # Add new item
        cart_item = CartItem(**item_data.dict())
        cart_item_dict = prepare_for_mongo(cart_item.dict())
        await db.cart.insert_one(cart_item_dict)
        return cart_item

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str):
    result = await db.cart.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart():
    await db.cart.delete_many({})
    return {"message": "Cart cleared"}

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, quantity: int):
    if quantity <= 0:
        return await remove_from_cart(item_id)
    
    result = await db.cart.update_one(
        {"id": item_id},
        {"$set": {"quantity": quantity}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Cart item updated"}

# Newsletter route
@api_router.post("/newsletter", response_model=NewsletterSubscription)
async def subscribe_newsletter(subscription_data: NewsletterSubscriptionCreate):
    # Check if email already subscribed
    existing = await db.newsletter.find_one({"email": subscription_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already subscribed")
    
    subscription = NewsletterSubscription(**subscription_data.dict())
    subscription_dict = prepare_for_mongo(subscription.dict())
    await db.newsletter.insert_one(subscription_dict)
    return subscription

# Initialize sample products
@api_router.post("/init-products")
async def initialize_products():
    # Check if products already exist
    existing_count = await db.products.count_documents({})
    if existing_count > 0:
        return {"message": f"Products already initialized ({existing_count} products)"}
    
    sample_products = [
        {
            "name": "Radiant Glow Vitamin C Serum",
            "description": "A powerful antioxidant serum that brightens skin, reduces dark spots, and promotes a healthy glow. Formulated with 20% Vitamin C, hyaluronic acid, and vitamin E for maximum effectiveness.",
            "short_description": "Brightening vitamin C serum for radiant skin",
            "price": 34.99,
            "original_price": 49.99,
            "category": "skincare",
            "skin_types": ["dry", "oily", "combination"],
            "ingredients": ["Vitamin C", "Hyaluronic Acid", "Vitamin E", "Aloe Vera"],
            "tags": ["Vegan", "Cruelty-Free", "Paraben-Free"],
            "image_url": "https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f",
            "is_featured": True,
            "is_viral": True,
            "benefits": ["Brightens skin", "Reduces dark spots", "Anti-aging", "Hydrating"],
            "how_to_use": "Apply 2-3 drops to clean skin in the morning. Follow with moisturizer and SPF.",
            "rating": 4.8,
            "review_count": 234
        },
        {
            "name": "Pure Hydration Face Moisturizer",
            "description": "A lightweight, non-greasy moisturizer that provides 24-hour hydration. Perfect for all skin types, this formula contains ceramides and niacinamide to strengthen the skin barrier.",
            "short_description": "24-hour hydrating face moisturizer",
            "price": 28.99,
            "original_price": 39.99,
            "category": "skincare",
            "skin_types": ["dry", "sensitive", "combination"],
            "ingredients": ["Ceramides", "Niacinamide", "Hyaluronic Acid", "Shea Butter"],
            "tags": ["Vegan", "Fragrance-Free", "Dermatologist-Tested"],
            "image_url": "https://images.pexels.com/photos/4154192/pexels-photo-4154192.jpeg",
            "is_featured": True,
            "benefits": ["Long-lasting hydration", "Strengthens skin barrier", "Non-comedogenic"],
            "how_to_use": "Apply to clean face morning and evening. Gently massage until absorbed.",
            "rating": 4.7,
            "review_count": 189
        },
        {
            "name": "Velvet Matte Lip Tint",
            "description": "Long-wearing lip tint that delivers rich, buildable color with a comfortable matte finish. Infused with vitamin E and jojoba oil for nourishing wear.",
            "short_description": "Long-wearing matte lip tint",
            "price": 18.99,
            "category": "lips",
            "skin_types": ["dry", "oily", "sensitive", "combination"],
            "ingredients": ["Vitamin E", "Jojoba Oil", "Natural Pigments"],
            "tags": ["Vegan", "Cruelty-Free", "Long-Wearing"],
            "image_url": "https://images.unsplash.com/photo-1581182800629-7d90925ad072",
            "is_new": True,
            "is_viral": True,
            "benefits": ["Long-lasting color", "Comfortable wear", "Nourishing formula"],
            "how_to_use": "Apply to clean lips. Build up color as desired. Remove with makeup remover.",
            "rating": 4.9,
            "review_count": 156
        },
        {
            "name": "Gentle Cleansing Oil",
            "description": "A luxurious cleansing oil that effortlessly removes makeup and impurities while nourishing the skin. Suitable for all skin types, including sensitive skin.",
            "short_description": "Gentle makeup removing cleansing oil",
            "price": 32.99,
            "category": "skincare",
            "skin_types": ["dry", "sensitive", "combination"],
            "ingredients": ["Jojoba Oil", "Sunflower Oil", "Chamomile Extract", "Vitamin E"],
            "tags": ["Vegan", "Fragrance-Free", "Gentle"],
            "image_url": "https://images.pexels.com/photos/4672476/pexels-photo-4672476.jpeg",
            "is_featured": True,
            "benefits": ["Removes makeup", "Hydrates skin", "Gentle formula", "Suitable for sensitive skin"],
            "how_to_use": "Massage onto dry skin, add water to emulsify, then rinse thoroughly.",
            "rating": 4.6,
            "review_count": 98
        },
        {
            "name": "Brightening Eye Cream",
            "description": "A lightweight eye cream that targets dark circles, puffiness, and fine lines. Formulated with caffeine, peptides, and hyaluronic acid for visible results.",
            "short_description": "Anti-aging brightening eye cream",
            "price": 42.99,
            "category": "eyes",
            "skin_types": ["dry", "oily", "sensitive", "combination"],
            "ingredients": ["Caffeine", "Peptides", "Hyaluronic Acid", "Vitamin K"],
            "tags": ["Vegan", "Ophthalmologist-Tested", "Anti-Aging"],
            "image_url": "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5",
            "is_new": True,
            "benefits": ["Reduces puffiness", "Brightens dark circles", "Smooths fine lines"],
            "how_to_use": "Gently pat around eye area morning and evening.",
            "rating": 4.5,
            "review_count": 76
        },
        {
            "name": "Jade Facial Roller",
            "description": "A premium jade facial roller for lymphatic drainage and improved circulation. Helps reduce puffiness and promotes a healthy glow.",
            "short_description": "Premium jade facial massage roller",
            "price": 24.99,
            "category": "tools",
            "skin_types": ["dry", "oily", "sensitive", "combination"],
            "ingredients": ["100% Natural Jade Stone"],
            "tags": ["Natural", "Eco-Friendly", "Reusable"],
            "image_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956",
            "benefits": ["Improves circulation", "Reduces puffiness", "Promotes relaxation"],
            "how_to_use": "Use on clean skin with upward and outward motions. Clean after each use.",
            "rating": 4.4,
            "review_count": 124
        }
    ]
    
    for product_data in sample_products:
        product = Product(**product_data)
        product_dict = prepare_for_mongo(product.dict())
        await db.products.insert_one(product_dict)
    
    return {"message": f"Initialized {len(sample_products)} sample products"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()