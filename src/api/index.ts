import axios from 'axios';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
});

// Перехватчик для добавления токена аутентификации
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Перехватчик для обработки ошибок
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Можно добавить логику для перенаправления на страницу входа
			localStorage.removeItem('token');
		}
		return Promise.reject(error);
	}
);

export const getSuppliers = () => api.get('/api/suppliers');

export default api;
