import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVideoMetadata } from '../api/videoService';
import VideoPlayer from '../components/VideoPlayer';
import Loading from '../components/Loading';

const VideoWatch = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchMetadata = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getVideoMetadata(videoId);
        if (active) {
          setVideo(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          if (err.response?.status === 403) {
            setError("You do not have authorization to view this private video.");
          } else if (err.response?.status === 404) {
            setError("This video does not exist or has been deleted.");
          } else {
            setError("Failed to fetch video details from the server.");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchMetadata();

    return () => {
      active = false;
    };
  }, [videoId]);

  if (loading) {
    return (
      <div className="bw-page">
        <Loading message="Fetching stream details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bw-page" style={styles.errorContainer}>
        <div className="bw-error-box" style={{ maxWidth: '500px', width: '100%' }}>
          {error}
        </div>
        <Link to="/" className="bw-btn bw-btn--ghost" style={{ marginTop: '16px' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bw-page">
      <div style={styles.playerWrapper}>
        <VideoPlayer videoId={video.id} status={video.status} />
      </div>

      <div style={styles.detailsContainer}>
        <h1 className="bw-title" style={{ fontSize: '26px', margin: '24px 0 12px 0' }}>
          {video.title}
        </h1>

        <div style={styles.metaRow}>
          <span style={styles.metaBadge}>
            {video.visibility === 0 ? 'Public Video' : 'Private Video'}
          </span>
          <span style={styles.metaOwner}>
            Uploaded by: {video.userId ? `User #${video.userId}` : 'System'}
          </span>
          {video.fileSize && (
            <span style={styles.metaInfo}>
              Size: {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </div>

        <div style={styles.descriptionBox}>
          <h2 style={{ fontSize: '14px', color: 'var(--bw-text-dim)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Description
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--bw-text)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {video.description || 'No description provided.'}
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  playerWrapper: {
    width: '100%',
    marginBottom: '24px',
  },
  detailsContainer: {
    background: 'var(--bw-surface)',
    border: '1px solid var(--bw-border-soft)',
    borderRadius: 'var(--bw-radius)',
    padding: '24px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    borderBottom: '1px solid var(--bw-border-soft)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  metaBadge: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: 'var(--bw-primary)',
    fontSize: '12px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  metaOwner: {
    fontSize: '13px',
    color: 'var(--bw-text-dim)',
    fontWeight: '500',
  },
  metaInfo: {
    fontSize: '13px',
    color: 'var(--bw-text-mute)',
    fontFamily: 'var(--bw-font-mono)',
  },
  descriptionBox: {
    background: 'var(--bw-bg-raised)',
    padding: '16px',
    borderRadius: 'var(--bw-radius-sm)',
    border: '1px solid var(--bw-border-soft)',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 120px)',
    textAlign: 'center',
  }
};

export default VideoWatch;
