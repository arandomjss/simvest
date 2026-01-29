import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';

export const OrdersPage = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const { orders, fetchOrders } = usePortfolioStore();

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const formatPrice = (price: number) => `₹${price.toFixed(2)}`;
    const formatDate = (date: string) => new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <nav className="bg-surface border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-xl font-bold text-primary">SimVest</h1>
                            <div className="hidden md:flex space-x-1">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/portfolio')}
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition"
                                >
                                    Portfolio
                                </button>
                                <button
                                    onClick={() => navigate('/orders')}
                                    className="px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded"
                                >
                                    Orders
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-text-secondary">{user?.email}</span>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-1.5 text-sm font-medium text-danger hover:bg-danger/5 rounded transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Order History</h2>

                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-text-secondary">No orders yet</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="mt-4 btn-primary"
                            >
                                Start Trading
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary">Time</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary">Type</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary">Symbol</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">Qty</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">Price</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">Total</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="table-row">
                                            <td className="py-3 px-3 text-xs text-text-secondary">{formatDate(order.createdAt)}</td>
                                            <td className="py-3 px-3">
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${order.type === 'BUY'
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-danger/10 text-danger'
                                                    }`}>
                                                    {order.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-sm font-medium text-text-primary">{order.symbol}</td>
                                            <td className="py-3 px-3 text-sm text-text-primary text-right">{order.quantity}</td>
                                            <td className="py-3 px-3 text-sm text-text-secondary text-right">{formatPrice(order.price)}</td>
                                            <td className="py-3 px-3 text-sm text-text-primary text-right">{formatPrice(order.total)}</td>
                                            <td className="py-3 px-3">
                                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-success/10 text-success">
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
