const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");

const SERP_API_KEY = '7c7e2cc90321eba9002ad963a2d7db55849fbe55644d965c45242c9721cb609e';

// Define the platforms for product search
const PLATFORMS = [
  { name: 'Blinkit', domain: 'blinkit.com' },
  { name: 'Zepto', domain: 'zeptonow.com' },
  { name: 'BigBasket', domain: 'bigbasket.com' },
  { name: 'JioMart', domain: 'jiomart.com' },
  { name: 'Swiggy Instamart', domain: 'swiggy.com/instamart' },
  { name: 'DMart', domain: 'dmart.in' },
  { name: 'Flipkart Grocery', domain: 'flipkart.com/grocery' }
];

// Middleware to parse JSON and handle CORS

app.use(express.json());
app.use(cors());  
app.use(require('cors')());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API route to handle search queries
app.get('/api/search', async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const allResults = [];

  // Search each platform concurrently
  await Promise.all(
    PLATFORMS.map(async (platform) => {
      try {
        const searchQuery = `site:${platform.domain} ${query}`;
        const response = await axios.get('https://serpapi.com/search', {
          params: {
            engine: 'google',
            q: searchQuery,
            api_key: SERP_API_KEY
          }
        });

        const organic = response.data.organic_results || [];
        if (organic.length > 0) {
          const topResult = organic[0];

          allResults.push({
            name: topResult.title,
            price: extractPrice(topResult.snippet || topResult.title),
            site: platform.name,
            link: topResult.link
          });
        }
      } catch (err) {
        console.error(`Error fetching from ${platform.name}:`, err.message);
      }
    })
  );

  res.json({ results: allResults });
});

// Function to extract price from text
function extractPrice(text) {
  const match = text.match(/₹\s?(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

//Example API Route
app.get("/api/products", (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query parameter missing" });

    const products = [
        { name: "Milk", price: 50 },
        { name: "Bread", price: 30 },
    ];

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

    res.json(filteredProducts);
});