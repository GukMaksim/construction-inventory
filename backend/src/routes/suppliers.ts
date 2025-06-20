import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get all suppliers
router.get('/', auth(), async (req: Request, res: Response) => {
	try {
		const suppliers = await (req as any).prisma.supplier.findMany({
			orderBy: { name: 'asc' },
		});
		res.json(suppliers);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching suppliers' });
	}
});

// Get supplier by ID
router.get('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const supplier = await (req as any).prisma.supplier.findUnique({
			where: { id: parseInt(req.params.id) },
			include: {
				invoices: {
					orderBy: { date: 'desc' },
					take: 10,
				},
			},
		});

		if (!supplier) {
			res.status(404).json({ message: 'Supplier not found' });
			return;
		}

		res.json(supplier);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching supplier' });
	}
});

// Create supplier
router.post('/', auth(['ADMIN']), async (req: Request, res: Response) => {
	try {
		const { name, contactPerson, phone, email } = req.body;

		const supplier = await (req as any).prisma.supplier.create({
			data: {
				name,
				contactPerson,
				phone,
				email,
			},
		});

		res.status(201).json(supplier);
	} catch (error) {
		res.status(500).json({ message: 'Error creating supplier' });
	}
});

// Update supplier
router.put('/:id', auth(['ADMIN']), async (req: Request, res: Response) => {
	try {
		const { name, contactPerson, phone, email } = req.body;

		const supplier = await (req as any).prisma.supplier.update({
			where: { id: parseInt(req.params.id) },
			data: {
				name,
				contactPerson,
				phone,
				email,
			},
		});

		res.json(supplier);
	} catch (error) {
		res.status(500).json({ message: 'Error updating supplier' });
	}
});

// Delete supplier
router.delete('/:id', auth(['ADMIN']), async (req: Request, res: Response) => {
	try {
		const supplierId = parseInt(req.params.id);

		// Check if supplier has any invoices
		const invoicesCount = await (req as any).prisma.invoice.count({
			where: { supplierId },
		});

		if (invoicesCount > 0) {
			res.status(400).json({
				message: 'Cannot delete supplier with existing invoices',
			});
			return;
		}

		await (req as any).prisma.supplier.delete({
			where: { id: supplierId },
		});

		res.json({ message: 'Supplier deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error deleting supplier' });
	}
});

export default router;
