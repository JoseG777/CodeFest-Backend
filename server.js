const express = require('express');
require('dotenv').config();
const app = express();

app.use(express.json());

const cors = require('cors');
app.use(cors());

const googleAIRoutes = require('./routes/GoogleAPI');
app.use('/api/generateContent', googleAIRoutes);

const AmadeusAPI = require('./routes/AmadeusAPI');
app.use('/amadeus', AmadeusAPI);

app.use((req, res, next) => {
  res.status(404).send("404: Page not found");
});

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
 