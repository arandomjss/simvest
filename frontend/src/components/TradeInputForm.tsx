import { Stock } from '../types';

interface TradeInputFormProps {
    stock: Stock;
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MARKET' | 'LIMIT';
    limitPrice: number;
    total: string;
    balance: number | null;
    isTrading: boolean;
    onSideChange: (side: 'BUY' | 'SELL') => void;
    onQuantityChange: (qty: number) => void;
    onOrderTypeChange: (type: 'MARKET' | 'LIMIT') => void;
    onLimitPriceChange: (price: number) => void;
    onSubmit: () => void;
    onCancel?: () => void;
}

export const TradeInputForm = ({
    stock,
    side,
    quantity,
    orderType,
    limitPrice,
    total,
    balance,
    isTrading,
    onSideChange,
    onQuantityChange,
    onOrderTypeChange,
    onLimitPriceChange,
    onSubmit,
    onCancel
}: TradeInputFormProps) => {
    return (
        <div className="space-y-4">
            {/* Header / Trade Type Toggle */}
            <div className="flex bg-background rounded-lg p-1 border border-border">
                <button
                    onClick={() => onSideChange('BUY')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${side === 'BUY'
                        ? 'bg-success text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => onSideChange('SELL')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${side === 'SELL'
                        ? 'bg-danger text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        }`}
                >
                    Sell
                </button>
            </div>

            {/* Main Inputs */}
            <div className="space-y-3">
                {/* Quantity Row */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] uppercase font-bold text-text-muted">Quantity</label>
                        <span className="text-[10px] text-text-secondary">lot: 1</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full pl-3 pr-10 py-2 bg-background border border-border rounded-md text-sm font-mono font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted font-medium">Qty</span>
                    </div>
                </div>

                {/* Price Row */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] uppercase font-bold text-text-muted">Price</label>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 cursor-pointer group">
                                <input
                                    type="radio"
                                    checked={orderType === 'MARKET'}
                                    onChange={() => onOrderTypeChange('MARKET')}
                                    className="w-3 h-3 text-primary border-border focus:ring-primary/20"
                                />
                                <span className="text-[10px] font-medium text-text-secondary group-hover:text-primary transition-colors">MKT</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer group">
                                <input
                                    type="radio"
                                    checked={orderType === 'LIMIT'}
                                    onChange={() => onOrderTypeChange('LIMIT')}
                                    className="w-3 h-3 text-primary border-border focus:ring-primary/20"
                                />
                                <span className="text-[10px] font-medium text-text-secondary group-hover:text-primary transition-colors">LMT</span>
                            </label>
                        </div>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-sans">₹</span>
                        <input
                            type="number"
                            step="0.05"
                            value={orderType === 'MARKET' ? 0 : limitPrice}
                            disabled={orderType === 'MARKET'}
                            onChange={(e) => onLimitPriceChange(parseFloat(e.target.value) || 0)}
                            placeholder={orderType === 'MARKET' ? "Market Price" : "0.00"}
                            className={`w-full pl-6 pr-3 py-2 bg-background border border-border rounded-md text-sm font-mono font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${orderType === 'MARKET' ? 'opacity-50 cursor-not-allowed bg-surface' : ''}`}
                        />
                    </div>
                </div>
            </div>

            {/* Total Summary */}
            <div className="pt-3 border-t border-border mt-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">Margin Req.</span>
                    <span className="font-mono font-medium text-text-primary">₹{total}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">Available</span>
                    <span className="font-mono font-medium text-text-secondary">₹{balance ? balance.toFixed(2) : '0.00'}</span>
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={onSubmit}
                disabled={isTrading}
                className={`w-full py-2.5 text-sm font-bold uppercase tracking-wider rounded-md transition-all transform active:scale-[0.98] ${side === 'BUY'
                    ? 'bg-success hover:bg-success-dark text-white shadow-sm hover:shadow'
                    : 'bg-danger hover:bg-danger-dark text-white shadow-sm hover:shadow'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
                {isTrading ? 'Processing...' : `${side} ${stock.symbol}`}
            </button>

            {onCancel && (
                <button
                    onClick={onCancel}
                    className="w-full py-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                    Cancel
                </button>
            )}
        </div>
    );
};
