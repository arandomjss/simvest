import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

describe('Security Smoke Tests (Rate Limiting & CORS)', () => {

    describe('CORS Configuration', () => {
        test('Should allow requests from allowed origin (Frontend URL)', async () => {
            const res = await request(API_URL)
                .get('/health')
                .set('Origin', FRONTEND_URL);
            
            expect(res.headers['access-control-allow-origin']).toBe(FRONTEND_URL);
            expect(res.status).toBe(200);
        });

        test('Should not return Access-Control-Allow-Origin for unauthorized domains', async () => {
            const res = await request(API_URL)
                .get('/health')
                .set('Origin', 'http://malicious-site.com');
            
            expect(res.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
            // Depending on configuration, cors might omit the header or respond with an error.
            // Often it just returns 200 without the CORS headers, blocking the browser.
        });
    });

    describe('Rate Limiting (Auth Routes)', () => {
        // The auth limiter is configured to max 20 requests per 15 minutes.
        test('Should block excessive requests to /auth routes', async () => {
            let lastStatus = 200;
            // Send 22 requests to trigger the rate limiter
            for (let i = 0; i < 22; i++) {
                const res = await request(API_URL).post('/auth/register').send({});
                lastStatus = res.status;
                if (lastStatus === 429) break;
            }
            
            expect(lastStatus).toBe(429); // 429 Too Many Requests
        });
    });

    describe('Rate Limiting (API Routes)', () => {
        // The api limiter is configured to max 100 requests per 15 minutes.
        test('Should block excessive requests to /api routes', async () => {
            let lastStatus = 200;
            // Send 102 requests to trigger the rate limiter
            for (let i = 0; i < 102; i++) {
                const res = await request(API_URL).get('/api/market/quotes');
                lastStatus = res.status;
                if (lastStatus === 429) break;
            }
            
            expect(lastStatus).toBe(429); // 429 Too Many Requests
        }, 15000); // Increased timeout for multiple requests
    });
});
