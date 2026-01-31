import { useState, useEffect } from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { Stock } from '../types';

interface TradeFormProps {
    stock: Stock;
    initialSide?: 'BUY' | 'SELL';
    onSuccess: () => void;
    onCancel?: () => void;
}

export const TradeForm = ({ stock, initialSide = 'BUY', onSuccess, onCancel }: TradeFormProps) => {
    const { executeTrade, fetchPortfolio, portfolio } = usePortfolioStore();

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>(initialSide);
    const [quantity, setQuantity] = useState(1);
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('LIMIT');
    const [limitPrice, setLimitPrice] = useState<number>(0);
    const [isTrading, setIsTrading] = useState(false);

    // Initialize/Reset when stock changes
    useEffect(() => {
        if (stock) {
            setLimitPrice(stock.ltp || 0);
        }
        setOrderType('LIMIT');
        setQuantity(1);
        setTradeType(initialSide);
        setShowConfirmation(false);
        setOrderSuccess(false);
    }, [stock?.instrumentKey, initialSide]);

    const calculateTotal = () => {
        const price = orderType === 'MARKET' ? (stock?.ltp || 0) : limitPrice;
        return (price * quantity).toFixed(2);
    };

    const handleTradeInit = () => {
        if (!stock || quantity < 1) return;
        if (orderType === 'LIMIT' && limitPrice <= 0) return;
        setShowConfirmation(true);
    };

    const confirmTrade = async () => {
        setIsTrading(true);
        try {
            await executeTrade(
                stock.symbol,
                stock.instrumentKey,
                tradeType,
                quantity,
                orderType,
                limitPrice
            );

            await fetchPortfolio();
            setShowConfirmation(false);
            setOrderSuccess(true);

            // Auto-close success message or notify parent after delay?
            // User requested explicit "Order Placed" message
            // onSuccess(); // Delay calling onSuccess so user sees the message
            setTimeout(() => {
                onSuccess(); // Close modal/refresh parent
            }, 2000);

        } catch (error: any) {
            console.error('Trade failed:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Trade failed';
            alert(`Trade failed: ${errorMessage}`);
            setShowConfirmation(false);
        } finally {
            setIsTrading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="bg-surface rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-2">
                    <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-text-primary">Order Placed!</h3>
                <p className="text-text-secondary text-sm">
                    Your {tradeType} order for {quantity} {stock.symbol} has been executed.
                </p>
                <button
                    onClick={() => {
                        setOrderSuccess(false);
                        setShowConfirmation(false);
                        onSuccess();
                    }}
                    className="mt-4 px-6 py-2 bg-surface-hover hover:bg-surface-active text-text-primary rounded transition text-sm font-medium"
                >
                    Done
                </button>
            </div>
        );
    }

    if (showConfirmation) {
        return (
            <div className="bg-surface rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2">Confirm Order</h3>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Symbol</span>
                        <span className="font-semibold text-text-primary">{stock.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Action</span>
                        <span className={`font-bold ${tradeType === 'BUY' ? 'text-success' : 'text-danger'}`}>{tradeType}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Quantity</span>
                        <span className="font-semibold text-text-primary">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Type</span>
                        <span className="font-semibold text-text-primary">{orderType}</span>
                    </div>
                    {orderType === 'LIMIT' && (
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Limit Price</span>
                            <span className="font-semibold text-text-primary">₹{limitPrice.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-2 border-t border-border flex justify-between text-base">
                        <span className="text-text-secondary">Estimated Total</span>
                        <span className="font-bold text-text-primary">₹{calculateTotal()}</span>
                    </div>
                </div>

                <div className="flex space-x-3 pt-2">
                    <button
                        onClick={() => setShowConfirmation(false)}
                        disabled={isTrading}
                        className="flex-1 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmTrade}
                        disabled={isTrading}
                        className={`flex-1 py-2 text-sm font-bold text-white rounded transition ${tradeType === 'BUY' ? 'bg-success hover:bg-success-dark' : 'bg-danger hover:bg-danger-dark'
                            } disabled:opacity-50`}
                    >
                        {isTrading ? 'Placing...' : 'Confirm Order'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-lg">
            <div className="p-4 space-y-4">
                {/* Header / Trade Type Toggle */}
                <div className="flex bg-background rounded-lg p-1">
                    <button
                        onClick={() => setTradeType('BUY')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${tradeType === 'BUY'
                            ? 'bg-success text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => setTradeType('SELL')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${tradeType === 'SELL'
                            ? 'bg-danger text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Sell
                    </button>
                </div>

                {/* Main Inputs */}
                <div className="space-y-4">
                    <div className="flex space-x-4">
                        {/* Quantity */}
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                Qty
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background font-medium"
                            />
                        </div>

                        {/* Price */}
                        <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <label className="block text-xs font-medium text-text-secondary">
                                    Price
                                </label>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={orderType === 'MARKET'}
                                        onChange={(e) => setOrderType(e.target.checked ? 'MARKET' : 'LIMIT')}
                                        className="w-3 h-3 rounded border-border text-primary focus:ring-primary/20"
                                    />
                                    <span className="text-[10px] text-text-secondary">Market</span>
                                </label>
                            </div>
                            <input
                                type="number"
                                step="0.05"
                                value={orderType === 'MARKET' ? 0 : limitPrice}
                                disabled={orderType === 'MARKET'}
                                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                                placeholder={orderType === 'MARKET' ? "Market Price" : "Limit Price"}
                                className={`w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background font-semibold ${orderType === 'MARKET' ? 'opacity-50 cursor-not-allowed bg-surface' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="pt-4 border-t border-border">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-text-secondary">Est. Total</span>
                            <span className="font-semibold text-text-primary">₹{calculateTotal()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-text-secondary">
                            <span>Available Margin</span>
                            {/* In a real app we'd show balance here */}
                            <span>₹{portfolio?.cashBalance ? portfolio.cashBalance.toFixed(2) : '0.00'}</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleTradeInit}
                        disabled={isTrading}
                        className={`w-full py-3 text-sm font-bold text-white rounded transition ${tradeType === 'BUY'
                            ? 'bg-success hover:bg-success-dark'
                            : 'bg-danger hover:bg-danger-dark'
                            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0`}
                    >
                        {isTrading ? 'Processing...' : `${tradeType} ${stock.symbol}`}
                    </button>

                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="w-full py-2 text-xs font-medium text-text-secondary hover:text-text-primary"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
