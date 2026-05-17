import { Order } from '../../types';

interface RecentActivityProps {
    orders: Order[];
}

export const RecentActivity = ({ orders }: RecentActivityProps) => {
    // Sort by date desc (newest first) to ensure "Recent" is actually recent
    const recentOrders = [...(orders || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    return (
        <div className="glass-card h-full flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span>⚡</span> Recent Activity
                </h3>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View All</button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                {recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-700 dark:text-gray-400 opacity-70">
                        <span>No recent activity</span>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-slate-600">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${order.type === 'BUY' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                                        {order.type === 'BUY' ? 'B' : 'S'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{order.symbol}</div>
                                        <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                            {order.quantity} qty @ ₹{order.execution_price.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs font-bold ${order.status === 'EXECUTED' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {order.status}
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
