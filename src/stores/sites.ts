import { defineStore } from 'pinia';
import api from '@/api';
import { ref } from 'vue';
import type { ConstructionSite, Section } from '@prisma/client';

interface SiteWithSections extends ConstructionSite {
	sections: Section[];
}

export const useSitesStore = defineStore('sites', () => {
	const sites = ref<SiteWithSections[]>([]);
	const currentSite = ref<SiteWithSections | null>(null);
	const loading = ref(false);
	const error = ref<string | null>(null);

	// Получить все объекты строительства
	async function fetchSites() {
		try {
			loading.value = true;
			console.log('fetchSites: отправка запроса на /api/sites');
			const response = await api.get('/api/sites');
			console.log('fetchSites: получен ответ', response.data);
			sites.value = response.data;
		} catch (err: any) {
			console.error('fetchSites: ошибка', err);
			error.value = err.response?.data?.error || 'Ошибка при получении объектов строительства';
		} finally {
			loading.value = false;
		}
	}

	// Получить объект строительства по ID
	async function fetchSiteById(id: number) {
		try {
			loading.value = true;
			console.log('fetchSiteById: отправка запроса на /api/sites/' + id);
			const response = await api.get(`/api/sites/${id}`);
			console.log('fetchSiteById: получен ответ', response.data);
			currentSite.value = response.data;
		} catch (err: any) {
			console.error('fetchSiteById: ошибка', err);
			error.value = err.response?.data?.error || 'Ошибка при получении объекта строительства';
		} finally {
			loading.value = false;
		}
	}

	// Создать новый объект строительства
	async function createSite(siteData: Partial<ConstructionSite>) {
		try {
			loading.value = true;
			console.log('createSite: отправка запроса на /api/sites', siteData);
			const response = await api.post('/api/sites', siteData);
			console.log('createSite: получен ответ', response.data);
			sites.value.push(response.data);
			return response.data;
		} catch (err: any) {
			console.error('createSite: ошибка', err);
			error.value = err.response?.data?.error || 'Ошибка при создании объекта строительства';
			throw error.value;
		} finally {
			loading.value = false;
		}
	}

	// Обновить объект строительства
	async function updateSite(id: number, siteData: Partial<ConstructionSite>) {
		try {
			loading.value = true;
			const response = await api.put(`/api/sites/${id}`, siteData);
			const index = sites.value.findIndex((site) => site.id === id);
			if (index !== -1) {
				sites.value[index] = response.data;
			}
			if (currentSite.value?.id === id) {
				currentSite.value = response.data;
			}
			return response.data;
		} catch (err: any) {
			error.value = err.response?.data?.error || 'Ошибка при обновлении объекта строительства';
			throw error.value;
		} finally {
			loading.value = false;
		}
	}

	// Удалить объект строительства
	async function deleteSite(id: number) {
		try {
			loading.value = true;
			await api.delete(`/api/sites/${id}`);
			sites.value = sites.value.filter((site) => site.id !== id);
			if (currentSite.value?.id === id) {
				currentSite.value = null;
			}
		} catch (err: any) {
			error.value = err.response?.data?.error || 'Ошибка при удалении объекта строительства';
			throw error.value;
		} finally {
			loading.value = false;
		}
	}

	// Сбросить ошибку
	function clearError() {
		error.value = null;
	}

	return {
		sites,
		currentSite,
		loading,
		error,
		fetchSites,
		fetchSiteById,
		createSite,
		updateSite,
		deleteSite,
		clearError,
	};
});
