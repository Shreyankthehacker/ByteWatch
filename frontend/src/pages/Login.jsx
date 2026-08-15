import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/authService';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.token, data.userId);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bw-page bw-page--narrow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="bw-form-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="bw-title" style={{ margin: '0 0 8px 0', fontSize: '28px' }}>Welcome Back</h2>
          <p style={{ margin: 0, color: 'var(--bw-text-dim)', fontSize: '14px' }}>
            Log in to manage and view your ByteWatch stream
          </p>
        </div>

        {error && <div className="bw-error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="bw-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="bw-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="bw-btn bw-btn--primary bw-btn--block"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--bw-text-dim)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--bw-primary)', fontWeight: '600' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
