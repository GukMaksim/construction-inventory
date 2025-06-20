import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product, Invoice, InventoryMovement } from '@/types/inventory';
import api from '@/api';

export const useInventoryStore = defineStore('inventory', () => {
	const products = ref<Product[]>([]);
	const invoices = ref<Invoice[]>([]);
	const movements = ref<InventoryMovement[]>([]);
	const loading = ref(false);

	// Products
	const productsByCode = computed(() => {
		return products.value.reduce((acc, product) => {
			acc[product.code] = product;
			return acc;
		}, {} as Record<string, Product>);
	});

	async function loadProducts() {
		loading.value = true;
		try {
			const response = await api.get('/api/products');
			products.value = response.data;
		} catch (error) {
			console.error('Failed to load products:', error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	async function saveProduct(product: Product) {
		loading.value = true;
		try {
			let response;
			if (product.id) {
				response = await api.put(`/api/products/${product.id}`, product);
				const idx = products.value.findIndex((p) => p.id === product.id);
				if (idx !== -1) products.value[idx] = response.data;
			} else {
				response = await api.post('/api/products', product);
				products.value.push(response.data);
			}
			await loadProducts();
		} catch (error) {
			console.error('Failed to save product:', error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	async function deleteProduct(productId: number) {
		loading.value = true;
		try {
			await api.delete(`/api/products/${productId}`);
			products.value = products.value.filter((p) => p.id !== productId);
			await loadProducts();
		} catch (error) {
			console.error('Failed to delete product:', error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	// Invoices
	async function loadInvoices() {
		loading.value = true;
		try {
			const response = await api.get('/api/invoices');
			invoices.value = response.data;
		} catch (error) {
			console.error('Failed to load invoices:', error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	async function saveInvoice(invoice: Invoice) {
		loading.value = true;
		try {
			let response;
			if (invoice.id) {
				response = await api.put(`/api/invoices/${invoice.id}`, invoice);
				const idx = invoices.value.findIndex((i) => i.id === invoice.id);
				if (idx !== -1) invoices.value[idx] = response.data;
			} else {
				response = await api.post('/api/invoices', invoice);
				invoices.value.push(response.data);
			}
			await loadInvoices();
			await createInventoryMovementsFromInvoice(response.data);
		} catch (error) {
			console.error('Failed to save invoice:', error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	async function deleteInvoice(invoiceId: number) {
		loading.value = true;
		try {
			await api.delete(`/api/invoices/${invoiceId}`);
			invoices.value = invoices.value.filter((i) => i.id !== invoiceId);
			await loadInvoices();
		} catch (error) {
			console.error('Failed to delete invoice:', error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	// Inventory Movements
	async function createInventoryMovementsFromInvoice(invoice: Invoice) {
		const movements: InventoryMovement[] = invoice.items.map((item) => ({
			date: invoice.date,
			type: 'IN',
			sourceId: invoice.supplierId,
			sourceName: invoice.supplierName,
			productId: item.productId!,
			quantity: item.quantity,
			documentId: invoice.id,
			documentType: 'INVOICE',
		}));

		try {
			// TODO: Implement API call to save movements
			await loadProducts(); // Refresh product quantities
		} catch (error) {
			console.error('Failed to create inventory movements:', error);
			throw error;
		}
	}

	async function transferProducts(transfer: {
		date: string;
		sourceId: number;
		destinationId: number;
		items: { productId: number; quantity: number }[];
	}) {
		try {
			// TODO: Implement API call
			await loadProducts(); // Refresh product quantities
		} catch (error) {
			console.error('Failed to transfer products:', error);
			throw error;
		}
	}

	// Search
	function searchProducts(query: string) {
		return products.value.filter(
			(product) =>
				product.code.toLowerCase().includes(query.toLowerCase()) ||
				product.name.toLowerCase().includes(query.toLowerCase()) ||
				product.barcode?.toLowerCase().includes(query.toLowerCase())
		);
	}

	return {
		products,
		invoices,
		movements,
		loading,
		productsByCode,
		loadProducts,
		saveProduct,
		deleteProduct,
		loadInvoices,
		saveInvoice,
		deleteInvoice,
		transferProducts,
		searchProducts,
	};
});
