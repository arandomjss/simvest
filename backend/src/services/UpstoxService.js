import axios from 'axios';

class UpstoxService {
    constructor() {
        this.apiKey = process.env.UPSTOX_API_KEY;
        this.apiSecret = process.env.UPSTOX_API_SECRET;
        this.redirectUri = process.env.UPSTOX_REDIRECT_URI;
        this.baseUrl = 'https://api.upstox.com/v2';
        this.adminAccessToken = null; // Single shared token for all users
    }

    /**
     * Generate Upstox login URL
     */
    getLoginUrl(state = 'random_state') {
        const params = new URLSearchParams({
            client_id: this.apiKey,
            redirect_uri: this.redirectUri,
            state: state,
        });
        return `https://api.upstox.com/v2/login/authorization/dialog?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async getAccessToken(code) {
        try {
            // Upstox requires URL-encoded format, not JSON
            const params = new URLSearchParams();
            params.append('code', code);
            params.append('client_id', this.apiKey);
            params.append('client_secret', this.apiSecret);
            params.append('redirect_uri', this.redirectUri);
            params.append('grant_type', 'authorization_code');

            console.log('🔍 Token Exchange Request Details:');
            console.log('URL:', `${this.baseUrl}/login/authorization/token`);
            console.log('Code:', code);
            console.log('Client ID:', this.apiKey);
            console.log('Redirect URI:', this.redirectUri);
            console.log('Grant Type:', 'authorization_code');
            console.log('Request Body:', params.toString());

            const response = await axios.post(
                `${this.baseUrl}/login/authorization/token`,
                params.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                    }
                }
            );

            console.log('✅ Token response received:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Token exchange failed');
            console.error('Error message:', error.message);
            console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error response status:', error.response?.status);
            console.error('Error response headers:', error.response?.headers);
            throw new Error(error.response?.data?.message || 'Failed to get access token');
        }
    }

    /**
     * Set admin access token (called after OAuth)
     */
    setAdminToken(token) {
        this.adminAccessToken = token;
        console.log('✅ Admin Upstox token set successfully');
    }

    /**
     * Get admin access token
     */
    getAdminToken() {
        return this.adminAccessToken;
    }

    /**
     * Check if admin is connected
     */
    isAdminConnected() {
        return this.adminAccessToken !== null;
    }

    /**
     * Get market quotes for instruments
     */
    async getQuotes(instrumentKeys, accessToken = null) {
        try {
            const token = accessToken || this.adminAccessToken;
            if (!token) {
                throw new Error('No access token available. Admin must connect to Upstox first.');
            }

            const params = new URLSearchParams();
            instrumentKeys.forEach(key => params.append('instrument_key', key));

            const response = await axios.get(`${this.baseUrl}/market-quote/quotes?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error getting quotes:', error.response?.data || error.message);
            throw new Error('Failed to get quotes');
        }
    }

    /**
     * Get historical candle data
     */
    async getHistoricalData(instrumentKey, interval, toDate, accessToken = null) {
        try {
            const token = accessToken || this.adminAccessToken;
            if (!token) {
                throw new Error('No access token available. Admin must connect to Upstox first.');
            }

            const response = await axios.get(
                `${this.baseUrl}/historical-candle/${instrumentKey}/${interval}/${toDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error getting historical data:', error.response?.data || error.message);
            throw new Error('Failed to get historical data');
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(accessToken) {
        try {
            const response = await axios.get(`${this.baseUrl}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error getting user profile:', error.response?.data || error.message);
            throw new Error('Failed to get user profile');
        }
    }

    /**
     * Get holdings
     */
    async getHoldings(accessToken) {
        try {
            const response = await axios.get(`${this.baseUrl}/portfolio/long-term-holdings`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error getting holdings:', error.response?.data || error.message);
            throw new Error('Failed to get holdings');
        }
    }

    /**
     * Get positions
     */
    async getPositions(accessToken) {
        try {
            const response = await axios.get(`${this.baseUrl}/portfolio/short-term-positions`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error getting positions:', error.response?.data || error.message);
            throw new Error('Failed to get positions');
        }
    }

    /**
     * Place order
     */
    async placeOrder(orderData, accessToken) {
        try {
            const response = await axios.post(`${this.baseUrl}/order/place`, orderData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error placing order:', error.response?.data || error.message);
            throw new Error('Failed to place order');
        }
    }

    /**
     * Get all orders
     */
    async getOrders(accessToken) {
        try {
            const response = await axios.get(`${this.baseUrl}/order/retrieve-all`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error getting orders:', error.response?.data || error.message);
            throw new Error('Failed to get orders');
        }
    }
}

export default new UpstoxService();
