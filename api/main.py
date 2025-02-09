from fastapi import FastAPI, Request
import os
from supabase import create_client , Client
from dotenv import load_dotenv
import bcrypt
from deploy_contract import deploy_contract
from chatbot import chatbot_test
from contract_functions import get_pseudo_balance
from sus_detector import detect_sus
from merkle import build_merkle_tree

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI()

@app.post("/create_user")
async def create_user(name: str, password: str , email: str, mobile_number: str, type: str,wallet_address: str,pancard_number: str):
    password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    response = (
        supabase.table("users")
        .insert({"name": name , "password": password , "type": type, "email_id": email , "mobile_number": mobile_number, "wallet_address": wallet_address, "pancard_number": pancard_number})
        .execute()
    )
    return {"status": "success"}
#https://en.wikipedia.org/wiki/Merkle_tree
@app.post("/create_merkle_root_for_order")
async def create_merkle_root_for_order(order_id: int):
    order = supabase.table("orders").select("*").eq("id", order_id).execute().data[0]
    leaves = [
        str(order["id"]),
        str(order["buyer_id"]),
        str(order["seller_id"]),
        str(order["item_id"]),
        str(order["quantity"]),
        str(order["cost"]),
        str(order["accepted"]),
        str(order["delivered"]),
        str(order["paid"])
    ]
    merkle_root = build_merkle_tree(leaves)
    response = (
        supabase.table("orders")
        .update({"merkle_root": merkle_root})
        .eq("id", order_id)
        .execute()
    )
    return response.data


@app.post("/create_order")
async def create_order(buyer_id: int, seller_id: int, item_id: int, quantity: int):
    cost = supabase.table("seller_items").select("price").eq("id", item_id).execute().data[0]["price"] * quantity
    response = (
        supabase.table("orders")
        .insert({"buyer_id": buyer_id , "seller_id": seller_id , "item_id": item_id , "quantity": quantity,"cost":cost,"accepted": False, "delivered": False, "paid": False})
        .execute()
    )
    await create_merkle_root_for_order(response.data[0]["id"])
    return response

@app.get("/get_confirmed_orders")
async def get_confirmed_orders(buyer_id: int):
    response = supabase.table("orders").select(
        "*, seller_items!orders_item_id_fkey(product_name:product_name)"
    ).eq("buyer_id", buyer_id).eq("accepted", True).eq("paid",False).execute()
    transformed_data = [{
        "id": order["id"],
        "quantity": order["quantity"],
        "accepted": order["accepted"],
        "delivered": order["delivered"],
        "paid": order["paid"],
        "cost": order["cost"],
        "seller_id": order["seller_id"],
        "buyer_id": order["buyer_id"],
        "item_id": order["item_id"],
        "contract_address": order["contract_address"],
        "accepted_at": order["accepted_at"],
        "paid_at": order["paid_at"],
        "product_name": order["seller_items"]["product_name"]
    } for order in response.data]
    return transformed_data

@app.get("/get_seller_score")
async def get_seller_score(seller_id: int):
    response = supabase.table("users").select("score").eq("id", seller_id).execute()
    return response.data

@app.post("/remove_listing")
async def remove_listing(seller_id: int, item_id: int):
    response = (
        supabase.table("seller_items")
        .delete()
        .eq("seller_id", seller_id)
        .eq("id", item_id)
        .execute()
    )
    return response.data

@app.post("/update_listing")
async def update_listing(seller_id: int, item_id: int, product_name: str, price: float, quantity: int):
    response = (
        supabase.table("seller_items")
        .update({"product_name": product_name, "price": price, "quantity": quantity})
        .eq("seller_id", seller_id)
        .eq("id", item_id)
        .execute()
    )
    return response.data

@app.post("/order_delivered")
async def order_delivered(order_id: int):
    response = (
        supabase.table("orders")
        .update({"delivered": True , "delivered_at": "now()"})
        .eq("id", order_id)
        .execute()
    )
    shipment_expected_date = supabase.table("orders").select("shipment_expected_date").eq("id", order_id).execute().data[0]["shipment_expected_date"]
    delivery_data = supabase.table("orders").select("delivered_at").eq("id", order_id).execute().data[0]["delivered_at"]
    seller_id = supabase.table("orders").select("seller_id").eq("id", order_id).execute().data[0]["seller_id"]
    if delivery_data > shipment_expected_date:
        current_score = supabase.table("users").select("score").eq("id", seller_id).execute().data[0]["score"]
        response_ = (
            supabase.table("users")
            .update({"score": current_score - 1})
            .eq("id", seller_id)
            .execute()
        )
    return response.data

@app.post("/chatbot")
async def chatbot(request: Request):
    arr = request.headers.get('chat')
    if not arr:
        return {"status": "error", "message": "Empty array"}
    chatbot_response = chatbot_test(arr)
    return {"status": "success", "message": chatbot_response}

@app.post("/update_shipment_details")
async def update_shipment_details(order_id: int, tracking_id: int , shipment_company_name: str, shipment_company_contact: str, shipment_expected_date: str):
    response = (
        supabase.table("orders")
        .update({"tracking_id": tracking_id, "shipment_company_name": shipment_company_name, "shipment_company_contact": shipment_company_contact, "shipment_expected_date": shipment_expected_date , "shipped": True})
        .eq("id", order_id)
        .execute()
    )
    return response.data
@app.post("/received_shipment")
async def received_shipment(order_id: int):
    response = (
        supabase.table("orders")
        .update({"received": True})
        .eq("id", order_id)
        .execute()
    )
    return response.data


@app.get("/get_past_orders")
async def get_past_orders(buyer_id: int):
    response = supabase.table("orders").select("*").eq("buyer_id", buyer_id).eq("delivered", True).eq("received",True).execute()
    return response.data


@app.get("/get_active_orders_payment_not_done")
async def get_active_orders_payment_not_done(order_id: int):
    response = supabase.table("orders").select("*").eq("id", order_id).eq("accepted", True).eq("paid", False).execute()
    return response.data

@app.get("/get_active_orders_payment_confirmed")
async def get_active_orders_payment_confirmed(buyer_id: int):
    response = supabase.table("orders").select("*").eq("buyer_id", buyer_id).eq("accepted", True).eq("paid", True).eq("received",False).execute()
    return response.data

@app.get("/get_wating_orders")
async def get_wating_orders(buyer_id: int):
    response = supabase.table("orders").select("*").eq("buyer_id", buyer_id).eq("accepted", False).execute()
    return response.data

@app.post("/payment_confirmed")
async def payment_confirmed(order_id: int):
    response = (
        supabase.table("orders")
        .update({"paid": True , "paid_at": "now()"})
        .eq("id", order_id)
        .execute()
    )
    return response

@app.post("/reject_order")
async def reject_order(order_id: int):
    response = (
        supabase.table("orders")
        .delete()
        .eq("id", order_id)
        .execute()
    )
    return response

@app.post("/accept_order")
async def accept_order(order_id: int):
    order = supabase.table("orders").select("*").eq("id", order_id).execute()
    buyer_adress = supabase.table("users").select("wallet_address").eq("id", order.data[0]["buyer_id"]).execute().data[0]["wallet_address"]
    seller_adress = supabase.table("users").select("wallet_address").eq("id", order.data[0]["seller_id"]).execute().data[0]["wallet_address"]

    contract_adress = deploy_contract(buyer_adress,seller_adress)

    supabase.table("orders").update({"contract_address": contract_adress}).eq("id", order_id).execute()

    if not order.data:
        return {"status": "error", "message": "Order not found"}
    
    item_id = order.data[0]["item_id"]
    order_quantity = order.data[0]["quantity"]
    
    supabase.table("seller_items")\
        .update({"quantity": supabase.table("seller_items")\
            .select("quantity")\
            .eq("id", item_id)\
            .execute()\
            .data[0]["quantity"] - order_quantity})\
        .eq("id", item_id)\
        .execute()
    
    response = (
        supabase.table("orders")
        .update({"accepted": True, "accepted_at": "now()"})
        .eq("id", order_id)
        .execute()
    )
    return response.data

@app.post("/paid_order")
async def paid_order(order_id: int):
    response = (
        supabase.table("orders")
        .update({"paid": True,"paid_at": "now()"})
        .eq("id", order_id)
        .execute()
    )
    return response

@app.post("/check_sellers_orders")
async def check_sellers_orders(seller_id: int):
    response = supabase.table("orders").select("*").eq("seller_id", seller_id).execute()
    return response.data

@app.get("/get_accepted_orders")
async def get_accepted_orders(seller_id: int):
    response = supabase.table("orders").select("*").eq("seller_id", seller_id).eq("accepted", True).eq("delivered",False).execute()
    return response.data


@app.get("/not_accepted_orders")
async def not_accepted_orders(seller_id: int):
    response = supabase.table("orders").select("*").eq("seller_id", seller_id).eq("accepted", False).eq("delivered",False).execute()
    return response.data

@app.get("/get_seller_past_orders")
async def get_seller_past_orders(seller_id: int):
    response = supabase.table("orders").select("*").eq("seller_id", seller_id).eq("accepted",True).eq("delivered", True).execute()
    return response.data

@app.get("/check_suspecious_transactions")
async def check_suspecious_transactions(order_id: int):
    contract_address = supabase.table("orders").select("contract_address").eq("id", order_id).execute().data[0]["contract_address"]
    buyer_address = supabase.table("users").select("wallet_address").eq("id", supabase.table("orders").select("buyer_id").eq("id", order_id).execute().data[0]["buyer_id"]).execute().data[0]["wallet_address"]
    seller_address = supabase.table("users").select("wallet_address").eq("id", supabase.table("orders").select("seller_id").eq("id", order_id).execute().data[0]["seller_id"]).execute().data[0]["wallet_address"]
    return detect_sus(contract_address, buyer_address, seller_address)


@app.post("/login")
async def login_user(email: str, password: str):
    response = (
        supabase.table("users").select("*").eq("email_id", email).execute()
    )
    
    if not response.data:
        return {"status": "error", "message": "User not found"}
    stored_password = response.data[0]["password"]
    if bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
        return {"status": "success", "type": response.data[0]["type"] , "id": response.data[0]["id"]}
    else:
        return {"status": "error", "message": "Invalid password"}

@app.get("/pseudo_balance_seller")
async def pseudo_balance_seller(seller_id: int):
    response = supabase.table("users").select("pseudo_balance").eq("id", seller_id).execute()
    return response.data

@app.post("/add_pseudo_balance")
async def add_pseudo_balance(seller_id: int , contract_address: str):
    current_pseudo_balance = supabase.table("users").select("pseudo_balance").eq("id", seller_id).execute().data[0]["pseudo_balance"]
    new_pseudo_balance = current_pseudo_balance + get_pseudo_balance(contract_address, seller_id)
    response = (
        supabase.table("users")
        .update({"pseudo_balance": new_pseudo_balance})
        .eq("id", seller_id)
        .execute()
    )
    return response.data

@app.post("/create_seller_products")
async def create_seller_products(seller_id: int, product_name: str, price: float, quantity: int):
    response = (
        supabase.table("seller_items")
        .insert({"seller_id": seller_id , "product_name": product_name , "price": price , "quantity": quantity})
        .execute()
    )
    return response

@app.get("/get_seller_products")
async def get_seller_products(seller_id: int):
    response = supabase.table("seller_items").select("*").eq("seller_id", seller_id).execute()
    return response.data

@app.get("/get_seller_product")
async def get_seller_product(seller_id: int, product_id: int):
    response = supabase.table("seller_items").select("*").eq("seller_id", seller_id).eq("id", product_id).execute()
    return response.data

@app.post("/create_seller_product")
async def create_seller_product(seller_id: int, product_name: str, price: float, quantity: int):
    response = (
        supabase.table("seller_items")
        .insert({"seller_id": seller_id , "product_name": product_name , "price": price , "quantity": quantity})
        .execute()
    )
    return {'status': 'success'}

@app.get("/get_all_sellers_product")
async def get_all_sellers_product():
    response = supabase.table("seller_items").select(
        "*, users!seller_items_seller_id_fkey(name:name)"
    ).execute()
    transformed_data = [{
        "id": item["id"],
        "product_name": item["product_name"],
        "quantity": item["quantity"],
        "price": item["price"],
        "seller_name": item["users"]["name"],
        "seller_id": item["seller_id"]
    } for item in response.data]
    return transformed_data
