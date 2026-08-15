import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchThumbnailBlob } from '../api/videoService';

export const SecureThumbnail = ({ videoId, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    const loadThumbnail = async () => {
      setLoading(true);
      setError(false);
      try {
        const url = await fetchThumbnailBlob(videoId);
        if (active) {
          objectUrl = url;
          setImgSrc(url);
        }
      } catch (err) {
        console.error('Failed to load thumbnail for video', videoId, err);
        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [videoId]);

  if (loading) {
    return (
      <div className="bw-video-card-thumb-placeholder bw-skeleton">
        Loading...
      </div>
    );
  }

  if (error || !imgSrc) {
    return (
      <div className="bw-video-card-thumb-placeholder">
        No Thumbnail
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
    />
  );
};

const VideoCard = ({ video }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/watch/${video.id}`);
  };

  const getVisibilityLabel = (vis) => {
    return vis === 0 ? 'Public' : 'Private';
  };

  return (
    <div className="bw-video-card" onClick={handleCardClick}>
      <div className="bw-video-card-thumb-wrapper">
        <SecureThumbnail 
          videoId={video.id} 
          alt={video.title} 
          className="bw-video-card-thumb" 
        />
        <span className="bw-video-card-badge">
          {video.status || 'READY'}
        </span>
      </div>
      <div className="bw-video-card-content">
        <h3 className="bw-video-card-title">{video.title}</h3>
        <p className="bw-video-card-desc">{video.description}</p>
        <div className="bw-video-card-meta">
          <span className="bw-video-card-owner">
            {video.userId ? `User #${video.userId}` : 'System'}
          </span>
          <span>
            {getVisibilityLabel(video.visibility)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
