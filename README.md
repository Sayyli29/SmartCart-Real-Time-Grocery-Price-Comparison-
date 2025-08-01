# SmartCart – Real-Time Grocery Price Comparison App

SmartCart is a web-based application that helps users compare real-time prices of grocery items across platforms like Blinkit, Zepto, and Instamart. It allows users to search for products, view comparative prices, and get redirected directly to vendor-specific product pages via deep links with referral tracking.

## Features

- Real-Time Product Search  
  Users can search for daily-use grocery items (like milk, atta, butter, etc.).

- Price Comparison Across Platforms  
  SERP API is used to fetch product prices from multiple vendors.

- Deep Linking  
  Users are redirected to the exact product page on the vendor’s site (Blinkit/Zepto/Instamart).

- NLP Chatbot Interface (Optional Feature)  
  Enables natural language queries like “show me the cheapest milk near me.”

- Location Integration  
  Results are optimized based on the user’s real-time location.

## Technologies Used

| Layer        | Tools/Frameworks                            |
|--------------|---------------------------------------------|
| Frontend     | HTML, CSS (Tailwind), JavaScript            |
| Backend      | Python, Flask                               |
| APIs         | SERP API, Geolocation API                   |
| AI/ML        | GPT-2 (initial price prediction fallback)   |

## How It Works

1. User searches a product (e.g., "milk").
2. Frontend sends a request to `/api/products?product=milk`.
3. Flask backend calls SERP API to get product titles, prices, and links.
4. Results are normalized and returned in JSON format.
5. Frontend displays product cards with prices and “Buy Now” buttons.
6. Clicking "Buy Now" redirects the user to the specific product page with tracking.

## How to Run Locally

1. Clone the repository  
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
