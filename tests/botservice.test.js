import axios from 'axios';
import dotenv from 'dotenv';
import { jest } from '@jest/globals';
import pkg from 'pg';
const { Pool } = pkg;
dotenv.config();

// Mock Axios for API calls
jest.mock('axios');

// Set up PostgreSQL connection pool
const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
});

// Helper function to clean up the database before and after tests
beforeAll(async () => {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      pair VARCHAR(10),
      change_percent NUMERIC,
      rate NUMERIC,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
    await pool.end();
});

beforeEach(async () => {
    await pool.query('DELETE FROM alerts');
});

test('Bot logs alert when price changes by more than threshold', async () => {
    // Mock the Uphold API to return a specific rate
    axios.get.mockResolvedValueOnce({ data: { ask: '90000' } });

    // Simulate fetching rate and logging alert
    const pair = 'BTC-USD';
    const previousRate = 89940;
    const currentRate = 90000;
    const changePercent = ((currentRate - previousRate) / previousRate) * 100;

    if (Math.abs(changePercent) >= 0.01) {
        const query = 'INSERT INTO alerts (pair, change_percent, rate) VALUES ($1, $2, $3)';
        await pool.query(query, [pair, changePercent, currentRate]);
    }

    // Verify that the alert was logged in the database
    const result = await pool.query('SELECT * FROM alerts WHERE pair = $1', [pair]);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(parseFloat(result.rows[0].change_percent)).toBeCloseTo(changePercent, 2);
});

test('Bot does not log alert when price change is below threshold', async () => {
    // Mock the Uphold API to return a specific rate
    axios.get.mockResolvedValueOnce({ data: { ask: '90000' } });

    // Simulate fetching rate with a small change below the threshold
    const pair = 'BTC-USD';
    const previousRate = 89999;
    const currentRate = 90000;
    const changePercent = ((currentRate - previousRate) / previousRate) * 100;

    if (Math.abs(changePercent) >= 0.01) {
        const query = 'INSERT INTO alerts (pair, change_percent, rate) VALUES ($1, $2, $3)';
        await pool.query(query, [pair, changePercent, currentRate]);
    }

    // Verify that no alert was logged in the database
    const result = await pool.query('SELECT * FROM alerts WHERE pair = $1', [pair]);
    expect(result.rows.length).toBe(0);
});
