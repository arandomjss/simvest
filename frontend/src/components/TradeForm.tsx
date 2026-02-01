import { useState, useEffect } from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { Stock } from '../types';
import { TradeInputForm } from './TradeInputForm';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { TradeSuccessMessage } from './TradeSuccessMessage';

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

    const handleSuccessClose = () => {
        setOrderSuccess(false);
        setShowConfirmation(false);
        onSuccess();
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

            setTimeout(() => {
                handleSuccessClose();
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
            <TradeSuccessMessage
                symbol={stock.symbol}
                side={tradeType}
                quantity={quantity}
                onClose={handleSuccessClose}
            />
        );
    }

    if (showConfirmation) {
        return (
            <OrderConfirmationModal
                stock={stock}
                side={tradeType}
                quantity={quantity}
                orderType={orderType}
                limitPrice={limitPrice}
                total={calculateTotal()}
                isTrading={isTrading}
                onConfirm={confirmTrade}
                onCancel={() => setShowConfirmation(false)}
            />
        );
    }

    return (
        <TradeInputForm
            stock={stock}
            side={tradeType}
            quantity={quantity}
            orderType={orderType}
            limitPrice={limitPrice}
            total={calculateTotal()}
            balance={portfolio?.cashBalance || null}
            isTrading={isTrading}
            onSideChange={setTradeType}
            onQuantityChange={setQuantity}
            onOrderTypeChange={setOrderType}
            onLimitPriceChange={setLimitPrice}
            onSubmit={handleTradeInit}
            onCancel={onCancel}
        />
    );
};
