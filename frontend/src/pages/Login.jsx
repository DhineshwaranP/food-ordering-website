import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Utensils, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const goAfterLogin = (userData) => navigate(userData.role === 'admin' ? '/admin' : '/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('All fields are required'); return; }
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      goAfterLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="auth-split-container"
      >
        {/* Left Side: Visual Experience */}
        <div className="auth-visual">
          <div className="auth-visual-shapes"></div>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="glass-pill"
          >
            <ShieldCheck size={16} /> Secure Campus Access
          </motion.div>
          
          <div className="auth-visual-content">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Elevate your campus dining experience.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Skip the long queues. Order your favorite meals effortlessly and enjoy real-time tracking from kitchen to pickup.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8 }}
            style={{ marginTop: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}
          >
             <div style={{ display: 'flex', position: 'relative' }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4`} alt="user" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #ffffff', marginLeft: '0', zIndex: 3 }} />
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn&backgroundColor=c0aede`} alt="user" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #ffffff', marginLeft: '-12px', zIndex: 2 }} />
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=d1d4f9`} alt="user" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #ffffff', marginLeft: '-12px', zIndex: 1 }} />
             </div>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trusted by 2000+ students & staff</p>
          </motion.div>
        </div>

        {/* Right Side: Login Form */}
        <div className="auth-form-container">
          <div className="auth-logo">
            <h1><Utensils size={28} className="text-primary" fill="rgba(255, 71, 87, 0.15)" /> CampusCanteen</h1>
            <p>Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <div className="input-icon-wrapper">
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                <Mail className="input-icon" />
              </div>
            </div>
            
            <div className="form-group">
              <div className="flex justify-between items-center">
                <label className="form-label" htmlFor="login-password">Password</label>
                <Link to="#" className="text-xs text-primary-light hover:text-primary transition" style={{ textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div className="input-icon-wrapper">
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <Lock className="input-icon" />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="form-error" 
                style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                {error}
              </motion.p>
            )}

            <button type="submit" id="login-submit" className="btn btn-primary btn-lg w-full mt-2" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Authenticating...' : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>
          <GoogleSignInButton onSuccess={goAfterLogin} />

          <div className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
