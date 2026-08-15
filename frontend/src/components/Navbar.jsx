import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo} onClick={() => setMobileMenuOpen(false)}>
          <span style={styles.logoPlay}>Byte</span>
          <span style={styles.logoWatch}>Watch</span>
        </Link>

        {/* Mobile menu button */}
        <button 
          className="bw-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          style={styles.mobileToggleBtn}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Links container */}
        <div className={`bw-nav-links ${mobileMenuOpen ? 'active' : ''}`} style={styles.linksContainer}>
          <Link 
            to="/" 
            style={isActive('/') ? styles.activeLink : styles.link}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          
          <Link 
            to="/private" 
            style={isActive('/private') ? styles.activeLink : styles.link}
            onClick={() => setMobileMenuOpen(false)}
          >
            My Videos
          </Link>
          <Link 
            to="/upload" 
            style={isActive('/upload') ? styles.activeLink : styles.link}
            onClick={() => setMobileMenuOpen(false)}
          >
            Upload
          </Link>

          <span className="bw-nav-divider" style={styles.divider}></span>

          {isAuthenticated ? (
            <>
              <Link 
                to="/profile" 
                style={isActive('/profile') ? styles.activeLink : styles.link}
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                style={isActive('/login') ? styles.activeLink : styles.link}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                style={styles.primaryLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'rgba(9, 9, 11, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--bw-border-soft)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '16px 24px',
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  logo: {
    fontSize: '22px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    letterSpacing: '-0.03em',
  },
  logoPlay: {
    color: '#fafafa',
  },
  logoWatch: {
    color: 'var(--bw-primary)',
    background: 'rgba(245, 158, 11, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '18px',
    fontWeight: '700',
  },
  mobileToggleBtn: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  linksContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  link: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--bw-text-dim)',
    transition: 'color 0.2s',
  },
  activeLink: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--bw-primary)',
  },
  divider: {
    width: '1px',
    height: '16px',
    background: 'var(--bw-border)',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--bw-red)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    transition: 'opacity 0.2s',
  },
  primaryLink: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#09090b',
    background: 'var(--bw-primary)',
    padding: '8px 16px',
    borderRadius: 'var(--bw-radius-sm)',
    transition: 'background 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default Navbar;
