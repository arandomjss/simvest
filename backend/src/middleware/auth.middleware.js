import { supabaseAnon } from '../config/supabase.config.js';

/**
 * Middleware to verify Supabase JWT token
 */
export default async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);

        // Retry logic for network issues
        let retries = 3;
        let lastError;

        while (retries > 0) {
            try {
                const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

                if (error) {
                    if (error.message?.includes('timeout') || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                        retries--;
                        lastError = error;
                        console.log(`Auth timeout, retrying... (${retries} attempts left)`);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                        continue;
                    }
                    return res.status(401).json({ error: 'Invalid token' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid token' });
                }

                req.userId = user.id;
                return next();
            } catch (networkError) {
                if (networkError.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                    networkError.message?.includes('timeout') ||
                    networkError.message?.includes('fetch failed')) {
                    retries--;
                    lastError = networkError;
                    console.log(`Network error, retrying... (${retries} attempts left):`, networkError.message);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                throw networkError;
            }
        }

        // If we get here, all retries failed
        console.error('Authentication failed after all retries:', lastError);
        return res.status(503).json({
            error: 'Service temporarily unavailable. Please try again later.',
            details: 'Authentication service connection failed'
        });

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}
