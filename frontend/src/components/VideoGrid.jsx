import React from 'react';
import VideoCard from './VideoCard';

const VideoGrid = ({ videos, emptyMessage = 'No videos found.' }) => {
  if (!videos || videos.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <p style={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bw-video-grid">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

const styles = {
  emptyContainer: {
    padding: '48px 24px',
    textAlign: 'center',
    background: 'var(--bw-surface)',
    border: '1px dashed var(--bw-border)',
    borderRadius: 'var(--bw-radius)',
    marginTop: '16px',
  },
  emptyText: {
    margin: 0,
    color: 'var(--bw-text-mute)',
    fontSize: '14px',
    fontWeight: '500',
  }
};

export default VideoGrid;
