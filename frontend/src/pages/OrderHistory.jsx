import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUserOrders, cancelOrder } from '../api/orders';
import { useToast } from '../context/ToastContext';

const STATUS_COLORS = {
  Placed: 'badge-blue',
  Preparing: 'badge-yellow',
  Ready: 'badge-green',
  Completed: 'badge-gray',
  Cancelled: 'badge-red',
};

const STATUS_STEPS = ['Placed', 'Preparing', 'Ready', 'Completed'];

function StatusTracker({ status }) {
  if (status === 'Cancelled') {
    return <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '0.3rem 0.85rem' }}>Order Cancelled</span>;
  }
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div>
      <div className="status-steps">
        {STATUS_STEPS.map((step, idx) => (
          <div key={step} className="status-step" style={{ flex: idx < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
            <div>
              <div className={`step-dot${idx < currentIdx ? ' done' : idx === currentIdx ? ' current' : ''}`}>
                {idx < currentIdx ? 'Done' : idx + 1}
              </div>
              <div className="step-label">{step}</div>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`step-line${idx < currentIdx ? ' done' : ''}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const toast = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await getUserOrders();
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    setCancelingId(orderId);
    try {
      await cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelingId(null);
      setConfirmCancel(null);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 700 }}>Orders</div>
          <p style={{ color: 'var(--gray-500)' }}>No orders yet. <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Start ordering!</Link></p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="order-card" id={`order-${order._id}`}>
            <div className="order-card-header">
              <div>
                <span className="order-id">{order.orderId}</span>
                <span className="order-date" style={{ marginLeft: '1rem' }}>
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              <span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status}</span>
            </div>
            <div className="order-card-body">
              <StatusTracker status={order.status} />

              <div className="order-items-list" style={{ marginTop: '1rem' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span>{item.name} x {item.quantity}</span>
                    <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {order.specialInstructions && (
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
                  Note: {order.specialInstructions}
                </p>
              )}

              <div className="order-total">
                <span>Total</span>
                <span>Rs. {order.totalAmount.toFixed(2)}</span>
              </div>

              <div className="order-actions">
                <Link to={`/orders/${order._id}`} className="btn btn-outline btn-sm">Track Order</Link>
                {order.status === 'Placed' && (
                  <button
                    className="btn btn-danger btn-sm"
                    id={`cancel-order-${order._id}`}
                    onClick={() => setConfirmCancel(order._id)}
                    disabled={cancelingId === order._id}
                  >
                    {cancelingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {confirmCancel && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h2>Cancel Order</h2>
              <button className="modal-close" onClick={() => setConfirmCancel(null)}>x</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)' }}>Are you sure you want to cancel this order? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmCancel(null)}>Keep Order</button>
              <button className="btn btn-danger" onClick={() => handleCancel(confirmCancel)}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}