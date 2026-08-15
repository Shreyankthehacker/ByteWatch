import api from './axios';

export const getPublicVideos = async () => {
  const response = await api.get('/api/videos/public');
  return response.data;
};

export const getVideoMetadata = async (videoId) => {
  const response = await api.get(`/api/videos/${videoId}`);
  return response.data;
};

export const uploadVideo = async (formData) => {
  const response = await api.post('/api/videos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getThumbnailUrl = (videoId) => {
  return `/api/videos/${videoId}/thumbnail`;
};

export const fetchThumbnailBlob = async (videoId) => {
  const response = await api.get(getThumbnailUrl(videoId), {
    responseType: 'blob'
  });
  return URL.createObjectURL(response.data);
};
