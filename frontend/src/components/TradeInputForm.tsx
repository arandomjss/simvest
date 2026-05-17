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
    strategy: string;
    notes: string;
    onSideChange: (side: 'BUY' | 'SELL') => void;
    onQuantityChange: (qty: number) => void;
    onOrderTypeChange: (type: 'MARKET' | 'LIMIT') => void;
    onLimitPriceChange: (price: number) => void;
    onStrategyChange: (strategy: string) => void;
    onNotesChange: (notes: string) => void;
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
    strategy,
    notes,
    onSideChange,
    onQuantityChange,
    onOrderTypeChange,
    onLimitPriceChange,
    onStrategyChange,
    onNotesChange,
    onSubmit,
    onCancel
}: TradeInputFormProps) => {
    return (
        <div className="space-y-4">
            {/* Header / Trade Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
                <button
                    onClick={() => onSideChange('BUY')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${side === 'BUY'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                        }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => onSideChange('SELL')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${side === 'SELL'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                        }`}
                >
                    Sell
                </button>
            </div>

            {/* Order Type Toggle */}
            <div className="flex space-x-4 mb-4 border-b border-gray-100 dark:border-slate-800 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${orderType === 'LIMIT' ? 'border-primary' : 'border-gray-300'}`}>
                        {orderType === 'LIMIT' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <input
                        type="radio"
                        className="hidden"
                        checked={orderType === 'LIMIT'}
                        onChange={() => onOrderTypeChange('LIMIT')}
                    />
                    <span className={`text-xs font-bold ${orderType === 'LIMIT' ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>Limit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${orderType === 'MARKET' ? 'border-primary' : 'border-gray-300'}`}>
                        {orderType === 'MARKET' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <input
                        type="radio"
                        className="hidden"
                        checked={orderType === 'MARKET'}
                        onChange={() => onOrderTypeChange('MARKET')}
                    />
                    <span className={`text-xs font-bold ${orderType === 'MARKET' ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>Market</span>
                </label>
            </div>

            {/* Main Inputs Grid */}
            <div className="grid grid-cols-2 gap-3 mb-2">
                {/* Quantity */}
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Quantity</label>
                    <div className="relative">
                        <input
                            type="number"
                            min="1"
                            value={quantity === 0 ? '' : quantity}
                            onChange={(e) => onQuantityChange(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value) || 0))}
                            onFocus={(e) => e.target.select()}
                            className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-mono font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">QTY</span>
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-sans">₹</span>
                        <input
                            type="number"
                            step="0.05"
                            value={orderType === 'MARKET' ? (stock.ltp !== undefined && stock.ltp > 0 ? stock.ltp : '') : (limitPrice === 0 ? '' : limitPrice)}
                            disabled={orderType === 'MARKET'}
                            onChange={(e) => onLimitPriceChange(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            placeholder={orderType === 'MARKET' ? "MKT" : "0.00"}
                            className={`w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-mono font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${orderType === 'MARKET' ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-800/50' : ''}`}
                        />
                    </div>
                </div>
            </div>

            {/* Trade Journaling */}
            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block flex justify-between">
                        <span>Strategy Tag</span>
                    </label>
                    <select
                        value={strategy}
                        onChange={(e) => onStrategyChange(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                    >
                        <option value="">None (No Strategy)</option>
                        <option value="Breakout">Breakout</option>
                        <option value="Mean Reversion">Mean Reversion</option>
                        <option value="Moving Average Crossover">Moving Average Crossover</option>
                        <option value="Momentum">Momentum</option>
                        <option value="Scalp">Scalp</option>
                        <option value="Earnings Play">Earnings Play</option>
                        <option value="News Catalyst">News Catalyst</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Trade Notes (The "Why")</label>
                    <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Why are you taking this trade?"
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    />
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
