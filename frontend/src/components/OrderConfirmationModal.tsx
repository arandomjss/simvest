import { Stock } from '../types';

interface OrderConfirmationModalProps {
    stock: Stock;
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MARKET' | 'LIMIT';
    limitPrice: number;
    total: string;
    isTrading: boolean;
    strategy?: string;
    notes?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const OrderConfirmationModal = ({
    stock,
    side,
    quantity,
    orderType,
    limitPrice,
    total,
    isTrading,
    strategy,
    notes,
    onConfirm,
    onCancel
}: OrderConfirmationModalProps) => {
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
                    <span className={`font-bold ${side === 'BUY' ? 'text-success' : 'text-danger'}`}>{side}</span>
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
                    <span className="font-bold text-text-primary">₹{total}</span>
                </div>
                
                {/* Journal Info */}
                {(strategy || notes) && (
                    <div className="pt-2 border-t border-border mt-2">
                        {strategy && (
                            <div className="flex justify-between mb-1">
                                <span className="text-text-secondary">Strategy</span>
                                <span className="font-medium text-text-primary px-2 py-0.5 bg-primary/10 rounded text-xs">{strategy}</span>
                            </div>
                        )}
                        {notes && (
                            <div className="mt-2 text-text-secondary text-xs italic bg-surface-hover p-2 rounded whitespace-pre-wrap rounded border border-border">
                                "{notes}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex space-x-3 pt-2">
                <button
                    onClick={onCancel}
                    disabled={isTrading}
                    className="flex-1 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isTrading}
                    className={`flex-1 py-2 text-sm font-bold text-white rounded transition ${side === 'BUY' ? 'bg-success hover:bg-success-dark' : 'bg-danger hover:bg-danger-dark'
                        } disabled:opacity-50`}
                >
                    {isTrading ? 'Placing...' : 'Confirm Order'}
                </button>
            </div>
        </div>
    );
};
