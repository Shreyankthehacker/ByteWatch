import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { uploadVideo } from '../api/videoService';

const UploadVideo = () => {
  const userId = useAuthStore((state) => state.userId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [visibilityType, setVisibilityType] = useState('private');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!videoFile) {
      setError('Please select a video file to upload.');
      return;
    }
    if (!thumbnailFile) {
      setError('Please select a thumbnail image.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', videoFile);
      formData.append('thumbnail', thumbnailFile);

      const visibilityValue = visibilityType === 'public' ? 0 : parseInt(userId, 10);
      formData.append('visibility', visibilityValue);

      await uploadVideo(formData);
      setSuccess('Video uploaded successfully! Redirecting to library...');
      setTimeout(() => {
        navigate('/private');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Failed to upload video. Please ensure file sizes are within limits.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="bw-page bw-page--narrow">
      <div className="bw-form-card">
        <header style={{ marginBottom: '24px' }}>
          <div className="bw-eyebrow">CREATOR PORTAL</div>
          <h1 className="bw-title" style={{ fontSize: '28px', margin: '8px 0 0 0' }}>Upload Video</h1>
        </header>

        {error && <div className="bw-error-box">{error}</div>}
        {success && <div className="bw-success-box">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="bw-field">
            <label htmlFor="title">Video Title</label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a catchy title"
            />
          </div>

          <div className="bw-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your video about?"
            />
          </div>

          <div className="bw-field">
            <label htmlFor="videoFile">Video File</label>
            <input
              id="videoFile"
              type="file"
              accept="video/*"
              required
              onChange={handleVideoChange}
              style={{ padding: '8px' }}
            />
            <span className="bw-field-hint">Supports MP4, MKV, AVI, etc. (max 500MB)</span>
          </div>

          <div className="bw-field">
            <label htmlFor="thumbnailFile">Thumbnail Image</label>
            <input
              id="thumbnailFile"
              type="file"
              accept="image/*"
              required
              onChange={handleThumbnailChange}
              style={{ padding: '8px' }}
            />
            <span className="bw-field-hint">PNG, JPEG (will be displayed on video card)</span>
          </div>

          <div className="bw-field">
            <label htmlFor="visibility">Visibility</label>
            <select
              id="visibility"
              value={visibilityType}
              onChange={(e) => setVisibilityType(e.target.value)}
            >
              <option value="private">Private (Only visible to you)</option>
              <option value="public">Public (Visible to everyone)</option>
            </select>
          </div>

          <button
            type="submit"
            className="bw-btn bw-btn--primary bw-btn--block"
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? 'Uploading & Processing stream...' : 'Upload Video'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadVideo;
