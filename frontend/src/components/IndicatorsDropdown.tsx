import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Layers, BarChart3, Check } from 'lucide-react';

interface IndicatorsDropdownProps {
    activeIndicators: string[];
    onToggleIndicator: (indicator: string) => void;
}

export const IndicatorsDropdown = ({
    activeIndicators,
    onToggleIndicator
}: IndicatorsDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const overlayIndicators = [
        { id: 'SMA20', label: 'SMA 20', description: 'Simple Moving Avg (Short)' },
        { id: 'SMA50', label: 'SMA 50', description: 'Simple Moving Avg (Medium)' },
        { id: 'SMA200', label: 'SMA 200', description: 'Simple Moving Avg (Long)' },
        { id: 'EMA12', label: 'EMA 12', description: 'Exponential Moving Avg' },
        { id: 'EMA26', label: 'EMA 26', description: 'Exponential Moving Avg (Long)' },
        { id: 'BB', label: 'Bollinger Bands', description: 'Volatility envelope (20, 2)' }
    ];

    const oscillatorIndicators = [
        { id: 'RSI', label: 'Relative Strength Index (RSI)', description: 'Momentum oscillator (14)' },
        { id: 'MACD', label: 'MACD', description: 'Trend-following momentum' }
    ];

    const activeOverlaysCount = overlayIndicators.filter(i => activeIndicators.includes(i.id)).length;
    const activeOscillatorsCount = oscillatorIndicators.filter(i => activeIndicators.includes(i.id)).length;
    const totalActiveCount = activeOverlaysCount + activeOscillatorsCount;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                    isOpen || totalActiveCount > 0
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-white dark:bg-slate-800 text-text-secondary border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
            >
                <Layers size={14} className={totalActiveCount > 0 ? 'text-primary' : 'text-gray-400 dark:text-gray-500'} />
                <span>Indicators</span>
                {totalActiveCount > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-primary text-white rounded-full">
                        {totalActiveCount}
                    </span>
                )}
                <ChevronDown size={12} className={`opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        {/* Overlays Header */}
                        <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                            <Layers size={12} className="text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Overlays (On Chart)</span>
                        </div>

                        {/* Overlays List */}
                        <div className="p-1.5 space-y-0.5">
                            {overlayIndicators.map((ind) => {
                                const isActive = activeIndicators.includes(ind.id);
                                return (
                                    <button
                                        key={ind.id}
                                        onClick={() => onToggleIndicator(ind.id)}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors duration-150 ${
                                            isActive
                                                ? 'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20'
                                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {ind.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                                {ind.description}
                                            </span>
                                        </div>
                                        {isActive ? (
                                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border border-gray-200 dark:border-slate-700 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Oscillators Header */}
                        <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border-t border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                            <BarChart3 size={12} className="text-purple-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Oscillators (Sub-Chart)</span>
                        </div>

                        {/* Oscillators List */}
                        <div className="p-1.5 space-y-0.5">
                            {oscillatorIndicators.map((ind) => {
                                const isActive = activeIndicators.includes(ind.id);
                                return (
                                    <button
                                        key={ind.id}
                                        onClick={() => onToggleIndicator(ind.id)}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors duration-150 ${
                                            isActive
                                                ? 'bg-purple-500/5 dark:bg-purple-500/10 hover:bg-purple-500/10 dark:hover:bg-purple-500/20'
                                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span className={`text-xs font-bold ${isActive ? 'text-purple-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {ind.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                                {ind.description}
                                            </span>
                                        </div>
                                        {isActive ? (
                                            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border border-gray-200 dark:border-slate-700 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
