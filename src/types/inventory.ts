export interface Product {
	id?: number;
	code: string;
	barcode?: string;
	name: string;
	unit: string;
	quantity: number;
	price: number;
}

export interface Invoice {
	id?: number;
	number: string;
	date: string;
	supplierId: number;
	supplierName?: string;
	total: number;
	items: InvoiceItem[];
}

export interface InvoiceItem {
	id?: number;
	invoiceId?: number;
	productId?: number;
	code: string;
	name: string;
	quantity: number;
	price: number;
	total: number;
}

export type Unit = 'шт' | 'м' | 'кг' | 'л' | 'уп' | 'м2' | 'м3';

export interface InventoryMovement {
	id?: number;
	date: string;
	type: 'IN' | 'OUT';
	sourceId?: number;
	sourceName?: string;
	destinationId?: number;
	destinationName?: string;
	productId: number;
	quantity: number;
	documentId?: number;
	documentType?: 'INVOICE' | 'TRANSFER';
}
