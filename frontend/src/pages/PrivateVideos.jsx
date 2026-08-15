import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getUserVideos } from '../api/userVideoService';
import VideoGrid from '../components/VideoGrid';
import Loading from '../components/Loading';

const PrivateVideos = () => {
  const userId = useAuthStore((state) => state.userId);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    let active = true;

    const fetchVideos = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getUserVideos(userId);
        if (active) {
          setVideos(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError('Failed to load your videos.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchVideos();

    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <div className="bw-page">
      <header style={styles.header}>
        <div>
          <div className="bw-eyebrow">MY STREAMS</div>
          <h1 className="bw-title bw-title--lg" style={{ margin: '8px 0 0 0' }}>My Videos</h1>
        </div>
        <Link to="/upload" className="bw-btn bw-btn--primary">
          Upload Video
        </Link>
      </header>

      {loading ? (
        <Loading message="Fetching your library..." />
      ) : error ? (
        <div className="bw-error-box">{error}</div>
      ) : videos.length === 0 ? (
        <div style={styles.emptyState}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--bw-text-mute)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125v-9.75M21 19.5a1.125 1.125 0 001.125-1.125M21 19.5H6.75M22.5 6H18m-3.75 0h-1.5M6.75 19.5V13.5M6.75 19.5v.75m0-7.5A2.25 2.25 0 019 10.5h3a2.25 2.25 0 012.25 2.25v6.75m0-6.75a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v6.75m-18-6h18" />
          </svg>
          <strong style={{ display: 'block', margin: '16px 0 8px 0', fontSize: '16px' }}>
            No Videos Found
          </strong>
          <p style={{ margin: '0 0 24px 0', color: 'var(--bw-text-dim)', fontSize: '14px', maxWidth: '360px' }}>
            You haven't uploaded any videos yet. Start sharing your creations with ByteWatch!
          </p>
          <Link to="/upload" className="bw-btn bw-btn--primary">
            Upload Video
          </Link>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--bw-border-soft)',
    paddingBottom: '24px',
    marginBottom: '32px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '80px 24px',
    background: 'var(--bw-surface)',
    border: '1px dashed var(--bw-border-soft)',
    borderRadius: 'var(--bw-radius)',
  }
};

export default PrivateVideos;
