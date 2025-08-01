import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

SERPAPI_KEY = "7c7e2cc90321eba9002ad963a2d7db55849fbe55644d965c45242c9721cb609e"  # Replace with your actual key

def get_store_links(product_name):
    search_query = product_name.replace(" ", "+")
    return {
        "Blinkit": f"https://blinkit.com/s/?q={search_query}",
        "Zepto": f"https://www.zeptonow.com/search?q={search_query}",
        "Instamart": f"https://www.swiggy.com/instamart?q={search_query}",
    }

def fetch_direct_product_links(product_name):
    search_query = f"{product_name} site:blinkit.com OR site:zeptonow.com OR site:swiggy.com"
    url = f"https://serpapi.com/search.json?q={search_query}&api_key={SERPAPI_KEY}"

    response = requests.get(url)
    if response.status_code == 200:
        results = response.json().get("organic_results", [])
        direct_links = {}

        for result in results:
            link = result.get("link")
            title = result.get("title", product_name)
            if "blinkit.com" in link:
                direct_links["Blinkit"] = {"url": link, "name": title}
            elif "zeptonow.com" in link:
                direct_links["Zepto"] = {"url": link, "name": title}
            elif "swiggy.com" in link:
                direct_links["Instamart"] = {"url": link, "name": title}

        return direct_links
    return None

@app.route('/api/products', methods=['GET'])
def get_products():
    product_query = request.args.get('product')
    if not product_query:
        return jsonify({"error": "No product name provided."}), 400

    store_links = get_store_links(product_query)
    direct_links = fetch_direct_product_links(product_query)

    return jsonify({
        "product": product_query,
        "store_links": store_links,
        "direct_links": direct_links or {}
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
