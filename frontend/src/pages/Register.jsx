import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/authService';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await registerUser(name, email, password);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Failed to register account. Check details or email conflicts.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bw-page bw-page--narrow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="bw-form-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="bw-title" style={{ margin: '0 0 8px 0', fontSize: '28px' }}>Create Account</h2>
          <p style={{ margin: 0, color: 'var(--bw-text-dim)', fontSize: '14px' }}>
            Register to upload and watch HLS streams
          </p>
        </div>

        {error && <div className="bw-error-box">{error}</div>}
        {success && <div className="bw-success-box">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="bw-field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="bw-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
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
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--bw-text-dim)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--bw-primary)', fontWeight: '600' }}>
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
