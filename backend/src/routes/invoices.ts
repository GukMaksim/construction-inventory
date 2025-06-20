import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get all invoices
router.get('/', auth(), async (req: Request, res: Response) => {
	try {
		const invoices = await (req as any).prisma.invoice.findMany({
			include: { supplier: true },
			orderBy: { date: 'desc' },
		});
		res.json(invoices);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching invoices' });
	}
});

// Get invoice by ID
router.get('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const invoice = await (req as any).prisma.invoice.findUnique({
			where: { id: parseInt(req.params.id) },
			include: {
				supplier: true,
				items: { include: { product: true } },
			},
		});
		if (!invoice) {
			res.status(404).json({ message: 'Invoice not found' });
			return;
		}
		res.json(invoice);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching invoice' });
	}
});

// Create invoice
router.post('/', auth(['ADMIN', 'STOREKEEPER']), async (req: Request, res: Response) => {
	try {
		const { number, date, supplierId, items } = req.body;
		const existingInvoice = await (req as any).prisma.invoice.findUnique({ where: { number } });
		if (existingInvoice) {
			res.status(400).json({ message: 'Invoice with this number already exists' });
			return;
		}
		const total = items.reduce((sum: number, item: any) => sum + item.total, 0);
		const result = await (req as any).prisma.$transaction(async (prisma: any) => {
			const invoice = await prisma.invoice.create({
				data: {
					number,
					date: new Date(date),
					supplierId,
					total,
					items: {
						create: items.map((item: any) => ({
							productId: item.productId,
							quantity: item.quantity,
							price: item.price,
							total: item.total,
						})),
					},
				},
				include: { items: true },
			});
			await Promise.all(
				items.map((item: any) =>
					prisma.stockMovement.create({
						data: {
							date: new Date(date),
							type: 'IN',
							productId: item.productId,
							quantity: item.quantity,
							documentId: invoice.id,
							documentType: 'INVOICE',
						},
					})
				)
			);
			return invoice;
		});
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ message: 'Error creating invoice' });
	}
});

// Delete invoice
router.delete('/:id', auth(['ADMIN']), async (req: Request, res: Response) => {
	try {
		const invoiceId = parseInt(req.params.id);
		await (req as any).prisma.$transaction(async (prisma: any) => {
			await prisma.stockMovement.deleteMany({
				where: { documentId: invoiceId, documentType: 'INVOICE' },
			});
			await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
			await prisma.invoice.delete({ where: { id: invoiceId } });
		});
		res.json({ message: 'Invoice deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error deleting invoice' });
	}
});

export default router;
