import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

// Validate Upstox environment variables
const requiredEnvVars = ['UPSTOX_API_KEY', 'UPSTOX_API_SECRET', 'UPSTOX_REDIRECT_URI'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Cache for OAuth tokens (TTL: 24 hours)
const tokenCache = new NodeCache({ stdTTL: 86400 });

export const upstoxConfig = {
    apiKey: process.env.UPSTOX_API_KEY,
    apiSecret: process.env.UPSTOX_API_SECRET,
    redirectUri: process.env.UPSTOX_REDIRECT_URI,
    authUrl: 'https://api.upstox.com/v2/login/authorization/dialog',
    tokenUrl: 'https://api.upstox.com/v2/login/authorization/token',
    wsAuthUrl: 'https://api.upstox.com/v2/feed/market-data-feed/authorize',
    baseUrl: 'https://api.upstox.com/v2'
};

/**
 * Get authorization URL for OAuth flow
 */
export function getAuthorizationUrl() {
    const params = new URLSearchParams({
        client_id: upstoxConfig.apiKey,
        redirect_uri: upstoxConfig.redirectUri,
        response_type: 'code'
    });

    return `${upstoxConfig.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code) {
    try {
        const response = await axios.post(
            upstoxConfig.tokenUrl,
            {
                code,
                client_id: upstoxConfig.apiKey,
                client_secret: upstoxConfig.apiSecret,
                redirect_uri: upstoxConfig.redirectUri,
                grant_type: 'authorization_code'
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            }
        );

        const { access_token, expires_in } = response.data;

        // Cache token with TTL (refresh 5 minutes before expiry)
        const ttl = expires_in ? expires_in - 300 : 86400;
        tokenCache.set('upstox_access_token', access_token, ttl);

        console.log('✅ Upstox access token obtained and cached');
        return access_token;
    } catch (error) {
        console.error('❌ Error exchanging code for token:', error.response?.data || error.message);
        throw new Error('Failed to obtain Upstox access token');
    }
}

/**
 * Get cached access token
 */
export function getAccessToken() {
    const token = tokenCache.get('upstox_access_token');
    if (!token) {
        throw new Error('No valid Upstox access token found. Please authenticate first.');
    }
    return token;
}

/**
 * Set access token manually (for testing or manual auth)
 */
export function setAccessToken(token, ttl = 86400) {
    tokenCache.set('upstox_access_token', token, ttl);
    console.log('✅ Upstox access token set manually');
}

/**
 * Get WebSocket authorization URL
 */
export async function getWebSocketAuthUrl() {
    try {
        const token = getAccessToken();
        const response = await axios.get(upstoxConfig.wsAuthUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const { authorizedRedirectUri } = response.data.data;
        console.log('✅ WebSocket authorization URL obtained');
        return authorizedRedirectUri;
    } catch (error) {
        console.error('❌ Error getting WebSocket auth URL:', error.response?.data || error.message);
        throw new Error('Failed to get WebSocket authorization URL');
    }
}

/**
 * Fetch historical candle data
 */
export async function getHistoricalData(instrumentKey, interval = '1minute', toDate = new Date()) {
    try {
        const token = getAccessToken();
        const fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

        const response = await axios.get(
            `${upstoxConfig.baseUrl}/historical-candle/${instrumentKey}/${interval}/${toDate.toISOString()}/${fromDate.toISOString()}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        return response.data.data.candles;
    } catch (error) {
        console.error('❌ Error fetching historical data:', error.response?.data || error.message);
        throw new Error('Failed to fetch historical data');
    }
}

console.log('✅ Upstox config initialized');
