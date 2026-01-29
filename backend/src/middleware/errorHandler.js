import CircuitBreaker from 'opossum';

/**
 * Circuit breaker options for Upstox API calls
 */
const circuitBreakerOptions = {
    timeout: 10000, // 10 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30 seconds
    name: 'upstoxAPI'
};

/**
 * Create circuit breaker for a function
 */
export function createCircuitBreaker(fn, options = {}) {
    const breaker = new CircuitBreaker(fn, { ...circuitBreakerOptions, ...options });

    breaker.on('open', () => {
        console.warn('⚠️  Circuit breaker opened - too many failures');
    });

    breaker.on('halfOpen', () => {
        console.log('🔄 Circuit breaker half-open - testing recovery');
    });

    breaker.on('close', () => {
        console.log('✅ Circuit breaker closed - service recovered');
    });

    return breaker;
}

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
    console.error('❌ Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Circuit breaker errors
    if (err.name === 'CircuitBreakerOpenError') {
        return res.status(503).json({
            error: 'Service temporarily unavailable. Please try again later.'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // Authentication errors
    if (err.name === 'UnauthorizedError' || err.message.includes('Unauthorized')) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An error occurred'
        : err.message;

    res.status(statusCode).json({
        error: message
    });
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Route not found'
    });
}
