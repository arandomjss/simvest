import { supabase } from '../config/supabase.config.js';

// Utility for strict currency rounding to prevent Postgres floating-point drift
const roundCurrency = (value) => Math.round(value * 100) / 100;

class TradingEngine {
    constructor(marketStreamService) {
        this.marketStream = marketStreamService;
        this.marketOpenTime = { hour: 9, minute: 15 };
        this.marketCloseTime = { hour: 15, minute: 30 };

        // Listen for price updates to trigger matching engine
        if (this.marketStream) {
            this.marketStream.on('priceUpdate', ({ instrumentKey, ltp }) => {
                this.processPendingOrders(instrumentKey, ltp);
            });
        }
    }

    /**
     * Check if NSE market is currently open
     */
    isMarketOpen() {
        // NSE Holidays 2024
        const nseHolidays2024 = [
            '2024-01-22', '2024-01-26', '2024-03-08', '2024-03-25', '2024-03-29', 
            '2024-04-11', '2024-04-17', '2024-05-01', '2024-05-20', '2024-06-17', 
            '2024-07-17', '2024-08-15', '2024-10-02', '2024-11-01', '2024-11-15', '2024-12-25'
        ];

        // NSE Holidays 2025
        const nseHolidays2025 = [
            '2025-02-26', '2025-03-14', '2025-03-31', '2025-04-10', '2025-04-14', 
            '2025-04-18', '2025-05-01', '2025-08-15', '2025-08-27', '2025-10-02', 
            '2025-10-21', '2025-11-05', '2025-12-25'
        ];

        // NSE Holidays 2026
        const nseHolidays2026 = [
            '2026-01-26', '2026-02-14', '2026-03-03', '2026-03-20', '2026-04-03',
            '2026-04-14', '2026-05-01', '2026-05-27', '2026-08-15', '2026-08-26',
            '2026-10-02', '2026-11-08', '2026-12-25'
        ];

        const allHolidays = new Set([...nseHolidays2024, ...nseHolidays2025, ...nseHolidays2026]);

        // Get current time in IST (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);

        const dateString = istTime.toISOString().split('T')[0];

        // Holiday check
        if (allHolidays.has(dateString)) return false;

        const day = istTime.getUTCDay(); // 0 is Sunday, 6 is Saturday
        const hour = istTime.getUTCHours();
        const minute = istTime.getUTCMinutes();

        // Weekend check
        if (day === 0 || day === 6) return false;

        const currentMinutes = hour * 60 + minute;
        const openMinutes = this.marketOpenTime.hour * 60 + this.marketOpenTime.minute;
        const closeMinutes = this.marketCloseTime.hour * 60 + this.marketCloseTime.minute;

        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }

    /**
     * Process pending orders for a specific instrument
     */
    async processPendingOrders(instrumentKey, currentPrice) {
        try {
            // Add retry logic for database connectivity issues
            let retries = 2; // Fewer retries for high-frequency operations
            let lastError;

            while (retries > 0) {
                try {
                    // Find all PENDING orders for this instrument
                    const { data: pendingOrders, error } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('instrument_key', instrumentKey)
                        .eq('status', 'PENDING');

                    if (error) {
                        // Check if it's a connection error
                        if (error.message?.includes('timeout') ||
                            error.message?.includes('fetch failed') ||
                            error.message?.includes('network')) {
                            retries--;
                            lastError = error;
                            if (retries > 0) {
                                await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay for high-frequency operations
                                continue;
                            }
                        }
                        throw error;
                    }

                    if (!pendingOrders || pendingOrders.length === 0) return;

                    for (const order of pendingOrders) {
                        let shouldExecute = false;

                        // Check execution conditions
                        if (order.type === 'BUY') {
                            // Buy Limit: Execute if current price <= limit price
                            if (currentPrice <= order.execution_price) {
                                shouldExecute = true;
                            }
                        } else if (order.type === 'SELL') {
                            // Sell Limit: Execute if current price >= limit price
                            if (currentPrice >= order.execution_price) {
                                shouldExecute = true;
                            }
                        }

                        if (shouldExecute) {
                            await this.executePendingOrder(order, currentPrice);
                        }
                    }
                    return; // Success, exit retry loop

                } catch (networkError) {
                    if (networkError.message?.includes('timeout') ||
                        networkError.message?.includes('fetch failed') ||
                        networkError.message?.includes('network')) {
                        retries--;
                        lastError = networkError;
                        if (retries > 0) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                            continue;
                        }
                    }
                    throw networkError;
                }
            }

            // If we get here, all retries failed
            if (lastError) {
                // Only log occasionally to avoid spam (every 10th attempt)
                if (Math.random() < 0.1) {
                    console.warn('Pending orders check failed after retries, skipping this update');
                }
                return;
            }

        } catch (error) {
            // Only log occasionally for network errors to avoid spam
            if (!error.message?.includes('timeout') &&
                !error.message?.includes('fetch failed') &&
                !error.message?.includes('network')) {
                console.error('Error processing pending orders:', error.message);
            }
        }
    }

    /**
     * Execute a matched pending order
     */
    async executePendingOrder(order, executionPrice) {
        try {
            const totalAmount = roundCurrency(executionPrice * order.quantity);

            console.log(`⚡ Match found! Executing Order #${order.id}: ${order.type} ${order.symbol} @ ${executionPrice}`);

            // ATOMIC STATUS UPDATE FIRST (Engine Latency Fix)
            // Prevent double-execution if two WebSocket ticks trigger simultaneously
            const { data: updatedOrder, error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'EXECUTED',
                    execution_price: executionPrice,
                    total_amount: totalAmount
                })
                .eq('id', order.id)
                .eq('status', 'PENDING') // Only update if still pending!
                .select()
                .maybeSingle();

            if (updateError) throw updateError;
            if (!updatedOrder) {
                console.log(`⚠️ Order #${order.id} was already executed or cancelled by another process. Aborting.`);
                return; // Another tick already executed it!
            }

            // ATOMIC ASSET GRANT
            if (order.type === 'BUY') {
                // For BUY, cash was already deducted when order was placed.
                // We just grant the shares and refund any positive difference if executed at a better price.
                const diff = roundCurrency((order.execution_price * order.quantity) - totalAmount);

                if (diff > 0) {
                    await supabase
                        .from('profiles')
                        .update({ virtual_balance: supabase.raw('virtual_balance + ?', [diff]) })
                        .eq('id', order.user_id);
                }

                // Grant Shares
                const { error: upsertError } = await supabase.rpc('upsert_holding', {
                    p_user_id: order.user_id,
                    p_symbol: order.symbol,
                    p_instrument_key: order.instrument_key,
                    p_quantity: order.quantity,
                    p_price: executionPrice
                });
                if (upsertError) console.error("❌ Failed to upsert holding:", upsertError);

            } else if (order.type === 'SELL') {
                // For SELL, shares were already deducted when order was placed.
                // We just grant the cash (totalAmount).
                await supabase
                    .from('profiles')
                    .update({ virtual_balance: supabase.raw('virtual_balance + ?', [totalAmount]) })
                    .eq('id', order.user_id);
            }

        } catch (error) {
            console.error(`❌ Failed to execute pending order #${order.id}:`, error.message);
        }
    }

    /**
     * Execute a virtual trade (BUY or SELL)
     */
    async executeTrade(userId, { symbol, instrumentKey, type, quantity, orderType = 'MARKET', limitPrice = 0, strategy, notes }) {
        try {
            // Validate inputs
            if (!['BUY', 'SELL'].includes(type)) {
                throw new Error('Invalid trade type. Must be BUY or SELL');
            }

            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
                throw new Error('Limit price is required for Limit orders');
            }

            // Get latest price from cache
            const currentPrice = this.marketStream.getCachedPrice(instrumentKey);

            if (!currentPrice) {
                if (orderType === 'MARKET') {
                    throw new Error('Price not available for Market Order. Please try again.');
                } else if (orderType === 'LIMIT') {
                    // Fallback to limit price for calculations if current price is missing,
                    // but reject if we have absolutely no cache data and can't verify it.
                    // Actually, if it's a LIMIT order, we can just accept it as PENDING.
                    // But to prevent NaN issues down the line, we need to ensure the instrument is real.
                }
            }

            // Determine execution price
            const executionPrice = roundCurrency(orderType === 'MARKET' ? currentPrice : limitPrice);
            const totalAmount = roundCurrency(executionPrice * quantity);

            // Start transaction
            if (type === 'BUY') {
                return await this.handleBuyOrder(userId, symbol, instrumentKey, quantity, executionPrice, totalAmount, orderType, currentPrice, strategy, notes);
            } else {
                return await this.handleSellOrder(userId, symbol, instrumentKey, quantity, executionPrice, totalAmount, orderType, currentPrice, strategy, notes);
            }

        } catch (error) {
            console.error('❌ Trade execution error:', error.message);
            throw error;
        }
    }

    async handleBuyOrder(userId, symbol, instrumentKey, quantity, price, totalAmount, orderType, currentPrice, strategy, notes) {
        // 0. Market Hours Check
        if (!this.isMarketOpen()) {
            const { error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: userId,
                    symbol,
                    instrument_key: instrumentKey,
                    type: 'BUY',
                    quantity,
                    execution_price: price,
                    total_amount: totalAmount,
                    status: 'FAILED',
                    strategy,
                    notes: notes ? `${notes} (Rejected: Market Closed)` : 'Rejected: Market Closed'
                });
            
            if (orderError) throw orderError;

            return {
                success: true,
                status: 'FAILED',
                message: `Buy Order for ${symbol} was rejected: Market is currently closed.`
            };
        }

               // 1 + 2. Atomically check AND deduct balance in a single SQL statement.
        // BUG-003 fix: The old SELECT-then-UPDATE pattern was a race condition — two concurrent
        // requests could both read the same balance, both pass the check, and both deduct.
        // This single UPDATE with WHERE virtual_balance >= totalAmount is atomic at the DB level.
        const { data: updatedProfile, error: balanceError } = await supabase
            .from('profiles')
            .update({ virtual_balance: supabase.raw('virtual_balance - ?', [totalAmount]) })
            .eq('id', userId)
            .gte('virtual_balance', totalAmount)   // Only updates if sufficient balance exists
            .select('virtual_balance')
            .maybeSingle();

        if (balanceError) throw balanceError;

        if (!updatedProfile) {
            // Either profile doesn't exist or balance was insufficient (race condition blocked)
            // Distinguish between missing profile and insufficient balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('virtual_balance')
                .eq('id', userId)
                .maybeSingle();

            if (!profile) throw new Error('User profile not found. Please contact support.');
            throw new Error('Insufficient virtual balance');
        }

        const newBalance = parseFloat(updatedProfile.virtual_balance);

        // 3. Check Execution
        // If MARKET: Execute Immediately
        // If LIMIT and currentPrice <= limitPrice: Execute Immediately (IOC logic favor)
        // Else: Create PENDING order
        let status = 'PENDING';
        let isExecuted = false;
        let finalExecPrice = price; // Default to limit price

        if (orderType === 'MARKET') {
            status = 'EXECUTED';
            isExecuted = true;
            finalExecPrice = currentPrice; // Market uses current
        } else if (orderType === 'LIMIT' && currentPrice && currentPrice <= price) {
            // Limit matched immediately
            status = 'EXECUTED';
            isExecuted = true;
            finalExecPrice = currentPrice; // Better price fill!

            // Refund the difference immediately since we blocked 'price' but executed at 'currentPrice'
            const diff = roundCurrency((price * quantity) - (finalExecPrice * quantity));
            if (diff > 0) {
                await supabase
                    .from('profiles')
                    .update({ virtual_balance: roundCurrency(newBalance + diff) })
                    .eq('id', userId);
            }
        }

        if (isExecuted) {
            // Use atomic upsert RPC to prevent TOCTOU race conditions
            const { error: upsertError } = await supabase.rpc('upsert_holding', {
                p_user_id: userId,
                p_symbol: symbol,
                p_instrument_key: instrumentKey,
                p_quantity: quantity,
                p_price: finalExecPrice
            });

            if (upsertError) {
                console.error("❌ Failed to upsert holding in handleBuyOrder:", upsertError);
            }
        }

        // 4. Create Order Record
        const { error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                symbol,
                instrument_key: instrumentKey,
                type: 'BUY',
                quantity,
                execution_price: finalExecPrice, // This effectively acts as 'limit price' for pending orders check
                total_amount: roundCurrency(finalExecPrice * quantity),
                status: status,
                strategy,
                notes
            }); // Note: should probably have separate column for 'limit_price' vs 'execution_price' but reusing for simplicity as per schema

        if (orderError) throw orderError;

        return {
            success: true,
            status,
            message: status === 'EXECUTED' ? `Successfully bought ${symbol}` : `Buy Order Placed for ${symbol} @ ${price}`,
            newBalance
        };
    }

    async handleSellOrder(userId, symbol, instrumentKey, quantity, price, totalAmount, orderType, currentPrice, strategy, notes) {
        // 0. Market Hours Check
        if (!this.isMarketOpen()) {
            const { error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: userId,
                    symbol,
                    instrument_key: instrumentKey,
                    type: 'SELL',
                    quantity,
                    execution_price: price,
                    total_amount: totalAmount,
                    status: 'FAILED',
                    strategy,
                    notes: notes ? `${notes} (Rejected: Market Closed)` : 'Rejected: Market Closed'
                });

            if (orderError) throw orderError;

            return {
                success: true,
                status: 'FAILED',
                message: `Sell Order for ${symbol} was rejected: Market is currently closed.`
            };
        }

        // 1 + 2. Atomically check AND deduct holdings to prevent Double Spending
        const { data: updatedHolding, error: holdingError } = await supabase
            .from('holdings')
            .update({ quantity: supabase.raw('quantity - ?', [quantity]) })
            .eq('user_id', userId)
            .eq('instrument_key', instrumentKey)
            .gte('quantity', quantity) // Only updates if sufficient shares exist
            .select()
            .maybeSingle();

        if (holdingError) throw holdingError;
        
        if (!updatedHolding) {
            // Either holding doesn't exist or quantity was insufficient (race condition blocked)
            const { data: holding } = await supabase
                .from('holdings')
                .select('quantity')
                .eq('user_id', userId)
                .eq('instrument_key', instrumentKey)
                .maybeSingle();

            if (!holding) throw new Error('You do not own this stock');
            throw new Error(`Insufficient holdings. You own ${holding.quantity}`);
        }

        // 3. Execution Check
        let status = 'PENDING';
        let isExecuted = false;
        let finalExecPrice = price;

        if (orderType === 'MARKET') {
            status = 'EXECUTED';
            isExecuted = true;
            finalExecPrice = currentPrice;
        } else if (orderType === 'LIMIT' && currentPrice && currentPrice >= price) {
            status = 'EXECUTED';
            isExecuted = true;
            finalExecPrice = currentPrice; // Better price fill
        }

        if (isExecuted) {
            // Atomic Cash Addition
            const realTotalAmount = roundCurrency(finalExecPrice * quantity);

            await supabase
                .from('profiles')
                .update({ virtual_balance: supabase.raw('virtual_balance + ?', [realTotalAmount]) })
                .eq('id', userId);
        }

        // 4. Create Order Record
        const { error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                symbol,
                instrument_key: instrumentKey,
                type: 'SELL',
                quantity,
                execution_price: finalExecPrice,
                total_amount: roundCurrency(finalExecPrice * quantity),
                status: status,
                strategy,
                notes
            });

        if (orderError) throw orderError;

        return {
            success: true,
            status,
            message: status === 'EXECUTED' ? `Successfully sold ${symbol}` : `Sell Order Placed for ${symbol} @ ${price}`
        };
    }

    /**
     * Get user portfolio with real-time P&L
     */
    async getPortfolio(userId) {
        try {
            const { data: holdings, error } = await supabase
                .from('holdings')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            // Calculate P&L for each holding
            const portfolioWithPnL = holdings.map(holding => {
                // BUG-001 fix: Fall back to avg_price when cache is cold (market service not yet
                // fetched prices). Without this, currentValue = 0 and totalPnL = -totalInvestment.
                const currentPrice = this.marketStream.getCachedPrice(holding.instrument_key) || holding.avg_price;
                const currentValue = currentPrice * holding.quantity;
                const investedValue = holding.avg_price * holding.quantity;
                const pnl = currentValue - investedValue;
                const pnlPercentage = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

                return {
                    ...holding,
                    currentPrice,
                    currentValue,
                    investedValue,
                    pnl,
                    pnlPercentage
                };
            });

            // Calculate totals
            const totalValue = portfolioWithPnL.reduce((sum, h) => sum + h.currentValue, 0);
            const totalInvestment = portfolioWithPnL.reduce((sum, h) => sum + h.investedValue, 0);
            const totalPnL = totalValue - totalInvestment;
            const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

            // Fetch user profile for balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('virtual_balance')
                .eq('id', userId)
                .maybeSingle();

            const cashBalance = profile ? parseFloat(profile.virtual_balance) : 0;

            return {
                holdings: portfolioWithPnL,
                totalValue,
                totalInvestment,
                totalPnL,
                totalPnLPercent,
                cashBalance // Add cash balance to response
            };

        } catch (error) {
            console.error('❌ Portfolio fetch error:', error.message);
            throw error;
        }
    }

    /**
     * Get order history
     */
    async getOrderHistory(userId, limit = 50, offset = 0) {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return orders;

        } catch (error) {
            console.error('❌ Order history fetch error:', error.message);
            throw error;
        }
    }
    /**
     * Cancel a pending order
     */
    async cancelOrder(userId, orderId) {
        try {
            // 1. Fetch Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .eq('user_id', userId)
                .single();

            if (orderError || !order) throw new Error('Order not found');

            // 2. Validate Status (Allow 'OPEN' or 'PENDING')
            // 2. Atomic Status Update (Prevent Double Refund)
            // BUG-014 fix: We must update the status atomically BEFORE refunding to prevent concurrent requests
            // from all seeing 'PENDING' and all issuing a refund.
            const { data: updatedOrder, error: updateError } = await supabase
                .from('orders')
                .update({ status: 'CANCELLED' })
                .eq('id', orderId)
                .eq('user_id', userId) // Hardened: Explicit ownership check in update
                .in('status', ['PENDING', 'OPEN'])
                .select()
                .maybeSingle();

            if (updateError || !updatedOrder) {
                throw new Error('Order cannot be cancelled. It may have already been executed or cancelled.');
            }

            console.log(`🗑️ Cancelling Order #${order.id} (${order.type} ${order.symbol})`);

            // 3. Refund Logic
            if (order.type === 'BUY') {
                // Atomic Refund Balance
                await supabase
                    .from('profiles')
                    .update({ virtual_balance: supabase.raw('virtual_balance + ?', [order.total_amount]) })
                    .eq('id', userId);

                console.log(`   💰 Refunded ₹${order.total_amount} to balance`);

            } else if (order.type === 'SELL') {
                // Atomic Return Holdings
                await supabase
                    .from('holdings')
                    .update({ quantity: supabase.raw('quantity + ?', [order.quantity]) })
                    .eq('user_id', userId)
                    .eq('instrument_key', order.instrument_key);
                console.log(`   📦 Returned ${order.quantity} shares to holdings`);
            }

            // 4. Status was updated atomically in step 2.

            return { success: true, message: 'Order cancelled successfully' };

        } catch (error) {
            console.error('❌ Cancel order error:', error.message);
            throw error;
        }
    }
}

export default TradingEngine;
