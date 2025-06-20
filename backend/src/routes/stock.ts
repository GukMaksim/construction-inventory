import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get stock status
router.get('/status', auth(), async (req: Request, res: Response) => {
	try {
		const movements = await (req as any).prisma.stockMovement.findMany({
			include: {
				product: true,
				section: { include: { constructionSite: true } },
			},
		});
		const stockByProduct = movements.reduce((acc: any, m: any) => {
			if (!acc[m.productId]) {
				acc[m.productId] = {
					product: m.product,
					total: 0,
					locations: {},
				};
			}
			const quantity = m.type === 'IN' ? m.quantity : -m.quantity;
			acc[m.productId].total += quantity;
			const locationKey = m.sectionId ? `section-${m.sectionId}` : 'warehouse';
			const locationName = m.sectionId ? `${m.section.constructionSite.name} - ${m.section.name}` : 'Склад';
			if (!acc[m.productId].locations[locationKey]) {
				acc[m.productId].locations[locationKey] = {
					name: locationName,
					quantity: 0,
				};
			}
			acc[m.productId].locations[locationKey].quantity += quantity;
			return acc;
		}, {});
		const result = Object.values(stockByProduct).map((item: any) => ({
			...item,
			locations: Object.values(item.locations),
		}));
		res.json(result);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching stock status' });
	}
});

// Transfer products between locations
router.post('/transfer', auth(), async (req: Request, res: Response) => {
	try {
		const { productId, sectionId, quantity, type, comment } = req.body;
		if (!productId || !sectionId || !quantity || !type) {
			res.status(400).json({ error: 'Не все обязательные поля заполнены' });
			return;
		}
		const product = await (req as any).prisma.product.findUnique({ where: { id: Number(productId) } });
		if (!product) {
			res.status(404).json({ error: 'Товар не найден' });
			return;
		}
		const section = await (req as any).prisma.section.findUnique({ where: { id: Number(sectionId) } });
		if (!section) {
			res.status(404).json({ error: 'Раздел не найден' });
			return;
		}
		if (type === 'OUT') {
			const sectionStock = await (req as any).prisma.stockMovement.aggregate({
				where: { sectionId: Number(sectionId), productId: Number(productId) },
				_sum: { quantity: true },
			});
			const availableQuantity = sectionStock._sum.quantity || 0;
			if (quantity > availableQuantity) {
				res.status(400).json({ error: 'Недостаточное количество товара в разделе' });
				return;
			}
		}
		const movement = await (req as any).prisma.stockMovement.create({
			data: {
				productId: Number(productId),
				sectionId: Number(sectionId),
				quantity: Number(quantity),
				type,
				comment,
				date: new Date(),
			},
			include: {
				product: true,
				section: { include: { constructionSite: true } },
			},
		});
		console.log(`Created stock movement: ${JSON.stringify(movement, null, 2)}`);
		res.json(movement);
	} catch (error) {
		console.error('Error creating stock movement:', error);
		res.status(500).json({
			error: 'Ошибка при перемещении товара',
			details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
		});
	}
});

// Get low stock products
router.get('/low-stock', auth(), async (req: Request, res: Response) => {
	try {
		const products = await (req as any).prisma.product.findMany();
		const movements = await (req as any).prisma.stockMovement.findMany();
		const stockStatus = movements.reduce((acc: any, m: any) => {
			if (!acc[m.productId]) {
				acc[m.productId] = 0;
			}
			acc[m.productId] += m.type === 'IN' ? m.quantity : -m.quantity;
			return acc;
		}, {});
		const lowStockProducts = products
			.filter((p: any) => (stockStatus[p.id] || 0) <= p.minQuantity)
			.map((p: any) => ({ ...p, currentStock: stockStatus[p.id] || 0 }));
		res.json(lowStockProducts);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching low stock products' });
	}
});

export default router;
