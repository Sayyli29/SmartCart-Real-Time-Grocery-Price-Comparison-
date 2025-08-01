from flask import Flask, jsonify, request
from flask_cors import CORS
import random
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Initialize AI price predictor
price_predictor = pipeline('text-generation', model='gpt2')

# ✅ Product Dataset (Only Product Names)
products_data = [
    {"name": "Amul Taaza Milk 500ml"},
    {"name": "Aashirvaad Atta 5kg"},
    {"name": "Fortune Sunflower Oil 1L"},
    {"name": "Tata Salt 1kg"},
    {"name": "Surf Excel Matic Detergent 1kg"},
    {"name": "Colgate Toothpaste 200g"},
    {"name": "Clinic Plus Shampoo 340ml"},
    {"name": "Parachute Coconut Oil 200ml"},
    {"name": "Maggi 2-Min Noodles 12-pack"},
    {"name": "Britannia Milk Bread 400g"},
    {"name": "Amul Butter 500g"},
    {"name": "Nestle Everyday Dairy Whitener 1kg"},
    {"name": "Dettol Handwash Refill 750ml"},
    {"name": "Lizol Floor Cleaner 2L"},
    {"name": "Haldiram’s Bhujia 400g"},
    {"name": "MDH Garam Masala 100g"},
    {"name": "Tata Tea Gold 500g"},
    {"name": "Brooke Bond Red Label Tea 1kg"},
    {"name": "Nescafe Classic Coffee 100g"},
    {"name": "Good Day Biscuits 200g"},
]

def generate_ai_price(product_name):
    """Generate AI-based price estimation for a product."""
    prompt = f"Predict the price of {product_name} on Blinkit, Zepto, and BigBasket in INR."

    # Generate AI-based prediction (text output)
    ai_output = price_predictor(prompt, max_length=50, num_return_sequences=1)[0]['generated_text']

    # Simulated AI-generated prices (replace this with actual AI parsing logic)
    prices = {
        "Blinkit": random.randint(100, 250),
        "Zepto": random.randint(105, 255),
        "BigBasket": random.randint(95, 245),
    }

    return prices


# ✅ Flask API to get products (All or Search by name)
@app.route('/api/products', methods=['GET'])
def get_products():
    product_query = request.args.get('product')
    
    if product_query:
        # Filter products from dataset
        filtered_products = [
            product for product in products_data
            if product_query.lower() in product['name'].lower()
        ]

        # If product exists, add AI price predictions
        if filtered_products:
            for product in filtered_products:
                product['prices'] = generate_ai_price(product['name'])
            return jsonify(filtered_products)

        # If product is not found, generate AI price predictions
        else:
            return jsonify([{
                "name": product_query,
                "prices": generate_ai_price(product_query),
                "message": "This product was not found in our database, but AI predicted its price."
            }])

    # Return all products if no query is made
    return jsonify(products_data)
