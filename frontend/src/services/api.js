import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Địa chỉ Backend FastAPI của bạn (relative path)
});

// Hàm lấy danh sách sản phẩm từ Backend
export const getProducts = () => api.get('/products/');

// Hàm đăng nhập
export const login = (credentials) => api.post('/auth/login', credentials);

export default api;