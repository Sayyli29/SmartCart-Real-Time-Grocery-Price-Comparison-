
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

SERPAPI_KEY = "35cddf5c29bf017dd4d9ed417d0bb269b6ca03b4d62ad2dc13b2f3903d2745e4"  # Replace with your actual key

from urllib.parse import quote_plus

def get_store_links(product_name):
    encoded = quote_plus(product_name.strip())
    return {
        "Blinkit": f"https://blinkit.com/s/?q={encoded}",
        "Zepto": f"https://www.zeptonow.com/search?q={encoded}",
        "Instamart": f"https://www.instamart.com/search/{encoded}"
    }


def fetch_direct_product_links(product_name):
    search_query = f"{product_name} site:blinkit.com OR site:zeptonow.com OR site:swiggy.com"
    url = f"https://serpapi.com/search.json?q={search_query}&api_key={SERPAPI_KEY}"

    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        results = data.get("organic_results", [])
        print(f"Found {len(results)} results")
        direct_links = {}

        for result in results:
            link = result.get("link")
            title = result.get("title", product_name)
            
            # Initialize price with default value
            price = "Price not available"
            
            # Try to extract price using multiple methods
            # Method 1: From rich snippet detected extensions
            rich_snippet = result.get("rich_snippet", {})
            if 'bottom' in rich_snippet and 'detected_extensions' in rich_snippet['bottom']:
                detected_extensions = rich_snippet['bottom']['detected_extensions']
                if 'price' in detected_extensions:
                    price = detected_extensions['price']
            
            # Method 2: Look for price in the title using regex
            import re
            price_pattern = r'₹(\d+(\.\d+)?)'  # Matches Indian Rupee symbol followed by numbers
            if price == "Price not available":
                price_match = re.search(price_pattern, title)
                if price_match:
                    price = float(price_match.group(1))
            
            # Method 3: Look for price in the snippet
            snippet = result.get("snippet", "")
            if price == "Price not available":
                price_match = re.search(price_pattern, snippet)
                if price_match:
                    price = float(price_match.group(1))
            
            # Determine which store the result belongs to
            if "blinkit.com" in link:
                direct_links["Blinkit"] = {"url": link, "name": title, "price": price}
            elif "zeptonow.com" in link:
                direct_links["Zepto"] = {"url": link, "name": title, "price": price}
            elif "swiggy.com" in link:
                direct_links["Instamart"] = {"url": link, "name": title, "price": price}

        # Print the extracted links and prices for debugging
        print("Extracted direct links with prices:")
        print(json.dumps(direct_links, indent=2))
        
        return direct_links
    return None


@app.route('/api/products', methods=['GET'])
def get_products():
    product_query = request.args.get('product')
    print("line 44 ",product_query)
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
