import { defineStore } from 'pinia';
import axios from 'axios';
import { ref, computed } from 'vue';
import type { Section, StockMovement, Product } from '@prisma/client';

interface SectionWithDetails extends Section {
	stockMovements: (StockMovement & {
		product: Product;
	})[];
}

export const useSectionsStore = defineStore('sections', () => {
	const sections = ref<SectionWithDetails[]>([]);
	const currentSection = ref<SectionWithDetails | null>(null);
	const loading = ref(false);
	const error = ref<string | null>(null);

	// Получить все разделы для объекта строительства
	async function fetchSectionsBySite(siteId: number) {
		try {
			loading.value = true;
			const response = await axios.get(`/api/sections/site/${siteId}`);
			sections.value = response.data;
		} catch (err: any) {
			error.value = err.response?.data?.error || 'Ошибка при получении разделов';
		} finally {
			loading.value = false;
		}
	}

	// Получить раздел по ID
	async function fetchSectionById(id: number) {
		try {
			loading.value = true;
			const response = await axios.get(`/api/sections/${id}`);
			currentSection.value = response.data;
		} catch (err: any) {
			error.value = err.response?.data?.error || 'Ошибка при получении раздела';
		} finally {
			loading.value = false;
		}
	}

	// Создать новый раздел
	async function createSection(sectionData: Partial<Section>) {
		try {
			loading.value = true;
			const response = await axios.post('/api/sections', sectionData);
			sections.value.push(response.data);
			return response.data;
		} catch (err: any) {
			error.value = err.response?.data?.error || 'Ошибка при создании раздела';
			throw error.value;
		} finally {
			loading.value = false;
		}
	}

	// Обновить раздел
	async function updateSection(id: number, sectionData: Partial<Section>) {
		try {
			loading.value = true;
			const response = await axios.put(`/api/sections/${id}`, sectionData);
			const index = sections.value.findIndex((section) => section.id === id);
			if (index !== -1) {
				sections.value[index] = response.data;
			}
			if (currentSection.value?.id === id) {
				currentSection.value = response.data;
			}
			return response.data;
		} catch (err: any) {
			error.value = err.response?.data?.error || 'Ошибка при обновлении раздела';
			throw error.value;
		} finally {
			loading.value = false;
		}
	}

	// Удалить раздел
	async function deleteSection(id: number) {
		try {
			loading.value = true;
			await axios.delete(`/api/sections/${id}`);
			sections.value = sections.value.filter((section) => section.id !== id);
			if (currentSection.value?.id === id) {
				currentSection.value = null;
			}
		} catch (err: any) {
			error.value = err.response?.data?.error || 'Ошибка при удалении раздела';
			throw error.value;
		} finally {
			loading.value = false;
		}
	}

	// Получить количество товара в разделе
	function getSectionProductQuantity(sectionId: number, productId: number) {
		const section = sections.value.find((s) => s.id === sectionId);
		if (!section) return 0;

		return section.stockMovements
			.filter((m) => m.productId === productId)
			.reduce((acc, movement) => {
				return acc + (movement.type === 'IN' ? movement.quantity : -movement.quantity);
			}, 0);
	}

	// Получить общую стоимость товаров в разделе
	const getSectionTotal = computed(() => {
		return (sectionId: number) => {
			const section = sections.value.find((s) => s.id === sectionId);
			if (!section) return 0;

			return section.stockMovements.reduce((total, movement) => {
				const amount = movement.quantity * movement.product.price;
				return total + (movement.type === 'IN' ? amount : -amount);
			}, 0);
		};
	});

	// Сбросить ошибку
	function clearError() {
		error.value = null;
	}

	return {
		sections,
		currentSection,
		loading,
		error,
		fetchSectionsBySite,
		fetchSectionById,
		createSection,
		updateSection,
		deleteSection,
		getSectionProductQuantity,
		getSectionTotal,
		clearError,
	};
});
