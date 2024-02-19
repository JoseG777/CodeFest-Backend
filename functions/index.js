const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const {GoogleGenerativeAI} = require("@google/generative-ai");

const app = express();

app.use(cors({origin: true}));

app.use(express.json());

app.get("/test", (req, res) => {
  res.send("CORS test successful");
});

const amadeusApiKey = functions.config().amadeus.apikey;
const amadeusApiSecret = functions.config().amadeus.apisecret;

// Amadeus API Routes
const TOKEN_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";
const API_URL = "https://test.api.amadeus.com/v2/shopping/flight-offers";

app.post("/amadeus/token", async (req, res) => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", amadeusApiKey);
  params.append("client_secret", amadeusApiSecret);

  try {
    const response = await axios.post(TOKEN_URL, params, {
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error getting access token:", error);
    res.status(500).send("Error getting access token");
  }
});

app.get("/amadeus/search", async (req, res) => {
  const {
    origin, destination, departureDate, returnDate, adults,
    children, infants, travelClass, nonStop,
  } = req.query;

  try {
    const accessTokenResponse = await axios.post(TOKEN_URL, {
      grant_type: "client_credentials",
      client_id: amadeusApiKey,
      client_secret: amadeusApiSecret,
    }, {
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
    });

    const accessToken = accessTokenResponse.data.access_token;
    const responseUrl =
      `${API_URL}?originLocationCode=${origin}&` +
      `destinationLocationCode=${destination}` +
      `&departureDate=${departureDate}&` +
      `returnDate=${returnDate}&adults=${adults}` +
      `&children=${children}&infants=${infants}&travelClass=${travelClass}` +
      `&nonStop=${nonStop}&currencyCode=USD&max=1`;

    const flightResponse = await axios.get(responseUrl, {
      headers: {"Authorization": `Bearer ${accessToken}`},
    });

    res.json(flightResponse.data);
  } catch (error) {
    console.error("Error fetching flights:", error);
    res.status(500).send("Error fetching flights");
  }
});

// Google API Routes
const googleApiKey = functions.config().google.apikey;
const genAI = new GoogleGenerativeAI(googleApiKey);

app.post("/api/generateContent", async (req, res) => {
  const {query, model = "gemini-pro"} = req.body;
  try {
    const genModel = genAI.getGenerativeModel({model});
    const results = await genModel.generateContent(query);
    res.json(results);
  } catch (error) {
    console.error("ERROR: ", error);
    res.status(500).send("ERROR, try again");
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).send("404: Page not found");
});

// Export the API as a Cloud Function
exports.api = functions.https.onRequest(app);
