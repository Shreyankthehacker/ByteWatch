import api from './axios';

export const getUserVideos = async (userId) => {
  const response = await api.get(`/api/user/video/user-videos?userId=${userId}`);
  return response.data;
};
