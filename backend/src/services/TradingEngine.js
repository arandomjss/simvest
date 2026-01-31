import { supabase } from '../config/supabase.config.js';

class TradingEngine {
    constructor(marketStreamService) {
        this.marketStream = marketStreamService;

        // Listen for price updates to trigger matching engine
        if (this.marketStream) {
            this.marketStream.on('priceUpdate', ({ instrumentKey, ltp }) => {
                this.processPendingOrders(instrumentKey, ltp);
            });
        }
    }

    /**
     * Process pending orders for a specific instrument
     */
    async processPendingOrders(instrumentKey, currentPrice) {
        try {
            // Find all PENDING orders for this instrument
            const { data: pendingOrders, error } = await supabase
                .from('orders')
                .select('*')
                .eq('instrument_key', instrumentKey)
                .eq('status', 'PENDING');

            if (error) {
                console.error('Error fetching pending orders:', error.message);
                return;
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

        } catch (error) {
            console.error('Error processing pending orders:', error.message);
        }
    }

    /**
     * Execute a matched pending order
     */
    async executePendingOrder(order, executionPrice) {
        try {
            const totalAmount = executionPrice * order.quantity;

            console.log(`⚡ Match found! Executing Order #${order.id}: ${order.type} ${order.symbol} @ ${executionPrice}`);

            if (order.type === 'BUY') {
                // For BUY, balance was already deducted/blocked. 
                // We need to refund the difference if execution price < limit price
                const diff = (order.execution_price * order.quantity) - totalAmount;

                if (diff > 0) {
                    // Refund difference
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('virtual_balance')
                        .eq('id', order.user_id)
                        .single();

                    await supabase
                        .from('profiles')
                        .update({ virtual_balance: profile.virtual_balance + diff })
                        .eq('id', order.user_id);
                }

                // Initial logic for BUY simply needs to add holding now
                // Fetch or Create Holding
                const { data: existingHolding } = await supabase
                    .from('holdings')
                    .select('*')
                    .eq('user_id', order.user_id)
                    .eq('instrument_key', order.instrument_key)
                    .maybeSingle();

                if (existingHolding) {
                    const totalQuantity = existingHolding.quantity + order.quantity;
                    const totalCost = (existingHolding.avg_price * existingHolding.quantity) + totalAmount;
                    const newAvgPrice = totalCost / totalQuantity;

                    await supabase
                        .from('holdings')
                        .update({ quantity: totalQuantity, avg_price: newAvgPrice })
                        .eq('id', existingHolding.id);
                } else {
                    await supabase
                        .from('holdings')
                        .insert({
                            user_id: order.user_id,
                            symbol: order.symbol,
                            instrument_key: order.instrument_key,
                            quantity: order.quantity,
                            avg_price: executionPrice
                        });
                }
            } else {
                // For SELL, quantity was already deducted/blocked.
                // Just add the cash proceeds to balance.
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('virtual_balance')
                    .eq('id', order.user_id)
                    .single();

                await supabase
                    .from('profiles')
                    .update({ virtual_balance: parseFloat(profile.virtual_balance) + totalAmount })
                    .eq('id', order.user_id);
            }

            // Update Order Status
            await supabase
                .from('orders')
                .update({
                    status: 'EXECUTED',
                    execution_price: executionPrice, // Update to actual execution price
                    total_amount: totalAmount
                })
                .eq('id', order.id);

        } catch (error) {
            console.error(`❌ Failed to execute pending order #${order.id}:`, error.message);
        }
    }

    /**
     * Execute a virtual trade (BUY or SELL)
     */
    async executeTrade(userId, { symbol, instrumentKey, type, quantity, orderType = 'MARKET', limitPrice = 0 }) {
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

            if (!currentPrice && orderType === 'MARKET') {
                throw new Error('Price not available for Market Order. Please try again.');
            }

            // Determine execution price
            const executionPrice = orderType === 'MARKET' ? currentPrice : limitPrice;
            const totalAmount = executionPrice * quantity;

            // Start transaction
            if (type === 'BUY') {
                return await this.handleBuyOrder(userId, symbol, instrumentKey, quantity, executionPrice, totalAmount, orderType, currentPrice);
            } else {
                return await this.handleSellOrder(userId, symbol, instrumentKey, quantity, executionPrice, totalAmount, orderType, currentPrice);
            }

        } catch (error) {
            console.error('❌ Trade execution error:', error.message);
            throw error;
        }
    }

    async handleBuyOrder(userId, symbol, instrumentKey, quantity, price, totalAmount, orderType, currentPrice) {
        // 1. Check virtual balance (Block funds immediately for both Market and Limit)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('virtual_balance')
            .eq('id', userId)
            .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
            throw new Error('User profile not found. Please contact support.');
        }

        if (profile.virtual_balance < totalAmount) {
            throw new Error('Insufficient virtual balance');
        }

        // 2. Deduct balance (Funds blocked)
        // If Limit Order: We deduct max amount (limit_price * qty). Refund later if executed cheaper.
        const newBalance = parseFloat(profile.virtual_balance) - totalAmount;

        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ virtual_balance: newBalance })
            .eq('id', userId);

        if (balanceError) throw balanceError;

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
            const diff = (price * quantity) - (finalExecPrice * quantity);
            if (diff > 0) {
                await supabase
                    .from('profiles')
                    .update({ virtual_balance: newBalance + diff })
                    .eq('id', userId);
            }
        }

        if (isExecuted) {
            // Update Holdings
            const { data: existingHolding } = await supabase
                .from('holdings')
                .select('*')
                .eq('user_id', userId)
                .eq('instrument_key', instrumentKey)
                .maybeSingle();

            if (existingHolding) {
                const totalQuantity = existingHolding.quantity + quantity;
                const totalCost = (existingHolding.avg_price * existingHolding.quantity) + (finalExecPrice * quantity);
                const newAvgPrice = totalCost / totalQuantity;

                await supabase.from('holdings').update({ quantity: totalQuantity, avg_price: newAvgPrice }).eq('id', existingHolding.id);
            } else {
                await supabase.from('holdings').insert({
                    user_id: userId,
                    symbol,
                    instrument_key: instrumentKey,
                    quantity,
                    avg_price: finalExecPrice
                });
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
                total_amount: finalExecPrice * quantity,
                status: status
            }); // Note: should probably have separate column for 'limit_price' vs 'execution_price' but reusing for simplicity as per schema

        if (orderError) throw orderError;

        return {
            success: true,
            status,
            message: status === 'EXECUTED' ? `Successfully bought ${symbol}` : `Buy Order Placed for ${symbol} @ ${price}`,
            newBalance
        };
    }

    async handleSellOrder(userId, symbol, instrumentKey, quantity, price, totalAmount, orderType, currentPrice) {
        // 1. Check Holdings
        const { data: holding, error: holdingError } = await supabase
            .from('holdings')
            .select('*')
            .eq('user_id', userId)
            .eq('instrument_key', instrumentKey)
            .maybeSingle();

        if (holdingError || !holding) throw new Error('You do not own this stock');
        if (holding.quantity < quantity) throw new Error(`Insufficient holdings. You own ${holding.quantity}`);

        // 2. Block Holdings (Deduct Quantity Immediately)
        // If Pending, shares are gone from portfolio. If cancelled later, we add back.
        const remainingQuantity = holding.quantity - quantity;
        if (remainingQuantity === 0) {
            await supabase.from('holdings').delete().eq('id', holding.id);
        } else {
            await supabase.from('holdings').update({ quantity: remainingQuantity }).eq('id', holding.id);
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
            // Add Cash
            const { data: profile } = await supabase
                .from('profiles')
                .select('virtual_balance')
                .eq('id', userId)
                .single();

            const realTotalAmount = finalExecPrice * quantity;

            await supabase
                .from('profiles')
                .update({ virtual_balance: parseFloat(profile.virtual_balance) + realTotalAmount })
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
                total_amount: finalExecPrice * quantity,
                status: status
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
                const currentPrice = this.marketStream.getCachedPrice(holding.instrument_key);
                const currentValue = currentPrice ? currentPrice * holding.quantity : 0;
                const investedValue = holding.avg_price * holding.quantity;
                const pnl = currentValue - investedValue;
                const pnlPercentage = (pnl / investedValue) * 100;

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
}

export default TradingEngine;
