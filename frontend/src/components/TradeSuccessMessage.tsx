import { CheckCircle } from 'lucide-react';

interface TradeSuccessMessageProps {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    onClose: () => void;
}

export const TradeSuccessMessage = ({ symbol, side, quantity, onClose }: TradeSuccessMessageProps) => {
    return (
        <div className="bg-surface rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Order Placed!</h3>
            <p className="text-text-secondary text-sm">
                Your {side} order for {quantity} {symbol} has been executed.
            </p>
            <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-surface-hover hover:bg-surface-active text-text-primary rounded transition text-sm font-medium"
            >
                Done
            </button>
        </div>
    );
};
