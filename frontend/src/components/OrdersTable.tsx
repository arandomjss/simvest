import { useState } from 'react';
import { Order } from '../types';
import { usePortfolioStore } from '../stores/portfolioStore';
import { XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrdersTableProps {
    orders: Order[];
}

export const OrdersTable = ({ orders }: OrdersTableProps) => {
    const [filter, setFilter] = useState('ALL');
    const { cancelOrder } = usePortfolioStore();

    const handleCancel = async (orderId: string) => {
        if (window.confirm('Are you sure you want to cancel this order?')) {
            try {
                await cancelOrder(orderId);
                toast.success('Order cancelled successfully');
            } catch (e) {
                toast.error('Failed to cancel order');
            }
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'ALL') return true;
        return order.status === filter;
    }).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (timeB || 0) - (timeA || 0);
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'EXECUTED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'FAILED': return 'bg-red-100 text-red-700 border-red-200';
            case 'CANCELLED': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="glass-card">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center gap-4">
                <div className="flex gap-2">
                    {['ALL', 'EXECUTED', 'PENDING', 'FAILED', 'CANCELLED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-4 py-3 text-left">Time</th>
                            <th className="px-4 py-3 text-left">Symbol</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-left">Strategy</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                    No orders found
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                        {(() => {
                                            try {
                                                return order.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                }) : '-';
                                            } catch (e) {
                                                return '-';
                                            }
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        {order.symbol}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-bold ${order.type === 'BUY' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {order.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.strategy ? (
                                            <span 
                                                className="inline-block px-2 py-0.5 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-semibold rounded border border-purple-200 dark:border-purple-800 cursor-help"
                                                title={order.notes || "No notes provided"}
                                            >
                                                {order.strategy}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                                        {order.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                                        ₹{order.execution_price ? order.execution_price.toFixed(2) : '0.00'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {['PENDING', 'OPEN'].includes(order.status) && (
                                            <button
                                                onClick={() => handleCancel(order.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Cancel Order"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
