import api from './axios';

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data; // returns { token, userId }
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/api/users/create-users', {
    name,
    email,
    password,
    role: 'VIEWER'
  });
  return response.data;
};

export const getUserProfile = async (userId) => {
  const response = await api.get(`/api/users/get-user/${userId}`);
  return response.data;
};
