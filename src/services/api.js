import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://seu-dyno.herokuapp.com';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const getNextCommitments = () => api.get('/api/commitments/next');
export const getCheckinHistory = (limit = 10) => api.get(`/api/checkins/history?limit=${limit}`);
export const getPredictions = () => api.get('/api/predictions');

export default api;