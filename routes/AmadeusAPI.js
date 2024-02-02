const express = require('express');
const axios = require('axios');
const router = express.Router();

const TOKEN_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const API_URL = "https://test.api.amadeus.com/v2/shopping/flight-offers";

const amadeusApiKey = process.env.AMADEUS_API_KEY;
const amadeusApiSecret = process.env.AMADEUS_API_SECRET;

router.post('/token', async (req, res) => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', amadeusApiKey);
    params.append('client_secret', amadeusApiSecret);

    try {
        const response = await axios.post(TOKEN_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error getting access token:', error);
        res.status(500).send('Error getting access token');
    }
});

router.get('/search', async (req, res) => {
    const {
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        children,
        infants,
        travelClass,
        nonStop
    } = req.query;

    try {
        const accessTokenResponse = await axios.post(TOKEN_URL, {
            grant_type: 'client_credentials',
            client_id: amadeusApiKey,
            client_secret: amadeusApiSecret
        }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = accessTokenResponse.data.access_token;

        //${origin} and ${destination} 
        const flightResponse = await axios.get(`${API_URL}?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&returnDate=${returnDate}&adults=${adults}&children=${children}&infants=${infants}&travelClass=${travelClass}&nonStop=${nonStop}&currencyCode=USD&max=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        res.json(flightResponse.data);
    } catch (error) {
        console.error('Error fetching flights:', error);
        res.status(500).send('Error fetching flights');
    }
});

module.exports = router;
