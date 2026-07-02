import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const goAfterLogin = (user) => navigate(user.role === 'admin' ? '/admin' : '/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      };
      const { data } = await registerUser(payload);
      login(data.user, data.token);
      toast.success('Account created successfully!');
      goAfterLogin(data.user);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || err.message || 'Registration failed. Please check the backend server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card simple-auth-card">
        <div className="auth-logo">
          <h1><Utensils size={28} className="text-primary" /> CampusCanteen</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} id="register-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input id="reg-name" type="text" name="name" className="form-control" placeholder="John Doe" value={form.name} onChange={handleChange} autoComplete="name" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" name="email" className="form-control" placeholder="you@gmail.com" value={form.email} onChange={handleChange} autoComplete="email" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" name="password" className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input id="reg-confirm" type="password" name="confirmPassword" className="form-control" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">Account Type</label>
            <select id="reg-role" name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="user">Student / User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {errors.general && <p className="form-error form-error-box">{errors.general}</p>}

          <button type="submit" id="register-submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">or</div>
        <GoogleSignInButton role={form.role} label="Continue with Google" onSuccess={goAfterLogin} />

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}