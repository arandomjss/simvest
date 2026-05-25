import { CheckCircle, AlertOctagon } from 'lucide-react';

interface TradeSuccessMessageProps {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    status?: string;
    onClose: () => void;
}

export const TradeSuccessMessage = ({ symbol, side, quantity, status = 'EXECUTED', onClose }: TradeSuccessMessageProps) => {
    const isFailed = status === 'FAILED';

    return (
        <div className="bg-surface rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
            {isFailed ? (
                <>
                    <div className="w-16 h-16 bg-red-500/10 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                        <AlertOctagon className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-red-500">Order Failed</h3>
                    <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
                        Your {side.toLowerCase()} order for {quantity} {symbol} failed because standard market hours are currently closed.
                    </p>
                </>
            ) : (
                <>
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Order Placed!</h3>
                    <p className="text-text-secondary text-sm">
                        Your {side} order for {quantity} {symbol} has been executed.
                    </p>
                </>
            )}
            <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-surface-hover hover:bg-surface-active text-text-primary rounded transition text-sm font-medium"
            >
                Done
            </button>
        </div>
    );
};
