import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getAnalytics } from '../../api/orders';
import { useToast } from '../../context/ToastContext';

const AdminSidebar = () => (
  <div className="admin-sidebar">
    <div style={{ padding: '1rem 1.25rem 0.5rem', marginBottom: '0.5rem' }}>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Admin Panel</div>
    </div>
    <div className="admin-sidebar-title">Management</div>
    <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
    <NavLink to="/admin/menu" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>Menu Items</NavLink>
    <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>Orders</NavLink>
    <NavLink to="/" className="admin-nav-link" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>Back to Menu</NavLink>
  </div>
);

export { AdminSidebar };

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getAnalytics();
        setAnalytics(data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content"><div className="loading-center"><div className="spinner" /></div></div>
    </div>
  );

  const statusMap = {};
  analytics?.ordersByStatus?.forEach(({ _id, count }) => { statusMap[_id] = count; });

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Dashboard</h1>

        <div className="analytics-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">ORD</div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{analytics?.totalOrders ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">REV</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">Rs. {(analytics?.totalRevenue ?? 0).toFixed(0)}</div>
            <div className="stat-sub">Excluding cancelled orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-yellow">USR</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{analytics?.totalUsers ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-red">ITM</div>
            <div className="stat-label">Menu Items</div>
            <div className="stat-value">{analytics?.totalMenuItems ?? 0}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Orders by Status</h2></div>
            <div className="card-body">
              {['Placed', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map((s) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{s}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 100, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, ((statusMap[s] || 0) / (analytics?.totalOrders || 1)) * 100)}%`, background: s === 'Cancelled' ? 'var(--danger)' : s === 'Completed' ? 'var(--success)' : s === 'Ready' ? 'var(--accent)' : 'var(--primary)', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, minWidth: 24, textAlign: 'right' }}>{statusMap[s] || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Revenue Last 7 Days</h2></div>
            <div className="card-body">
              {analytics?.revenueByDay?.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No data yet</p>}
              {analytics?.revenueByDay?.map((day, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gray-500)' }}>
                    {day._id.day}/{day._id.month}/{day._id.year}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>Rs. {day.revenue.toFixed(0)} ({day.count} orders)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header"><h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Popular Items</h2></div>
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Total Ordered</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.popularItems?.map((item, idx) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700, color: 'var(--gray-400)' }}>#{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {item.image && <img src={item.image} alt={item.name} className="table-img" />}
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{item.category}</span></td>
                    <td>Rs. {item.price}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.totalOrders}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Revenue by Category</h2></div>
          <div className="card-body">
            {analytics?.categoryRevenue?.map((cat) => (
              <div key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{cat._id}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 120, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (cat.revenue / (analytics?.totalRevenue || 1)) * 100)}%`, background: 'var(--primary)', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>Rs. {cat.revenue.toFixed(0)}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{cat.count} sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}