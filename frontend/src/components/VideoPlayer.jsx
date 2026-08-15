import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useAuthStore } from '../store/authStore';

const VideoPlayer = ({ videoId, status }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep volume, mute, playbackRate synced if they change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  useEffect(() => {
    let hlsInstance = null;
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);
    setQualities([]);
    setCurrentQuality(-1);

    const masterPlaylistUrl = `http://localhost:8080/api/videos/${videoId}/hls/master.m3u8`;

    if (Hls.isSupported()) {
      hlsInstance = new Hls({
        xhrSetup: (xhr, url) => {
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        }
      });

      hlsRef.current = hlsInstance;
      hlsInstance.loadSource(masterPlaylistUrl);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        const levels = hlsInstance.levels.map((level, index) => ({
          id: index,
          height: level.height,
          name: level.height ? `${level.height}p` : `Stream ${index + 1}`
        }));
        setQualities(levels);
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Failed to fetch video stream files (Network error).');
              hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media playback error, attempting recovery...');
              hlsInstance.recoverMediaError();
              break;
            default:
              setError('Playback failed.');
              break;
          }
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native iOS/Safari fallback
      video.src = masterPlaylistUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
      });
      video.addEventListener('error', () => {
        setError('Video playback failed in this browser.');
      });
    } else {
      setError('HLS playback is not supported in this browser.');
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoId, token]);

  if (status && status !== 'READY') {
    return (
      <div 
        className="bw-player-container" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px', 
          background: '#09090b', 
          padding: '24px' 
        }}
      >
        <div className="bw-spinner"></div>
        <p style={{ margin: 0, fontWeight: '600' }}>
          {status === 'PROCESSING' || status === 'UPLOADING' ? 'Processing video...' : 'Video processing failed.'}
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--bw-text-mute)' }}>
          Please wait while the server completes transcodings.
        </p>
      </div>
    );
  }

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(e => console.error('Play error:', e));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleProgressClick = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(0.5);
    } else {
      setIsMuted(true);
      setVolume(0);
    }
  };

  const handleSpeedChange = (e) => {
    setPlaybackRate(parseFloat(e.target.value));
  };

  const handleQualityChange = (e) => {
    const levelId = parseInt(e.target.value, 10);
    setCurrentQuality(levelId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Fullscreen request failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    if (hours > 0) {
      const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${minutes}:${paddedSeconds}`;
  };

  return (
    <div ref={containerRef} className="bw-player-container">
      {error && (
        <div 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            zIndex: 10, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(9, 9, 11, 0.95)', 
            padding: '16px',
            textAlign: 'center'
          }}
        >
          <p style={{ color: 'var(--bw-red)', fontWeight: '600', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && !error && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9, 9, 11, 0.6)' }}>
          <div className="bw-spinner"></div>
        </div>
      )}

      <video
        ref={videoRef}
        className="bw-player-video"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      <div className="bw-player-controls">
        <div className="bw-player-progress-bar" onClick={handleProgressClick}>
          <div 
            className="bw-player-progress-filled" 
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="bw-player-controls-row">
          <div className="bw-player-controls-group">
            <button className="bw-player-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button className="bw-player-btn" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM19 12c0 2.82-1.71 5.25-4.17 6.32l1.42 1.42C19.33 18.06 21 15.22 21 12s-1.67-6.06-4.75-7.74l-1.42 1.42C17.29 6.75 19 9.18 19 12zM3 9v6h4l5 5V4L7 9H3z"/>
                </svg>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="bw-player-volume-slider"
            />

            <span className="bw-player-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="bw-player-controls-group">
            <select 
              value={playbackRate} 
              onChange={handleSpeedChange}
              className="bw-player-select"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>

            {qualities.length > 0 && (
              <select 
                value={currentQuality} 
                onChange={handleQualityChange}
                className="bw-player-select"
              >
                <option value="-1">Auto</option>
                {qualities.map(q => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            )}

            <button className="bw-player-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
