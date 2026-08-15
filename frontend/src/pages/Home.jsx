import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPublicVideos } from '../api/videoService';
import { getUserVideos } from '../api/userVideoService';
import VideoGrid from '../components/VideoGrid';
import Loading from '../components/Loading';

const Home = () => {
  const { isAuthenticated, userId } = useAuthStore();
  const [publicVideos, setPublicVideos] = useState([]);
  const [myVideos, setMyVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const pub = await getPublicVideos();
        if (active) setPublicVideos(pub);

        if (isAuthenticated && userId) {
          const mine = await getUserVideos(userId);
          if (active) setMyVideos(mine.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to load videos from the server.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [isAuthenticated, userId]);

  return (
    <div className="bw-page">
      {!isAuthenticated ? (
        <header style={styles.hero}>
          <div className="bw-eyebrow">BYTOWATCH STREAMING</div>
          <h1 className="bw-title bw-title--xl">Stream Your Videos Smoothly</h1>
          <p className="bw-subtitle">
            A high-performance HLS adaptive bitrate video streaming platform built with Spring Boot and React.
          </p>
          <div style={styles.heroBtns}>
            <Link to="/login" className="bw-btn bw-btn--primary">
              Get Started
            </Link>
            <a href="#public-videos" className="bw-btn bw-btn--ghost">
              Browse Videos
            </a>
          </div>
        </header>
      ) : (
        <header style={styles.dashboardHeader}>
          <div className="bw-eyebrow">DASHBOARD</div>
          <h1 className="bw-title bw-title--lg" style={{ margin: '8px 0 4px 0' }}>Welcome Back</h1>
          <p style={{ margin: 0, color: 'var(--bw-text-dim)', fontSize: '14px' }}>
            Browse public content or manage your private creations.
          </p>
        </header>
      )}

      {loading ? (
        <Loading message="Loading ByteWatch catalog..." />
      ) : error ? (
        <div className="bw-error-box" style={{ marginTop: '20px' }}>{error}</div>
      ) : (
        <div style={styles.contentContainer}>
          {isAuthenticated && myVideos.length > 0 && (
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 className="bw-title" style={{ fontSize: '20px', margin: 0 }}>My Recent Videos</h2>
                <Link to="/private" style={styles.sectionLink}>
                  View All ({myVideos.length})
                </Link>
              </div>
              <VideoGrid videos={myVideos} emptyMessage="You haven't uploaded any videos yet." />
            </section>
          )}

          <section id="public-videos" style={styles.section}>
            <h2 className="bw-title" style={{ fontSize: '22px', marginBottom: '16px' }}>
              Public Broadcasts
            </h2>
            <VideoGrid 
              videos={publicVideos} 
              emptyMessage="No public videos are available at this moment." 
            />
          </section>
        </div>
      )}
    </div>
  );
};

const styles = {
  hero: {
    padding: '64px 0',
    borderBottom: '1px solid var(--bw-border-soft)',
    marginBottom: '40px',
  },
  heroBtns: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  dashboardHeader: {
    padding: '24px 0',
    borderBottom: '1px solid var(--bw-border-soft)',
    marginBottom: '40px',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  sectionLink: {
    color: 'var(--bw-primary)',
    fontSize: '13px',
    fontWeight: '600',
  }
};

export default Home;
