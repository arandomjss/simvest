import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useMarketStore } from '../stores/marketStore';

interface StockSelectorProps {
    selectedSymbol: string | null;
    onSelect: (symbol: string) => void;
}

export const StockSelector = ({ selectedSymbol, onSelect }: StockSelectorProps) => {
    const { stocks } = useMarketStore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter stocks
    const filteredStocks = stocks.filter(s =>
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit to 10 results for performance

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (symbol: string) => {
        onSelect(symbol);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div ref={wrapperRef} className="relative min-w-[200px] max-w-[300px]">
            {/* Trigger Button / Input Area */}
            <div
                className="flex items-center bg-background border border-border rounded-md px-3 py-1.5 cursor-text hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                onClick={() => setIsOpen(true)}
            >
                <Search className="w-4 h-4 text-text-secondary mr-2" />

                {isOpen ? (
                    <input
                        autoFocus
                        type="text"
                        className="bg-transparent border-none outline-none text-sm font-semibold text-text-primary w-full placeholder-text-muted"
                        placeholder="Search stock..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                ) : (
                    <div className="flex-1 text-sm font-bold text-text-primary">
                        {selectedSymbol || 'Select Symbol'}
                    </div>
                )}

                {!isOpen && <ChevronDown className="w-4 h-4 text-text-secondary ml-2" />}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                        {filteredStocks.length > 0 ? (
                            filteredStocks.map(stock => (
                                <button
                                    key={stock.instrumentKey}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent closing immediately
                                        handleSelect(stock.symbol);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex justify-between items-center group transition-colors ${selectedSymbol === stock.symbol ? 'bg-primary/10' : 'hover:bg-surface-hover'}`}
                                >
                                    <span className={`font-semibold ${selectedSymbol === stock.symbol ? 'text-primary' : 'text-text-primary'}`}>
                                        {stock.symbol}
                                    </span>
                                    <span className="text-xs text-text-secondary font-mono">
                                        ₹{stock.ltp?.toFixed(2)}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-text-muted">
                                No stocks found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
