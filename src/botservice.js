import axios from 'axios';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config(); // Load environment variables

// Default configuration
const DEFAULT_PAIRS = process.env.CURRENCY_PAIRS ? process.env.CURRENCY_PAIRS.split(',') : ['BTC-USD'];
const FETCH_INTERVAL = process.env.FETCH_INTERVAL ? parseInt(process.env.FETCH_INTERVAL) : 5000;
const THRESHOLD_PERCENT = process.env.THRESHOLD_PERCENT ? parseFloat(process.env.THRESHOLD_PERCENT) : 0.01;

// PostgreSQL connection pool setup
const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    max: process.env.PG_MAX_CLIENTS ? parseInt(process.env.PG_MAX_CLIENTS) : 10,
    idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT ? parseInt(process.env.PG_IDLE_TIMEOUT) : 30000,
});

// Function to log alerts into the database
async function logAlert(pair, changePercent, rate) {
    const query = 'INSERT INTO alerts (pair, change_percent, rate) VALUES ($1, $2, $3)';
    const values = [pair, changePercent, rate];

    try {
        await pool.query(query, values);
        console.log(`Alert logged for ${pair}: ${changePercent.toFixed(2)}% change at ${rate} USD`);
    } catch (error) {
        console.error('Error logging alert to database:', error.message);
    }
}

// Function to fetch rates for all currency pairs
async function fetchRates() {
    for (const pair of DEFAULT_PAIRS) {
        try {
            const response = await axios.get(`https://api.uphold.com/v0/ticker/${pair}`);
            const currentRate = parseFloat(response.data.ask);
            console.log(`Current Rate for ${pair}: ${currentRate} USD`);

            if (previousRates[pair] !== undefined) {
                const changePercent = ((currentRate - previousRates[pair]) / previousRates[pair]) * 100;
                if (Math.abs(changePercent) >= THRESHOLD_PERCENT) {
                    console.log(`Alert for ${pair}: Price changed by ${changePercent.toFixed(2)}%`);
                    await logAlert(pair, changePercent, currentRate);
                }
            }

            previousRates[pair] = currentRate;
        } catch (error) {
            console.error(`Error fetching rate for ${pair}:`, error.message);
        }
    }
}

let previousRates = {};

// Run the bot at the specified interval
setInterval(fetchRates, FETCH_INTERVAL);

// Gracefully close the PostgreSQL pool on exit
process.on('SIGINT', async () => {
    console.log('Closing database connection...');
    await pool.end();
    console.log('Database connection closed.');
    process.exit(0);
});
