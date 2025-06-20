import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api';

interface User {
	id: number;
	email: string;
	name: string;
	role: string;
}

export const useAuthStore = defineStore('auth', () => {
	const user = ref<User | null>(null);
	const token = ref<string | null>(localStorage.getItem('token'));
	const loading = ref(false);
	const error = ref<string | null>(null);

	async function login(email: string, password: string) {
		loading.value = true;
		error.value = null;
		try {
			const response = await api.post('/api/auth/login', { email, password });
			user.value = response.data.user;
			token.value = response.data.token;
			localStorage.setItem('token', response.data.token);
			return response.data.user;
		} catch (err: any) {
			error.value = err.response?.data?.message || 'Ошибка входа';
			throw error.value;
		} finally {
			loading.value = false;
		}
	}

	function logout() {
		user.value = null;
		token.value = null;
		localStorage.removeItem('token');
	}

	return { user, token, loading, error, login, logout };
});
