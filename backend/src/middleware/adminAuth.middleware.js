/**
 * Middleware to protect admin-only routes (e.g. Upstox OAuth management).
 * Callers must pass the ADMIN_SECRET in the X-Admin-Secret header.
 * In production, set ADMIN_SECRET to a long random string in your .env file.
 */
export default function requireAdminSecret(req, res, next) {
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
        console.error('❌ ADMIN_SECRET is not set in environment variables');
        return res.status(500).json({ error: 'Server misconfiguration: admin secret not configured' });
    }

    const providedSecret = req.headers['x-admin-secret'];

    if (!providedSecret || providedSecret !== adminSecret) {
        console.warn(`⚠️  Unauthorized admin access attempt from ${req.ip}`);
        return res.status(403).json({ error: 'Forbidden: invalid or missing admin secret' });
    }

    next();
}
