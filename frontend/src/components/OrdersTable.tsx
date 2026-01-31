import { Order } from '../types';

interface OrdersTableProps {
    orders: Order[];
}

export const OrdersTable = ({ orders }: OrdersTableProps) => {
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'EXECUTED':
                return 'bg-success/10 text-success';
            case 'PENDING':
                return 'bg-warning/10 text-warning';
            case 'REJECTED':
            case 'CANCELLED':
                return 'bg-danger/10 text-danger';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getTypeColor = (type: string) => {
        return type === 'BUY' ? 'text-success' : 'text-danger';
    };

    if (orders.length === 0) {
        return (
            <div className="card p-6 flex flex-col items-center justify-center min-h-[200px]">
                <p className="text-text-secondary mb-2">No orders found</p>
                <p className="text-xs text-text-secondary/70">Your order history will appear here</p>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary">Order History</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-background-light text-left text-xs uppercase tracking-wider text-text-secondary border-b border-border">
                            <th className="px-6 py-3 font-medium">Time</th>
                            <th className="px-6 py-3 font-medium">Symbol</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium text-right">Qty</th>
                            <th className="px-6 py-3 font-medium text-right">Price</th>
                            <th className="px-6 py-3 font-medium text-right">Value</th>
                            <th className="px-6 py-3 font-medium text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-background-light/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                    {formatDate(order.timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                    {order.symbol}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getTypeColor(order.type)}`}>
                                    {order.type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                                    {order.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                                    ₹{order.execution_price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                                    ₹{(order.execution_price * order.quantity).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
