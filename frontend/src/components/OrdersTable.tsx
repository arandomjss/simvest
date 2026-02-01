import { useState } from 'react';
import { Order } from '../types';

interface OrdersTableProps {
    orders: Order[];
}

export const OrdersTable = ({ orders }: OrdersTableProps) => {
    const [filter, setFilter] = useState('ALL');

    const filteredOrders = orders.filter(order => {
        if (filter === 'ALL') return true;
        return order.status === filter;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            case 'CANCELLED': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-4">
                <div className="flex gap-2">
                    {['ALL', 'COMPLETED', 'PENDING', 'REJECTED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-4 py-3 text-left">Time</th>
                            <th className="px-4 py-3 text-left">Symbol</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                    No orders found
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                        {new Date(order.created_at).toLocaleString('en-IN', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {order.symbol}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-bold ${order.type === 'BUY' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {order.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-900">
                                        {order.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-900">
                                        ₹{order.execution_price ? order.execution_price.toFixed(2) : '0.00'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
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
