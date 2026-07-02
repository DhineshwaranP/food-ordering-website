import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../api/orders';
import { useToast } from '../../context/ToastContext';
import { AdminSidebar } from './Dashboard';

const STATUS_OPTIONS = ['Placed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
const STATUS_MESSAGES = {
  Placed: 'Your order has been placed and sent to the kitchen.',
  Preparing: 'Your food is being prepared now.',
  Ready: 'Your order is ready for pickup.',
  Completed: 'Your order has been completed. Thank you!',
  Cancelled: 'Your order has been cancelled.',
};
const STATUS_COLORS = { Placed: 'badge-blue', Preparing: 'badge-yellow', Ready: 'badge-green', Completed: 'badge-gray', Cancelled: 'badge-red' };

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const toast = useToast();

  const fetchOrders = async (currPage = 1) => {
    setLoading(true);
    try {
      const params = { page: currPage, limit: 15 };
      if (filterStatus !== 'All') params.status = filterStatus;
      const { data } = await getAllOrders(params);
      setOrders(data.orders);
      setTotalPages(data.pages);
      setPage(data.page);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1); }, [filterStatus]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const { data } = await updateOrderStatus(id, newStatus, STATUS_MESSAGES[newStatus]);
      toast.success('Order status updated and message sent to customer');
      setOrders((prev) => prev.map((o) => o._id === id ? data : o));
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ margin: 0 }}>Order Management</h1>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchOrders(page)}>Refresh</button>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['All', ...STATUS_OPTIONS].map((s) => (
            <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(s)} id={`filter-${s.toLowerCase()}`}>{s}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} id={`admin-order-${order._id}`}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{order.orderId}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{new Date(order.createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.user?.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{order.user?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', maxWidth: 200 }}>
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        {order.specialInstructions && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.2rem' }}>Note: {order.specialInstructions}</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>Rs. {order.totalAmount.toFixed(2)}</td>
                      <td><span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                      <td>
                         <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{order.paymentMethod}</div>
                         <div className={`badge badge-${order.paymentStatus === 'Paid' ? 'green' : order.paymentStatus === 'Failed' ? 'red' : 'yellow'}`} style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>{order.paymentStatus}</div>
                      </td>
                      <td>
                        <select
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', width: 130, fontSize: '0.85rem' }}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={updatingId === order._id || order.status === 'Completed' || order.status === 'Cancelled'}
                          id={`update-status-${order._id}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} disabled={s === 'Placed' && order.status !== 'Placed'}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--gray-100)' }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => fetchOrders(page - 1)}>Prev</button>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Page {page} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => fetchOrders(page + 1)}>Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
