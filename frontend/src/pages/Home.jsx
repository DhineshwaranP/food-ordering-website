import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenuItems } from '../api/menu';
import { placeOrder } from '../api/orders';
import { toggleFavorite } from '../api/auth';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'];

function PaymentModal({ totalAmount, items, onConfirm, onCancel }) {
  const [method, setMethod] = useState('COD');
  const [step, setStep] = useState('select');

  const proceed = () => {
    if (method === 'COD') {
      onConfirm('COD', 'Pending');
      return;
    }
    if (step === 'select') {
      setStep(method === 'UPI' ? 'upi' : 'card');
      return;
    }
    onConfirm(method, 'Paid');
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2>Checkout & Payment</h2>
          <button className="modal-close" onClick={onCancel}>x</button>
        </div>
        <div className="modal-body">
          <div className="payment-summary">
            <h3>Order Summary</h3>
            {items.map((item) => (
              <div key={item.menuItem} className="payment-row">
                <span>{item.quantity} x {item.name}</span>
                <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="payment-total">
              <span>Total</span>
              <span>Rs. {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {step === 'select' ? (
            <div className="payment-methods">
              {[
                ['COD', 'Cash on Delivery', 'Pay when you pick up your order'],
                ['UPI', 'UPI Payment', 'Scan QR and confirm payment'],
                ['CARD', 'Card Payment', 'Demo debit/credit card payment'],
              ].map(([value, title, subtitle]) => (
                <label key={value} className={`payment-option${method === value ? ' active' : ''}`}>
                  <input type="radio" name="payment" checked={method === value} onChange={() => setMethod(value)} />
                  <span>
                    <strong>{title}</strong>
                    <small>{subtitle}</small>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="payment-demo">
              {step === 'upi' ? (
                <>
                  <h3>Scan QR Code</h3>
                  <div className="fake-qr" />
                  <p>Amount: <strong>Rs. {totalAmount.toFixed(2)}</strong></p>
                </>
              ) : (
                <>
                  <h3>Demo Card Payment</h3>
                  <input className="form-control" value="4242 4242 4242 4242" readOnly />
                  <div className="card-demo-grid">
                    <input className="form-control" value="12/30" readOnly />
                    <input className="form-control" value="123" readOnly />
                  </div>
                  <p>This is a simulated payment for the project demo.</p>
                </>
              )}
              <button className="btn btn-secondary w-full" onClick={() => setStep('select')}>Change Method</button>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={proceed}>{step === 'select' && method !== 'COD' ? 'Continue' : 'Confirm Order'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [confirmOrder, setConfirmOrder] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const cart = useCart();
  const { user, updateFavorites } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search.trim()) params.search = search.trim();
      if (onlyAvailable) params.available = 'true';
      const { data } = await getMenuItems(params);
      setMenuItems(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [category, search, onlyAvailable, toast]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const isFavorite = (itemId) => user?.favorites?.some((fav) => (typeof fav === 'object' ? fav._id === itemId : fav === itemId));

  const handleFavorite = async (itemId) => {
    try {
      const { data } = await toggleFavorite(itemId);
      updateFavorites(data.favorites);
      toast.success('Favorites updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update favorite');
    }
  };

  const handlePlaceOrder = async (paymentMethod, paymentStatus) => {
    if (cart.items.length === 0) {
      toast.warning('Your cart is empty');
      return;
    }
    setPlacingOrder(true);
    try {
      const { data } = await placeOrder({
        items: cart.items.map(({ menuItem, quantity }) => ({ menuItem, quantity })),
        specialInstructions,
        paymentMethod,
        paymentStatus,
      });
      cart.clearCart();
      setSpecialInstructions('');
      setConfirmOrder(false);
      toast.success('Order placed successfully');
      navigate(`/order-confirmed/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="home-layout">
      <aside className="sidebar">
        <div className="filter-card">
          <div className="filter-title">Categories</div>
          {CATEGORIES.map((cat) => (
            <button key={cat} className={`filter-category-btn${category === cat ? ' active' : ''}`} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
          <div className="filter-divider" />
          <label className="availability-row">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            Available only
          </label>
        </div>
      </aside>

      <main className="menu-panel">
        <form className="search-wrapper" onSubmit={(e) => { e.preventDefault(); fetchMenu(); }}>
          <input className="search-input" placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : menuItems.length === 0 ? (
          <div className="empty-state">No items found. Add food items from Admin Menu.</div>
        ) : (
          <div className="menu-grid">
            {menuItems.map((item) => {
              const qty = cart.getItemQuantity(item._id);
              return (
                <div key={item._id} className={`menu-item-card${!item.isAvailable ? ' menu-item-unavailable' : ''}`}>
                  {item.image ? <img src={item.image} alt={item.name} className="menu-item-img" /> : <div className="menu-item-img-placeholder">Food</div>}
                  <div className="menu-item-body">
                    <div className="menu-title-row">
                      <span className="menu-item-name">{item.name}</span>
                      <button className="fav-btn" onClick={() => handleFavorite(item._id)}>{isFavorite(item._id) ? 'Saved' : 'Save'}</button>
                    </div>
                    <p className="menu-item-desc">{item.description}</p>
                    <div className="menu-item-meta">
                      <span className="badge badge-blue">{item.category}</span>
                      <span>{item.preparationTime} min</span>
                    </div>
                  </div>
                  <div className="menu-item-footer">
                    <span className="menu-item-price">Rs. {item.price}</span>
                    {!item.isAvailable ? <span className="badge badge-red">Unavailable</span> : qty === 0 ? (
                      <button className="btn btn-primary btn-sm" onClick={() => cart.addItem(item)}>Add</button>
                    ) : (
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => cart.updateQuantity(item._id, qty - 1)}>-</button>
                        <span className="qty-value">{qty}</span>
                        <button className="qty-btn" onClick={() => cart.updateQuantity(item._id, qty + 1)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <aside className="cart-panel">
        <div className="cart-card">
          <div className="cart-header"><h2>Cart {cart.items.length > 0 && <span className="badge badge-blue">{cart.items.length}</span>}</h2></div>
          <div className="cart-items">
            {cart.items.length === 0 ? <div className="cart-empty">Your cart is empty</div> : cart.items.map((item) => (
              <div key={item.menuItem} className="cart-item">
                {item.image ? <img src={item.image} alt={item.name} className="cart-item-img" /> : <div className="cart-item-img" />}
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">Rs. {item.price} x {item.quantity}</div>
                </div>
                <span className="cart-item-subtotal">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                <button className="btn-icon" onClick={() => cart.removeItem(item.menuItem)}>x</button>
              </div>
            ))}
          </div>
          {cart.items.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total-row"><span>Total</span><strong>Rs. {cart.totalAmount.toFixed(2)}</strong></div>
              <textarea className="special-instructions" rows={2} placeholder="Special instructions..." value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
              <button className="btn btn-primary btn-lg w-full" onClick={() => setConfirmOrder(true)} disabled={placingOrder}>{placingOrder ? 'Placing...' : 'Place Order'}</button>
            </div>
          )}
        </div>
      </aside>

      {confirmOrder && <PaymentModal totalAmount={cart.totalAmount} items={cart.items} onConfirm={handlePlaceOrder} onCancel={() => setConfirmOrder(false)} />}
    </div>
  );
}