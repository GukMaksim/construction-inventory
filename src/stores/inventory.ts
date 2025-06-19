import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product, Invoice, InventoryMovement } from '@/types/inventory';

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
			// TODO: Implement API call
			products.value = [];
		} catch (error) {
			console.error('Failed to load products:', error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	async function saveProduct(product: Product) {
		try {
			// TODO: Implement API call
			await loadProducts();
		} catch (error) {
			console.error('Failed to save product:', error);
			throw error;
		}
	}

	// Invoices
	async function loadInvoices() {
		loading.value = true;
		try {
			// TODO: Implement API call
			invoices.value = [];
		} catch (error) {
			console.error('Failed to load invoices:', error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	async function saveInvoice(invoice: Invoice) {
		try {
			// TODO: Implement API call
			await loadInvoices();
			// After successful save, create inventory movements
			await createInventoryMovementsFromInvoice(invoice);
		} catch (error) {
			console.error('Failed to save invoice:', error);
			throw error;
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
		loadInvoices,
		saveInvoice,
		transferProducts,
		searchProducts,
	};
});
