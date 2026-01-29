import { supabase } from '../config/supabase.config.js';

class TradingEngine {
    constructor(marketStreamService) {
        this.marketStream = marketStreamService;
    }

    /**
     * Execute a virtual trade (BUY or SELL)
     */
    async executeTrade(userId, { symbol, instrumentKey, type, quantity }) {
        try {
            // Validate inputs
            if (!['BUY', 'SELL'].includes(type)) {
                throw new Error('Invalid trade type. Must be BUY or SELL');
            }

            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            // Get latest price from cache
            const currentPrice = this.marketStream.getCachedPrice(instrumentKey);

            if (!currentPrice) {
                throw new Error('Price not available. Please try again.');
            }

            const totalAmount = currentPrice * quantity;

            // Start transaction
            if (type === 'BUY') {
                return await this.executeBuy(userId, symbol, instrumentKey, quantity, currentPrice, totalAmount);
            } else {
                return await this.executeSell(userId, symbol, instrumentKey, quantity, currentPrice, totalAmount);
            }

        } catch (error) {
            console.error('❌ Trade execution error:', error.message);
            throw error;
        }
    }

    /**
     * Execute BUY order
     */
    async executeBuy(userId, symbol, instrumentKey, quantity, price, totalAmount) {
        try {
            // 1. Check virtual balance
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('virtual_balance')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            if (profile.virtual_balance < totalAmount) {
                throw new Error('Insufficient virtual balance');
            }

            // 2. Deduct balance
            const newBalance = parseFloat(profile.virtual_balance) - totalAmount;

            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ virtual_balance: newBalance })
                .eq('id', userId);

            if (balanceError) throw balanceError;

            // 3. Update or insert holding
            const { data: existingHolding } = await supabase
                .from('holdings')
                .select('*')
                .eq('user_id', userId)
                .eq('instrument_key', instrumentKey)
                .single();

            if (existingHolding) {
                // Update existing holding (calculate new average price)
                const totalQuantity = existingHolding.quantity + quantity;
                const totalCost = (existingHolding.avg_price * existingHolding.quantity) + totalAmount;
                const newAvgPrice = totalCost / totalQuantity;

                const { error: holdingError } = await supabase
                    .from('holdings')
                    .update({
                        quantity: totalQuantity,
                        avg_price: newAvgPrice
                    })
                    .eq('id', existingHolding.id);

                if (holdingError) throw holdingError;
            } else {
                // Insert new holding
                const { error: holdingError } = await supabase
                    .from('holdings')
                    .insert({
                        user_id: userId,
                        symbol,
                        instrument_key: instrumentKey,
                        quantity,
                        avg_price: price
                    });

                if (holdingError) throw holdingError;
            }

            // 4. Insert order record
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
                    status: 'EXECUTED'
                });

            if (orderError) throw orderError;

            return {
                success: true,
                message: `Successfully bought ${quantity} shares of ${symbol}`,
                newBalance,
                executionPrice: price,
                totalAmount
            };

        } catch (error) {
            console.error('❌ Buy order error:', error.message);
            throw error;
        }
    }

    /**
     * Execute SELL order
     */
    async executeSell(userId, symbol, instrumentKey, quantity, price, totalAmount) {
        try {
            // 1. Check if user has enough holdings
            const { data: holding, error: holdingError } = await supabase
                .from('holdings')
                .select('*')
                .eq('user_id', userId)
                .eq('instrument_key', instrumentKey)
                .single();

            if (holdingError || !holding) {
                throw new Error('You do not own this stock');
            }

            if (holding.quantity < quantity) {
                throw new Error(`Insufficient holdings. You own ${holding.quantity} shares`);
            }

            // 2. Add balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('virtual_balance')
                .eq('id', userId)
                .single();

            const newBalance = parseFloat(profile.virtual_balance) + totalAmount;

            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ virtual_balance: newBalance })
                .eq('id', userId);

            if (balanceError) throw balanceError;

            // 3. Update or delete holding
            const remainingQuantity = holding.quantity - quantity;

            if (remainingQuantity === 0) {
                // Delete holding
                const { error: deleteError } = await supabase
                    .from('holdings')
                    .delete()
                    .eq('id', holding.id);

                if (deleteError) throw deleteError;
            } else {
                // Update holding
                const { error: updateError } = await supabase
                    .from('holdings')
                    .update({ quantity: remainingQuantity })
                    .eq('id', holding.id);

                if (updateError) throw updateError;
            }

            // 4. Insert order record
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
                    status: 'EXECUTED'
                });

            if (orderError) throw orderError;

            // Calculate P&L
            const pnl = totalAmount - (holding.avg_price * quantity);

            return {
                success: true,
                message: `Successfully sold ${quantity} shares of ${symbol}`,
                newBalance,
                executionPrice: price,
                totalAmount,
                pnl
            };

        } catch (error) {
            console.error('❌ Sell order error:', error.message);
            throw error;
        }
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

            return portfolioWithPnL;

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
