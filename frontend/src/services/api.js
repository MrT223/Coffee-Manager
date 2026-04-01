import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Địa chỉ Backend FastAPI của bạn
});

// Hàm lấy danh sách sản phẩm từ Backend
export const getProducts = () => api.get('/products/');

// Hàm đăng nhập
export const login = (credentials) => api.post('/auth/login', credentials);

export default api;