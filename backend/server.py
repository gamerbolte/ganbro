from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Query, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import random
import string
import base64
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'gameshop_nepal')]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.environ.get('JWT_SECRET', 'gameshop-nepal-secret-key-2024')

# SMTP Configuration
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

# ImgBB Configuration
IMGBB_API_KEY = os.environ.get("IMGBB_API_KEY", "")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class ProductVariation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    original_price: Optional[float] = None

class CustomField(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    placeholder: Optional[str] = None
    required: bool = False

class ProductCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    variations: List[ProductVariation] = []
    tags: List[str] = []
    custom_fields: List[CustomField] = []
    is_active: bool = True
    is_sold_out: bool = False
    stock_quantity: Optional[int] = None
    flash_sale_end: Optional[datetime] = None
    flash_sale_label: Optional[str] = None
    sort_order: int = 0

class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    sort_order: int = 0

class ReviewCreate(BaseModel):
    reviewer_name: str
    rating: int = 5
    comment: str
    review_date: Optional[datetime] = None

class FAQCreate(BaseModel):
    question: str
    answer: str
    sort_order: int = 0

class SocialLinkCreate(BaseModel):
    platform: str
    url: str

class OrderItem(BaseModel):
    name: str
    price: float
    quantity: int = 1
    variation: Optional[str] = None
    product_id: Optional[str] = None
    variation_id: Optional[str] = None

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    credits_used: float = 0
    remark: Optional[str] = None

class PromoCodeCreate(BaseModel):
    code: str
    discount_type: str = "fixed"
    discount_value: float
    min_order_amount: float = 0
    max_uses: Optional[int] = None
    is_active: bool = True
    expires_at: Optional[datetime] = None

class QRCode(BaseModel):
    url: str
    label: Optional[str] = None

class PaymentMethodCreate(BaseModel):
    name: str
    image_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    qr_codes: List[QRCode] = []
    merchant_name: Optional[str] = None
    phone_number: Optional[str] = None
    instructions: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class ContactCreate(BaseModel):
    type: str
    value: str
    label: Optional[str] = None
    is_active: bool = True

class BlogPostCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    is_published: bool = True

class NotificationBarUpdate(BaseModel):
    text: Optional[str] = None
    link_url: Optional[str] = None
    is_active: bool = False

class SettingsUpdate(BaseModel):
    service_charge: float = 0
    tax_percentage: float = 0
    tax_label: str = "Tax"

class CustomerOTPRequest(BaseModel):
    email: str
    name: Optional[str] = None
    whatsapp_number: Optional[str] = None

class CustomerOTPVerify(BaseModel):
    email: str
    otp: str

class NewsletterSubscribe(BaseModel):
    email: str

class CreditSettings(BaseModel):
    cashback_percentage: float = 5
    is_enabled: bool = True

class CreditAdjust(BaseModel):
    customer_email: str
    amount: float
    reason: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def generate_slug(name: str) -> str:
    return name.lower().replace(" ", "-").replace("'", "").replace('"', '')

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

async def send_email(to_email: str, subject: str, html_body: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"GameShop Nepal <{SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False

async def upload_to_imgbb(image_bytes: bytes, filename: str) -> dict:
    if not IMGBB_API_KEY:
        raise HTTPException(status_code=500, detail="IMGBB_API_KEY not configured")
    try:
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        payload = {'key': IMGBB_API_KEY, 'image': image_base64, 'name': filename}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post("https://api.imgbb.com/1/upload", data=payload)
            response.raise_for_status()
            result = response.json()
        if not result.get('success'):
            raise Exception(f"ImgBB upload failed: {result.get('error', {}).get('message', 'Unknown error')}")
        return {'url': result['data']['url'], 'display_url': result['data']['display_url']}
    except Exception as e:
        logger.error(f"ImgBB upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/customer/send-otp")
async def send_customer_otp(request: CustomerOTPRequest):
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    await db.customer_otps.update_one(
        {"email": request.email.lower()},
        {"$set": {"otp": otp, "expires_at": expires_at, "name": request.name, "whatsapp_number": request.whatsapp_number}},
        upsert=True
    )
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff;">
        <h1 style="color: #F5A623;">GameShop Nepal</h1>
        <p>Your verification code is:</p>
        <h2 style="color: #F5A623; font-size: 32px; letter-spacing: 8px;">{otp}</h2>
        <p>This code expires in 10 minutes.</p>
    </div>
    """
    
    email_sent = await send_email(request.email, "Your GameShop Nepal Verification Code", html_body)
    
    response = {"message": "OTP sent to your email"}
    if not email_sent:
        response["otp"] = otp  # Debug mode when email not configured
    return response

@api_router.post("/auth/customer/verify-otp")
async def verify_customer_otp(request: CustomerOTPVerify):
    otp_doc = await db.customer_otps.find_one({"email": request.email.lower()})
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
    
    if otp_doc.get("otp") != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.utcnow() > otp_doc.get("expires_at", datetime.utcnow()):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Create or update customer
    customer = await db.customers.find_one({"email": request.email.lower()})
    if not customer:
        customer = {
            "id": str(uuid.uuid4()),
            "email": request.email.lower(),
            "name": otp_doc.get("name") or request.email.split("@")[0],
            "whatsapp_number": otp_doc.get("whatsapp_number"),
            "credit_balance": 0,
            "created_at": datetime.utcnow()
        }
        await db.customers.insert_one(customer)
    
    # Generate JWT
    token = jwt.encode({"email": customer["email"], "exp": datetime.utcnow() + timedelta(days=30)}, JWT_SECRET, algorithm="HS256")
    
    # Clean up OTP
    await db.customer_otps.delete_one({"email": request.email.lower()})
    
    return {"token": token, "customer": {"email": customer["email"], "name": customer.get("name"), "whatsapp_number": customer.get("whatsapp_number")}}

# ==================== PRODUCTS ENDPOINTS ====================

@api_router.get("/products")
async def get_products(category_id: Optional[str] = None, active_only: bool = True):
    query = {}
    if active_only:
        query["is_active"] = True
    if category_id:
        query["category_id"] = category_id
    products = await db.products.find(query).sort("sort_order", 1).to_list(1000)
    for p in products:
        p["id"] = str(p.get("_id", p.get("id")))
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"$or": [{"slug": product_id}, {"id": product_id}]})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["id"] = str(product.get("_id", product.get("id")))
    return product

@api_router.get("/products/{product_id}/related")
async def get_related_products(product_id: str, limit: int = 4):
    product = await db.products.find_one({"$or": [{"slug": product_id}, {"id": product_id}]})
    if not product:
        return []
    query = {"is_active": True, "id": {"$ne": product.get("id")}}
    if product.get("category_id"):
        query["category_id"] = product["category_id"]
    related = await db.products.find(query).limit(limit).to_list(limit)
    for p in related:
        p["id"] = str(p.get("_id", p.get("id")))
    return related

@api_router.post("/products")
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_dict["id"] = str(uuid.uuid4())
    product_dict["slug"] = product.slug or generate_slug(product.name)
    product_dict["created_at"] = datetime.utcnow()
    await db.products.insert_one(product_dict)
    return product_dict

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: ProductCreate):
    product_dict = product.dict()
    product_dict["updated_at"] = datetime.utcnow()
    result = await db.products.update_one({"$or": [{"id": product_id}, {"slug": product_id}]}, {"$set": product_dict})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"$or": [{"id": product_id}, {"slug": product_id}]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== CATEGORIES ENDPOINTS ====================

@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find().sort("sort_order", 1).to_list(100)
    for c in categories:
        c["id"] = str(c.get("_id", c.get("id")))
    return categories

@api_router.post("/categories")
async def create_category(category: CategoryCreate):
    category_dict = category.dict()
    category_dict["id"] = str(uuid.uuid4())
    category_dict["slug"] = category.slug or generate_slug(category.name)
    await db.categories.insert_one(category_dict)
    return category_dict

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryCreate):
    result = await db.categories.update_one({"id": category_id}, {"$set": category.dict()})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category updated"}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ==================== REVIEWS ENDPOINTS ====================

@api_router.get("/reviews")
async def get_reviews():
    reviews = await db.reviews.find().sort("review_date", -1).to_list(100)
    for r in reviews:
        r["id"] = str(r.get("_id", r.get("id")))
    return reviews

@api_router.post("/reviews")
async def create_review(review: ReviewCreate):
    review_dict = review.dict()
    review_dict["id"] = str(uuid.uuid4())
    review_dict["review_date"] = review.review_date or datetime.utcnow()
    await db.reviews.insert_one(review_dict)
    return review_dict

@api_router.put("/reviews/{review_id}")
async def update_review(review_id: str, review: ReviewCreate):
    result = await db.reviews.update_one({"id": review_id}, {"$set": review.dict()})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review updated"}

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str):
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted"}

# ==================== FAQ ENDPOINTS ====================

@api_router.get("/faqs")
async def get_faqs():
    faqs = await db.faqs.find().sort("sort_order", 1).to_list(100)
    for f in faqs:
        f["id"] = str(f.get("_id", f.get("id")))
    return faqs

@api_router.post("/faqs")
async def create_faq(faq: FAQCreate):
    faq_dict = faq.dict()
    faq_dict["id"] = str(uuid.uuid4())
    await db.faqs.insert_one(faq_dict)
    return faq_dict

@api_router.put("/faqs/{faq_id}")
async def update_faq(faq_id: str, faq: FAQCreate):
    result = await db.faqs.update_one({"id": faq_id}, {"$set": faq.dict()})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ updated"}

@api_router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str):
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted"}

# ==================== SOCIAL LINKS ENDPOINTS ====================

@api_router.get("/social-links")
async def get_social_links():
    links = await db.social_links.find().to_list(20)
    for l in links:
        l["id"] = str(l.get("_id", l.get("id")))
    return links

@api_router.post("/social-links")
async def create_social_link(link: SocialLinkCreate):
    link_dict = link.dict()
    link_dict["id"] = str(uuid.uuid4())
    await db.social_links.insert_one(link_dict)
    return link_dict

@api_router.delete("/social-links/{link_id}")
async def delete_social_link(link_id: str):
    result = await db.social_links.delete_one({"id": link_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")
    return {"message": "Social link deleted"}

# ==================== PAGES ENDPOINTS ====================

@api_router.get("/pages/{page_key}")
async def get_page(page_key: str):
    page = await db.pages.find_one({"key": page_key})
    if not page:
        return {"key": page_key, "title": page_key.replace("-", " ").title(), "content": ""}
    return page

@api_router.put("/pages/{page_key}")
async def update_page(page_key: str, title: str = Query(...), content: str = Query(...)):
    await db.pages.update_one(
        {"key": page_key},
        {"$set": {"key": page_key, "title": title, "content": content, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"message": "Page updated"}

# ==================== ORDERS ENDPOINTS ====================

@api_router.post("/orders/create")
async def create_order(order: OrderCreate):
    order_dict = order.dict()
    order_dict["id"] = str(uuid.uuid4())
    order_dict["status"] = "Pending"
    order_dict["created_at"] = datetime.utcnow()
    order_dict["items_text"] = ", ".join([f"{i['name']} ({i.get('variation', '')} x{i['quantity']})" for i in order.items])
    await db.orders.insert_one(order_dict)
    return {"order_id": order_dict["id"], "message": "Order created successfully"}

@api_router.get("/orders")
async def get_orders():
    orders = await db.orders.find().sort("created_at", -1).to_list(1000)
    for o in orders:
        o["id"] = str(o.get("_id", o.get("id")))
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order["id"] = str(order.get("_id", order.get("id")))
    return order

@api_router.post("/orders/{order_id}/payment-screenshot")
async def upload_payment_screenshot(order_id: str, screenshot_url: str = Body(..., embed=False), payment_method: str = Body(None, embed=False)):
    data = {"screenshot_url": screenshot_url, "status": "Confirmed", "payment_method": payment_method, "confirmed_at": datetime.utcnow()}
    result = await db.orders.update_one({"id": order_id}, {"$set": data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Payment screenshot uploaded", "invoice_url": f"/invoice/{order_id}"}

@api_router.post("/orders/{order_id}/complete")
async def complete_order(order_id: str):
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": "Completed", "completed_at": datetime.utcnow()}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order completed"}

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

@api_router.get("/invoice/{order_id}")
async def get_invoice(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order["id"] = str(order.get("_id", order.get("id")))
    return {"order": order}

# ==================== PROMO CODES ENDPOINTS ====================

@api_router.get("/promo-codes")
async def get_promo_codes():
    codes = await db.promo_codes.find().to_list(100)
    for c in codes:
        c["id"] = str(c.get("_id", c.get("id")))
    return codes

@api_router.post("/promo-codes")
async def create_promo_code(promo: PromoCodeCreate):
    promo_dict = promo.dict()
    promo_dict["id"] = str(uuid.uuid4())
    promo_dict["code"] = promo.code.upper()
    promo_dict["uses_count"] = 0
    await db.promo_codes.insert_one(promo_dict)
    return promo_dict

@api_router.post("/promo-codes/validate")
async def validate_promo_code(code: str = Query(...), subtotal: float = Query(...)):
    promo = await db.promo_codes.find_one({"code": code.upper(), "is_active": True})
    if not promo:
        raise HTTPException(status_code=400, detail="Invalid promo code")
    if promo.get("min_order_amount", 0) > subtotal:
        raise HTTPException(status_code=400, detail=f"Minimum order amount is Rs {promo['min_order_amount']}")
    if promo.get("max_uses") and promo.get("uses_count", 0) >= promo["max_uses"]:
        raise HTTPException(status_code=400, detail="Promo code has reached maximum uses")
    if promo.get("expires_at") and datetime.utcnow() > promo["expires_at"]:
        raise HTTPException(status_code=400, detail="Promo code has expired")
    
    discount_amount = promo["discount_value"] if promo["discount_type"] == "fixed" else (subtotal * promo["discount_value"] / 100)
    return {"code": promo["code"], "discount_amount": min(discount_amount, subtotal)}

@api_router.delete("/promo-codes/{promo_id}")
async def delete_promo_code(promo_id: str):
    result = await db.promo_codes.delete_one({"id": promo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    return {"message": "Promo code deleted"}

# ==================== PAYMENT METHODS ENDPOINTS ====================

@api_router.get("/payment-methods")
async def get_payment_methods():
    methods = await db.payment_methods.find({"is_active": True}).sort("sort_order", 1).to_list(20)
    for m in methods:
        m["id"] = str(m.get("_id", m.get("id")))
    return methods

@api_router.get("/payment-methods/all")
async def get_all_payment_methods():
    methods = await db.payment_methods.find().sort("sort_order", 1).to_list(20)
    for m in methods:
        m["id"] = str(m.get("_id", m.get("id")))
    return methods

@api_router.post("/payment-methods")
async def create_payment_method(method: PaymentMethodCreate):
    method_dict = method.dict()
    method_dict["id"] = str(uuid.uuid4())
    await db.payment_methods.insert_one(method_dict)
    return method_dict

@api_router.put("/payment-methods/{method_id}")
async def update_payment_method(method_id: str, method: PaymentMethodCreate):
    result = await db.payment_methods.update_one({"id": method_id}, {"$set": method.dict()})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return {"message": "Payment method updated"}

@api_router.delete("/payment-methods/{method_id}")
async def delete_payment_method(method_id: str):
    result = await db.payment_methods.delete_one({"id": method_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return {"message": "Payment method deleted"}

# ==================== CONTACTS ENDPOINTS ====================

@api_router.get("/contacts")
async def get_contacts():
    contacts = await db.contacts.find({"is_active": True}).to_list(20)
    for c in contacts:
        c["id"] = str(c.get("_id", c.get("id")))
    return contacts

@api_router.post("/contacts")
async def create_contact(contact: ContactCreate):
    contact_dict = contact.dict()
    contact_dict["id"] = str(uuid.uuid4())
    await db.contacts.insert_one(contact_dict)
    return contact_dict

# ==================== BLOG ENDPOINTS ====================

@api_router.get("/blog")
async def get_blog_posts():
    posts = await db.blog_posts.find({"is_published": True}).sort("created_at", -1).to_list(100)
    for p in posts:
        p["id"] = str(p.get("_id", p.get("id")))
    return posts

@api_router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug, "is_published": True})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    post["id"] = str(post.get("_id", post.get("id")))
    return post

@api_router.post("/blog")
async def create_blog_post(post: BlogPostCreate):
    post_dict = post.dict()
    post_dict["id"] = str(uuid.uuid4())
    post_dict["slug"] = post.slug or generate_slug(post.title)
    post_dict["created_at"] = datetime.utcnow()
    await db.blog_posts.insert_one(post_dict)
    return post_dict

# ==================== NOTIFICATION BAR ENDPOINTS ====================

@api_router.get("/notification-bar")
async def get_notification_bar():
    notification = await db.settings.find_one({"key": "notification_bar"})
    if not notification:
        return {"text": "", "link_url": "", "is_active": False}
    return notification

@api_router.put("/notification-bar")
async def update_notification_bar(data: NotificationBarUpdate):
    await db.settings.update_one(
        {"key": "notification_bar"},
        {"$set": {"key": "notification_bar", **data.dict()}},
        upsert=True
    )
    return {"message": "Notification bar updated"}

# ==================== SETTINGS ENDPOINTS ====================

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"key": "pricing"})
    if not settings:
        return {"service_charge": 0, "tax_percentage": 0, "tax_label": "Tax"}
    return settings

@api_router.put("/settings")
async def update_settings(data: SettingsUpdate):
    await db.settings.update_one(
        {"key": "pricing"},
        {"$set": {"key": "pricing", **data.dict()}},
        upsert=True
    )
    return {"message": "Settings updated"}

# ==================== CREDITS ENDPOINTS ====================

@api_router.get("/credits/settings")
async def get_credit_settings():
    settings = await db.settings.find_one({"key": "credits"})
    if not settings:
        return {"cashback_percentage": 5, "is_enabled": True}
    return settings

@api_router.put("/credits/settings")
async def update_credit_settings(data: CreditSettings):
    await db.settings.update_one(
        {"key": "credits"},
        {"$set": {"key": "credits", **data.dict()}},
        upsert=True
    )
    return {"message": "Credit settings updated"}

@api_router.get("/credits/balance")
async def get_credit_balance(email: str = Query(...)):
    customer = await db.customers.find_one({"email": email.lower()})
    if not customer:
        return {"credit_balance": 0}
    return {"credit_balance": customer.get("credit_balance", 0)}

@api_router.post("/credits/adjust")
async def adjust_credits(data: CreditAdjust):
    result = await db.customers.update_one(
        {"email": data.customer_email.lower()},
        {"$inc": {"credit_balance": data.amount}},
        upsert=True
    )
    await db.credit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "customer_email": data.customer_email.lower(),
        "amount": data.amount,
        "reason": data.reason,
        "created_at": datetime.utcnow()
    })
    return {"message": "Credits adjusted"}

# ==================== WISHLIST ENDPOINTS ====================

@api_router.get("/wishlist/{visitor_id}")
async def get_wishlist(visitor_id: str):
    items = await db.wishlist.find({"visitor_id": visitor_id}).to_list(100)
    for item in items:
        item["id"] = str(item.get("_id", item.get("id")))
        product = await db.products.find_one({"id": item.get("product_id")})
        if product:
            product["id"] = str(product.get("_id", product.get("id")))
            item["product"] = product
    return items

@api_router.post("/wishlist")
async def add_to_wishlist(visitor_id: str = Body(...), product_id: str = Body(...), variation_id: str = Body(None)):
    existing = await db.wishlist.find_one({"visitor_id": visitor_id, "product_id": product_id})
    if existing:
        return {"message": "Already in wishlist"}
    await db.wishlist.insert_one({
        "id": str(uuid.uuid4()),
        "visitor_id": visitor_id,
        "product_id": product_id,
        "variation_id": variation_id,
        "created_at": datetime.utcnow()
    })
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{visitor_id}/{product_id}")
async def remove_from_wishlist(visitor_id: str, product_id: str, variation_id: str = None):
    query = {"visitor_id": visitor_id, "product_id": product_id}
    if variation_id:
        query["variation_id"] = variation_id
    result = await db.wishlist.delete_one(query)
    return {"message": "Removed from wishlist"}

@api_router.put("/wishlist/{visitor_id}/email")
async def update_wishlist_email(visitor_id: str, email: str = Query(...)):
    await db.wishlist.update_many({"visitor_id": visitor_id}, {"$set": {"email": email.lower()}})
    return {"message": "Email updated"}

# ==================== RECENT PURCHASES ENDPOINTS ====================

@api_router.get("/recent-purchases")
async def get_recent_purchases(limit: int = 10):
    orders = await db.orders.find({"status": {"$in": ["Completed", "Confirmed"]}}).sort("created_at", -1).limit(limit).to_list(limit)
    purchases = []
    for order in orders:
        if order.get("items"):
            item = order["items"][0]
            purchases.append({
                "customer_name": order.get("customer_name", "Someone"),
                "product_name": item.get("name", "a product")
            })
    return purchases

# ==================== BUNDLES ENDPOINTS ====================

@api_router.get("/bundles")
async def get_bundles():
    bundles = await db.bundles.find({"is_active": True}).to_list(50)
    for b in bundles:
        b["id"] = str(b.get("_id", b.get("id")))
    return bundles

# ==================== NEWSLETTER ENDPOINTS ====================

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    existing = await db.newsletter_subscribers.find_one({"email": data.email.lower()})
    if existing:
        return {"message": "You're already subscribed!"}
    await db.newsletter_subscribers.insert_one({
        "id": str(uuid.uuid4()),
        "email": data.email.lower(),
        "subscribed_at": datetime.utcnow()
    })
    return {"message": "Successfully subscribed to newsletter!"}

# ==================== UPLOAD ENDPOINTS ====================

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    result = await upload_to_imgbb(contents, file.filename)
    return result

@api_router.post("/upload/payment")
async def upload_payment_image(file: UploadFile = File(...)):
    contents = await file.read()
    result = await upload_to_imgbb(contents, f"payment_{file.filename}")
    return result

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "GameShop Nepal API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
