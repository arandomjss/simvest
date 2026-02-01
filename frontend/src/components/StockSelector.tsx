import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Command } from 'lucide-react';
import { useMarketStore } from '../stores/marketStore';

interface StockSelectorProps {
    selectedSymbol: string | null;
    onSelect: (symbol: string) => void;
}

export const StockSelector = ({ selectedSymbol, onSelect }: StockSelectorProps) => {
    const { stocks } = useMarketStore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter stocks
    const filteredStocks = stocks.filter(s =>
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50); // Show more results in command palette style

    // Reset selection on search change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm]);

    // Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredStocks.length);
                // Scroll into view logic could be added here
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredStocks.length) % filteredStocks.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredStocks[selectedIndex]) {
                    handleSelect(filteredStocks[selectedIndex].symbol);
                }
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredStocks, selectedIndex]);

    // Handle initial open focus
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        } else {
            setSearchTerm(''); // Reset search on close (optional)
        }
    }, [isOpen]);

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
        <div ref={wrapperRef} className="relative z-50">
            {/* Trigger Button - Looks like a Terminal Command Input */}
            <button
                className={`
                    group flex items-center justify-between gap-3 px-3 py-2 
                    bg-white dark:bg-slate-900 
                    border border-gray-200 dark:border-slate-700 
                    rounded-lg shadow-sm hover:border-primary/50 dark:hover:border-primary/50 
                    transition-all w-[240px]
                    focus:outline-none focus:ring-2 focus:ring-primary/20
                `}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {selectedSymbol ? (
                            <span className="text-[10px] font-bold text-primary">{selectedSymbol[0]}</span>
                        ) : (
                            <Search className="w-3 pb-px text-gray-500" />
                        )}
                    </div>
                    <span className={`text-sm font-semibold truncate ${selectedSymbol ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                        {selectedSymbol || 'Select Stock...'}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        <Command className="w-3 h-3" />K
                    </kbd>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Command Palette Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[320px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                    {/* Search Input Area */}
                    <div className="p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Search by symbol or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Stock List */}
                    <div ref={listRef} className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                        <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">
                            Market Items
                        </div>

                        {filteredStocks.length > 0 ? (
                            filteredStocks.map((stock, index) => (
                                <button
                                    key={stock.instrumentKey}
                                    onClick={() => handleSelect(stock.symbol)}
                                    // Use onMouseEnter to update selection for mouse interaction?
                                    // Actually better to keep them separate to avoid jank, but let's sync for hover effect
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`
                                        w-full text-left px-3 py-2.5 mx-0.5 rounded-lg flex justify-between items-center group transition-colors relative
                                        ${index === selectedIndex ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}
                                    `}
                                >
                                    {/* Active Indicator Line */}
                                    {index === selectedIndex && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-primary rounded-r-full"></div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold border
                                            ${index === selectedIndex
                                                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                                                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700'}
                                        `}>
                                            {stock.symbol[0]}
                                        </div>
                                        <div>
                                            <div className={`font-semibold text-sm ${index === selectedIndex ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                                {stock.symbol}
                                            </div>
                                            <div className="text-xs text-text-secondary truncate max-w-[120px]">
                                                {stock.name || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                            ₹{stock.ltp?.toFixed(2)}
                                        </div>
                                        <div className={`text-[10px] font-semibold ${(stock.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {(stock.changePercent || 0).toFixed(2)}%
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-8 text-center">
                                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No stocks found for "{searchTerm}"</p>
                            </div>
                        )}
                    </div>

                    {/* Footer / Shortcuts */}
                    <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-400">
                        <div className="flex gap-2">
                            <span>Navigate <kbd className="font-sans border rounded px-1">↑↓</kbd></span>
                            <span>Select <kbd className="font-sans border rounded px-1">↵</kbd></span>
                        </div>
                        <span>{filteredStocks.length} results</span>
                    </div>
                </div>
            )}
        </div>
    );
};
