'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// ============================================
// Types
// ============================================

type OrderForChart = {
  total_price: number | null;
  status: string | null;
  created_at: string;
  items: { item_name: string | null; quantity: number | null }[];
};

type DashboardChartsProps = {
  orders: OrderForChart[];
};

// ============================================
// Colors
// ============================================

const COLORS = ['#0066FF', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

const STATUS_COLORS: Record<string, string> = {
  paid: '#10B981',
  completed: '#0066FF',
  pending: '#F59E0B',
  cancelled: '#EF4444',
};

// ============================================
// Data Builders
// ============================================

function buildDailyRevenue(orders: OrderForChart[]) {
  const revenueByDay = new Map<string, number>();

  orders.forEach((order) => {
    const date = new Date(order.created_at);
    const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const current = revenueByDay.get(dayKey) || 0;
    revenueByDay.set(dayKey, current + (order.total_price ?? 0));
  });

  // Sort by date and return last 7 entries
  return Array.from(revenueByDay.entries())
    .map(([day, revenue]) => ({ day, revenue: Math.round(revenue * 100) / 100 }))
    .slice(-7);
}

function buildStatusBreakdown(orders: OrderForChart[]) {
  const countByStatus = new Map<string, number>();

  orders.forEach((order) => {
    const status = order.status || 'unknown';
    countByStatus.set(status, (countByStatus.get(status) || 0) + 1);
  });

  return Array.from(countByStatus.entries()).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: STATUS_COLORS[name] || '#64748B',
  }));
}

function buildTopItems(orders: OrderForChart[]) {
  const itemCounts = new Map<string, number>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const name = item.item_name || 'Unknown';
      itemCounts.set(name, (itemCounts.get(name) || 0) + (item.quantity || 1));
    });
  });

  return Array.from(itemCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

// ============================================
// Component
// ============================================

export default function DashboardCharts({ orders }: DashboardChartsProps) {
  const dailyRevenue = buildDailyRevenue(orders);
  const statusBreakdown = buildStatusBreakdown(orders);
  const topItems = buildTopItems(orders);

  return (
    <div className="charts-grid">
      {/* Revenue Bar Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Revenue Overview</h3>
          <span className="chart-subtitle">Daily revenue (SAR)</span>
        </div>
        <div className="chart-body">
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: number | undefined) => [`SAR ${(value || 0).toFixed(2)}`, 'Revenue']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="revenue" fill="#0066FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No revenue data yet</div>
          )}
        </div>
      </div>

      {/* Status Pie Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Order Status</h3>
          <span className="chart-subtitle">Breakdown by status</span>
        </div>
        <div className="chart-body">
          {statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => [value || 0, name || '']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No orders yet</div>
          )}
        </div>
      </div>

      {/* Top Items Bar Chart */}
      <div className="chart-card chart-wide">
        <div className="chart-header">
          <h3>Popular Items</h3>
          <span className="chart-subtitle">Most ordered dishes</span>
        </div>
        <div className="chart-body">
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topItems}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#1E293B', fontWeight: 500 }}
                  width={120}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [value || 0, 'Orders']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {topItems.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No item data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
