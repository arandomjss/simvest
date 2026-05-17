import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Third-Party Integrations Smoke Tests', () => {

    describe('Yahoo Finance Integration', () => {
        test('Should fetch quote for a known stock symbol', async () => {
            const res = await request(API_URL).get('/api/yahoo/quote/RELIANCE.NS').set('X-Forwarded-For', '192.168.1.100');
            
            // Depending on whether it hits the actual API or mock, it should return 200
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            // If it returns real data
            if (res.body.data && Object.keys(res.body.data).length > 0) {
                expect(res.body.data).toHaveProperty('symbol');
                expect(res.body.data).toHaveProperty('price');
            }
        });

        test('Should fetch historical data for a known stock symbol', async () => {
            const res = await request(API_URL).get('/api/yahoo/historical/RELIANCE.NS?interval=1d&period=1mo').set('X-Forwarded-For', '192.168.1.100');
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            if (Array.isArray(res.body.data) && res.body.data.length > 0) {
                expect(res.body.data[0]).toHaveProperty('close');
                expect(res.body.data[0]).toHaveProperty('date');
            }
        });
    });

    describe('OpenRouter (Advisor) Integration', () => {
        test('Should block unauthorized requests to advisor route', async () => {
            // Since this route is protected, we should expect a 401 without a valid token.
            const res = await request(API_URL).get('/api/advisor/analyze/RELIANCE').set('X-Forwarded-For', '192.168.1.100');
            
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('Upstox Integration', () => {
        test('Should check Upstox connection status', async () => {
            const res = await request(API_URL).get('/api/upstox/status').set('X-Forwarded-For', '192.168.1.100');
            
            // It should be 200 OK whether connected or disconnected
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('isConnected');
        });
    });

});
