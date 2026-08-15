import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getUserProfile } from '../api/authService';
import Loading from '../components/Loading';

const Profile = () => {
  const userId = useAuthStore((state) => state.userId);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getUserProfile(userId);
        if (active) {
          setProfile(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError('Failed to fetch user profile.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <div className="bw-page bw-page--narrow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="bw-form-card">
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="bw-eyebrow" style={{ justifyContent: 'center' }}>ACCOUNT PROFILE</div>
          <h1 className="bw-title" style={{ fontSize: '28px', margin: '8px 0 0 0' }}>Profile Details</h1>
        </header>

        {loading ? (
          <Loading message="Loading profile..." />
        ) : error ? (
          <div className="bw-error-box">{error}</div>
        ) : (
          <div style={styles.profileDetails}>
            <div style={styles.detailRow}>
              <span style={styles.label}>User ID</span>
              <span style={styles.value}>{profile.id ?? profile.userID}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.label}>Full Name</span>
              <span style={styles.value}>{profile.name}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.label}>Email Address</span>
              <span style={styles.value}>{profile.email}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.label}>Account Role</span>
              <span style={styles.roleBadge}>{profile.role || 'VIEWER'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--bw-border-soft)',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--bw-text-dim)',
  },
  value: {
    fontSize: '14px',
    color: 'var(--bw-text)',
    fontWeight: '500',
  },
  roleBadge: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: 'var(--bw-primary)',
    fontSize: '12px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  }
};

export default Profile;
