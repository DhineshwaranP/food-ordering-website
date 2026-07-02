import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <span>Campus</span>Canteen
        </NavLink>

        <div className="navbar-links">
          {user?.role !== 'admin' && (
            <>
              <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
                Menu
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Orders {totalItems > 0 && <span className="badge badge-blue" style={{ marginLeft: 4 }}>{totalItems}</span>}
              </NavLink>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
                Dashboard
              </NavLink>
              <NavLink to="/admin/menu" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Menu
              </NavLink>
              <NavLink to="/admin/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Orders
              </NavLink>
            </>
          )}

          <span className="nav-user">{user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}