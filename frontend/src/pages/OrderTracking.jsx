import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../api/orders';
import { useToast } from '../context/ToastContext';

const STATUS_STEPS = ['Placed', 'Preparing', 'Ready', 'Completed'];
const STATUS_COLORS = { Placed: 'badge-blue', Preparing: 'badge-yellow', Ready: 'badge-green', Completed: 'badge-gray', Cancelled: 'badge-red' };

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const toast = useToast();

  const fetchOrder = async () => {
    try {
      const { data } = await getOrderById(id);
      setOrder(data);
    } catch {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  useEffect(() => {
    if (!order || ['Completed', 'Cancelled'].includes(order.status)) return;
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [order]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOrder(order._id);
      toast.success('Order cancelled');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!order) return <div style={{ textAlign: 'center', padding: '3rem' }}><p>Order not found.</p><Link to="/orders" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Orders</Link></div>;

  const currentIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <Link to="/orders" className="btn btn-secondary btn-sm">Back</Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)' }}>Order Tracking</h1>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>{order.orderId}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '0.15rem' }}>
              Placed on {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
          <span className={`badge ${STATUS_COLORS[order.status]}`} style={{ fontSize: '0.85rem', padding: '0.35rem 1rem' }}>{order.status}</span>
        </div>
        <div className="card-body">
          {order.customerMessage && (
            <div className="customer-message">
              <strong>Message for you:</strong> {order.customerMessage}
            </div>
          )}
          {order.status === 'Cancelled' ? (
            <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>
              This order has been cancelled.
            </div>
          ) : (
            <div>
              <div className="status-steps" style={{ marginBottom: '0.5rem' }}>
                {STATUS_STEPS.map((step, idx) => (
                  <div key={step} className="status-step" style={{ flex: idx < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className={`step-dot${idx < currentIdx ? ' done' : idx === currentIdx ? ' current' : ''}`} style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
                        {idx < currentIdx ? 'Done' : idx + 1}
                      </div>
                      <div className="step-label" style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: idx <= currentIdx ? 'var(--gray-700)' : 'var(--gray-400)', fontWeight: idx === currentIdx ? 700 : 400 }}>{step}</div>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`step-line${idx < currentIdx ? ' done' : ''}`} style={{ marginBottom: '1.1rem' }} />
                    )}
                  </div>
                ))}
              </div>
              {order.status !== 'Completed' && (
                <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
                  Auto-refreshes every 15 seconds
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header"><h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Order Items</h2></div>
        <div className="card-body">
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: idx < order.items.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {item.image && <img src={item.image} alt={item.name} style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>Rs. {item.price} x {item.quantity}</div>
                </div>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Rs. {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)', fontWeight: 800, fontSize: '1rem', marginTop: '0.25rem' }}>
            <span>Total</span>
            <span>Rs. {order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.statusHistory?.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header"><h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Status History</h2></div>
          <div className="card-body">
            {order.statusHistory.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: idx < order.statusHistory.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                <span className={`badge ${STATUS_COLORS[h.status]}`}>{h.status}</span>
                <span style={{ color: 'var(--gray-400)' }}>{new Date(h.timestamp).toLocaleString()}</span>
                {h.message && <span style={{ color: 'var(--text-muted)', marginLeft: '0.75rem', flex: 1 }}>{h.message}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.status === 'Placed' && (
        <button className="btn btn-danger" id="cancel-order-btn" onClick={() => setShowConfirm(true)} disabled={cancelling}>
          {cancelling ? 'Cancelling...' : 'Cancel Order'}
        </button>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h2>Cancel Order</h2>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>x</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)' }}>Are you sure you want to cancel order <strong>{order.orderId}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Keep Order</button>
              <button className="btn btn-danger" onClick={handleCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}