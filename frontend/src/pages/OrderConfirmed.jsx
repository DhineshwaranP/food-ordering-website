import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../api/orders';

export default function OrderConfirmed() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="page-loader"><div className="spinner" /><p>Processing Order...</p></div>;
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card confirmation-card-small">
          <div className="confirmation-mark error">!</div>
          <h1>Order Not Found</h1>
          <p>We could not load this order.</p>
          <Link to="/" className="btn btn-primary">Return to Menu</Link>
        </div>
      </div>
    );
  }

  const estimatedTime = order.items?.reduce((max, item) => Math.max(max, item.menuItem?.preparationTime || 15), 15) || 15;

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-hero">
          <div className="confirmation-mark">OK</div>
          <div>
            <p className="confirmation-kicker">Order placed successfully</p>
            <h1>Order Confirmed</h1>
            <p>{order.customerMessage || 'Your order has been placed and sent to the kitchen.'}</p>
          </div>
        </div>

        <div className="confirmation-summary">
          <div className="summary-row">
            <span>Order ID</span>
            <strong>{order.orderId}</strong>
          </div>
          <div className="summary-row">
            <span>Payment</span>
            <div className="summary-badges">
              <span className={`badge badge-${order.paymentStatus === 'Paid' ? 'green' : 'yellow'}`}>{order.paymentStatus}</span>
              <span className="badge badge-blue">{order.paymentMethod}</span>
            </div>
          </div>

          <div className="summary-section-title">Items Ordered</div>
          {order.items.map((item) => (
            <div key={item._id} className="summary-row item-row">
              <span>{item.quantity} x {item.name}</span>
              <strong>Rs. {(item.price * item.quantity).toFixed(2)}</strong>
            </div>
          ))}

          <div className="summary-total">
            <span>Total Paid</span>
            <strong>Rs. {order.totalAmount.toFixed(2)}</strong>
          </div>
        </div>

        <div className="prep-card">
          <span>Estimated Prep Time</span>
          <strong>{estimatedTime} - {estimatedTime + 5} mins</strong>
        </div>

        <div className="confirmation-actions">
          <Link to="/" className="btn btn-secondary">Back to Menu</Link>
          <Link to={`/orders/${order._id}`} className="btn btn-primary">Track Order</Link>
        </div>
      </div>
    </div>
  );
}