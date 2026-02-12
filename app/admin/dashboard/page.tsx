import { redirect } from 'next/navigation';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase-server';
import DashboardCharts from './DashboardCharts';

type Order = {
  id: string;
  customer_name: string | null;
  phone_number: string | null;
  total_price: number | null;
  status: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  item_name: string | null;
  quantity: number | null;
  price: number | null;
};

type OrderWithItems = Order & { items: OrderItem[] };

function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getTodayRange() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
}

function formatPrice(value: number | null) {
  if (value === null) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getOrdersData() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { orders: [], totalRevenue: 0, totalOrders: 0 };
  }

  // Fetch all orders (not just today) so the dashboard always shows data.
  // TODO: Add date filter/picker in the UI for production.
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (ordersError) {
    console.error('Error fetching orders:', ordersError.message);
    return { orders: [], totalRevenue: 0, totalOrders: 0 };
  }

  const safeOrders = (orders ?? []) as Order[];

  const orderIds = safeOrders.map((o) => o.id);
  let itemsByOrderId = new Map<string, OrderItem[]>();

  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (!itemsError && items) {
      const safeItems = items as OrderItem[];
      itemsByOrderId = safeItems.reduce((map, item) => {
        const key = item.order_id;
        if (!key) return map;
        const list = map.get(key) ?? [];
        list.push(item);
        map.set(key, list);
        return map;
      }, new Map<string, OrderItem[]>());
    }
  }

  const ordersWithItems: OrderWithItems[] = safeOrders.map((o) => ({
    ...o,
    items: itemsByOrderId.get(o.id) ?? [],
  }));

  const paidOrders = safeOrders.filter((o) => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_price ?? 0), 0);
  const totalOrders = paidOrders.length;

  return { orders: ordersWithItems, totalRevenue, totalOrders };
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServer();
  if (!supabase) redirect('/login?redirect=/admin/dashboard');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/dashboard');

  // Additional role check for defense-in-depth security
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  // If no profile or user is inactive, redirect to login
  if (profileError || !profile || !profile.is_active) {
    redirect('/login?error=profile_not_found');
  }

  // Check if user has ADMIN or OWNER role
  const allowedRoles = ['ADMIN', 'OWNER'];
  if (!allowedRoles.includes(profile.role)) {
    redirect('/?error=insufficient_permissions');
  }

  const { orders, totalRevenue, totalOrders } = await getOrdersData();
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Al Asala</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </a>
          <a href="#orders" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Orders
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header id="dashboard" className="content-header">
          <div>
            <h1>Dashboard</h1>
            <p className="header-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon revenue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Total Revenue</p>
              <h2 className="kpi-value">${formatPrice(totalRevenue)}</h2>
              <p className="kpi-change positive">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                Today
              </p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon orders">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Paid Orders</p>
              <h2 className="kpi-value">{totalOrders}</h2>
              <p className="kpi-change neutral">orders today</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon average">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Average Order</p>
              <h2 className="kpi-value">${formatPrice(averageOrderValue)}</h2>
              <p className="kpi-change neutral">per order</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon pending">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">All Orders</p>
              <h2 className="kpi-value">{orders.length}</h2>
              <p className="kpi-change neutral">total today</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <DashboardCharts
          orders={orders.map((o) => ({
            total_price: o.total_price,
            status: o.status,
            created_at: o.created_at,
            items: o.items.map((i) => ({ item_name: i.item_name, quantity: i.quantity })),
          }))}
        />

        {/* Orders Table */}
        <div id="orders" className="orders-card">
          <div className="card-header">
            <h2>Recent Orders</h2>
            <span className="order-count">{orders.length} orders</span>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3>No orders yet</h3>
              <p>New orders will appear here as they come in</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Order Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="time-cell">{formatTime(order.created_at)}</td>
                      <td className="customer-cell">
                        <span className="customer-name">{order.customer_name || '—'}</span>
                      </td>
                      <td className="phone-cell">{order.phone_number || '—'}</td>
                      <td className="items-cell">
                        {order.items.length > 0 ? (
                          <div className="items-detail">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="item-row">
                                <span className="item-name">{item.item_name || 'Item'}</span>
                                <span className="item-meta">×{item.quantity} — SAR {formatPrice(item.price ?? 0)}</span>
                              </div>
                            ))}
                          </div>
                        ) : <span className="no-items">No items recorded</span>}
                      </td>
                      <td className="amount-cell">SAR {formatPrice(order.total_price)}</td>
                      <td className="status-cell">
                        {order.status === 'paid' ? (
                          <span className="status-badge paid">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Paid
                          </span>
                        ) : (
                          <span className="status-badge pending">
                            {order.status || 'Pending'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="dashboard-footer">
          <p>Last updated: {new Date().toLocaleTimeString('en-US')}</p>
        </footer>
      </main>

      <style>{`
        /* Corporate Trust - Stripe/Linear Inspired Dashboard */
        :root {
          --primary: #0066FF;
          --primary-hover: #0052CC;
          --primary-light: #E6F0FF;
          --secondary: #64748B;
          --bg: #F8FAFC;
          --bg-card: #FFFFFF;
          --text: #1E293B;
          --text-secondary: #475569;
          --text-muted: #64748B;
          --border: #E2E8F0;
          --border-light: #F1F5F9;
          --success: #10B981;
          --success-light: #D1FAE5;
          --warning: #F59E0B;
          --warning-light: #FEF3C7;
          --error: #EF4444;
          --radius: 8px;
          --radius-md: 12px;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        html { scroll-behavior: smooth; }
        #dashboard, #orders { scroll-margin-top: 16px; }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--bg);
          color: var(--text);
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
        }

        /* Sidebar */
        .sidebar {
          width: 240px;
          background: var(--bg-card);
          border-right: 1px solid var(--border);
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid var(--border);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: white;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .logo-text {
          font-weight: 600;
          font-size: 15px;
          color: var(--text);
        }

        .sidebar-nav {
          padding: 12px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius);
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s ease;
          margin-bottom: 4px;
        }

        .nav-item:hover {
          background: var(--border-light);
          color: var(--text);
        }

        .nav-item.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .nav-item svg {
          opacity: 0.7;
        }

        .nav-item.active svg {
          opacity: 1;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 240px;
          padding: 24px 32px;
          min-height: 100vh;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .content-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .header-date {
          font-size: 14px;
          color: var(--text-muted);
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: var(--radius);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          background: var(--primary-hover);
        }

        .btn-secondary {
          background: var(--bg-card);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          background: var(--border-light);
          border-color: var(--secondary);
        }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }

        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .chart-card.chart-wide {
          grid-column: 1 / -1;
        }

        .chart-header {
          padding: 20px 24px 0;
        }

        .chart-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 2px;
        }

        .chart-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }

        .chart-body {
          padding: 16px 12px 12px;
        }

        .chart-empty {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 14px;
        }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .kpi-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          gap: 16px;
          transition: all 0.15s ease;
        }

        .kpi-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--secondary);
        }

        .kpi-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-icon.revenue {
          background: #D1FAE5;
          color: #059669;
        }

        .kpi-icon.orders {
          background: var(--primary-light);
          color: var(--primary);
        }

        .kpi-icon.average {
          background: #FEF3C7;
          color: #D97706;
        }

        .kpi-icon.pending {
          background: #EDE9FE;
          color: #7C3AED;
        }

        .kpi-content {
          flex: 1;
          min-width: 0;
        }

        .kpi-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .kpi-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .kpi-change {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .kpi-change.positive {
          color: var(--success);
        }

        .kpi-change.neutral {
          color: var(--text-muted);
        }

        /* Orders Card */
        .orders-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .card-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }

        .order-count {
          font-size: 13px;
          color: var(--text-muted);
          background: var(--border-light);
          padding: 4px 10px;
          border-radius: 9999px;
        }

        /* Empty State */
        .empty-state {
          padding: 64px 24px;
          text-align: center;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: var(--border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: var(--text-muted);
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          color: var(--text-muted);
        }

        /* Table */
        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
          background: var(--border-light);
        }

        td {
          padding: 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
        }

        tr:hover td {
          background: var(--border-light);
        }

        tr:last-child td {
          border-bottom: none;
        }

        .time-cell {
          color: var(--text-muted);
          font-size: 13px;
        }

        .customer-name {
          font-weight: 500;
          color: var(--text);
        }

        .phone-cell {
          color: var(--text-secondary);
          font-family: 'SF Mono', Menlo, monospace;
          font-size: 13px;
        }

        .items-detail {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .item-row {
          display: flex;
          flex-direction: column;
          background: var(--border-light);
          padding: 6px 10px;
          border-radius: 6px;
          border-left: 3px solid var(--primary);
        }

        .item-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .item-meta {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .no-items {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }

        .amount-cell {
          font-weight: 600;
          color: var(--text);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.paid {
          background: var(--success-light);
          color: var(--success);
        }

        .status-badge.pending {
          background: var(--warning-light);
          color: var(--warning);
        }

        /* Footer */
        .dashboard-footer {
          margin-top: 32px;
          text-align: center;
          padding: 16px;
        }

        .dashboard-footer p {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .sidebar {
            display: none;
          }

          .main-content {
            margin-left: 0;
            padding: 20px;
          }

          .content-header {
            flex-direction: column;
            gap: 16px;
          }

          .header-actions {
            width: 100%;
          }

          .btn-primary,
          .btn-secondary {
            flex: 1;
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }

          table {
            font-size: 13px;
          }

          th, td {
            padding: 12px 10px;
          }

          .items-cell {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
