import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get all products
router.get('/', auth(), async (req: Request, res: Response) => {
	try {
		const products = await (req as any).prisma.product.findMany({
			orderBy: { code: 'asc' },
		});

		// Получаем движения по всем товарам
		const movements = await (req as any).prisma.stockMovement.findMany();

		const result = products.map((product: any) => {
			const productMovements = movements.filter((m: any) => m.productId === product.id);
			const totalIn = productMovements
				.filter((m: any) => m.type === 'IN')
				.reduce((sum: number, m: any) => sum + m.quantity, 0);
			const totalOut = productMovements
				.filter((m: any) => m.type === 'OUT')
				.reduce((sum: number, m: any) => sum + m.quantity, 0);
			const quantity = totalIn - totalOut;
			const inMovements = productMovements.filter((m: any) => m.type === 'IN');
			const avgPrice =
				inMovements.length > 0
					? inMovements.reduce((sum: number, m: any) => sum + m.price * m.quantity, 0) /
					  inMovements.reduce((sum: number, m: any) => sum + m.quantity, 0)
					: product.price;
			return {
				...product,
				quantity,
				avgPrice: Math.round(avgPrice * 100) / 100,
			};
		});

		res.json(result);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching products' });
	}
});

// Search products
router.get('/search', auth(), async (req: Request, res: Response) => {
	try {
		const { query } = req.query;
		const products = await (req as any).prisma.product.findMany({
			where: {
				OR: [
					{ code: { contains: query as string, mode: 'insensitive' } },
					{ name: { contains: query as string, mode: 'insensitive' } },
					{ barcode: { contains: query as string, mode: 'insensitive' } },
				],
			},
			orderBy: { code: 'asc' },
		});
		res.json(products);
	} catch (error) {
		res.status(500).json({ message: 'Error searching products' });
	}
});

// Get product by ID with stock info
router.get('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const productId = parseInt(req.params.id);
		const [product, movements] = await Promise.all([
			(req as any).prisma.product.findUnique({
				where: { id: productId },
			}),
			(req as any).prisma.stockMovement.findMany({
				where: { productId },
				include: {
					section: {
						include: {
							constructionSite: true,
						},
					},
				},
				orderBy: { date: 'desc' },
			}),
		]);

		if (!product) {
			res.status(404).json({ message: 'Product not found' });
			return;
		}

		// Calculate current stock
		const totalIn = movements.filter((m: any) => m.type === 'IN').reduce((sum: number, m: any) => sum + m.quantity, 0);
		const totalOut = movements
			.filter((m: any) => m.type === 'OUT')
			.reduce((sum: number, m: any) => sum + m.quantity, 0);
		const currentStock = totalIn - totalOut;

		// Calculate stock by location
		const stockByLocation = movements.reduce((acc: any, m: any) => {
			const locationId = m.sectionId || 'warehouse';
			const locationName = m.sectionId ? `${m.section.constructionSite.name} - ${m.section.name}` : 'Склад';
			if (!acc[locationId]) {
				acc[locationId] = {
					name: locationName,
					quantity: 0,
				};
			}
			acc[locationId].quantity += m.type === 'IN' ? m.quantity : -m.quantity;
			return acc;
		}, {});

		res.json({
			...product,
			currentStock,
			stockByLocation: Object.values(stockByLocation),
			recentMovements: movements.slice(0, 10),
		});
	} catch (error) {
		res.status(500).json({ message: 'Error fetching product' });
	}
});

// Create product
router.post('/', auth(['ADMIN']), async (req: Request, res: Response) => {
	try {
		const { code, name, barcode, unit, price, minQuantity } = req.body;
		const existingProduct = await (req as any).prisma.product.findUnique({ where: { code } });
		if (existingProduct) {
			res.status(400).json({ message: 'Product with this code already exists' });
			return;
		}
		const product = await (req as any).prisma.product.create({
			data: { code, name, barcode, unit, price, minQuantity: minQuantity || 0 },
		});
		res.status(201).json(product);
	} catch (error) {
		res.status(500).json({ message: 'Error creating product' });
	}
});

// Update product
router.put('/:id', auth(['ADMIN']), async (req: Request, res: Response) => {
	try {
		const { code, name, barcode, unit, price, minQuantity } = req.body;
		const productId = parseInt(req.params.id);
		const existingProduct = await (req as any).prisma.product.findFirst({
			where: {
				code,
				NOT: { id: productId },
			},
		});
		if (existingProduct) {
			res.status(400).json({ message: 'Another product with this code exists' });
			return;
		}
		const product = await (req as any).prisma.product.update({
			where: { id: productId },
			data: { code, name, barcode, unit, price, minQuantity },
		});
		res.json(product);
	} catch (error) {
		res.status(500).json({ message: 'Error updating product' });
	}
});

// Delete product
router.delete('/:id', auth(['ADMIN']), async (req: Request, res: Response) => {
	try {
		const productId = parseInt(req.params.id);
		const movementsCount = await (req as any).prisma.stockMovement.count({ where: { productId } });
		if (movementsCount > 0) {
			res.status(400).json({ message: 'Cannot delete product with existing movements' });
			return;
		}
		await (req as any).prisma.product.delete({ where: { id: productId } });
		res.json({ message: 'Product deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error deleting product' });
	}
});

export default router;
