import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Получить сводный отчет по объекту строительства
router.get('/site/:siteId', auth(), async (req: Request, res: Response) => {
	try {
		const { siteId } = req.params;
		const site = await prisma.constructionSite.findUnique({
			where: { id: Number(siteId) },
			include: {
				sections: {
					include: {
						stockMovements: { include: { product: true } },
					},
				},
			},
		});
		if (!site) {
			res.status(404).json({ error: 'Объект строительства не найден' });
			return;
		}
		const report = {
			siteName: site.name,
			siteAddress: site.address,
			totalValue: 0,
			sections: site.sections.map((section: any) => {
				const sectionTotal = section.stockMovements.reduce((total: number, movement: any) => {
					const amount = movement.quantity * movement.product.price;
					return total + (movement.type === 'IN' ? amount : -amount);
				}, 0);
				const products = section.stockMovements.reduce((acc: any, movement: any) => {
					const productId = movement.product.id;
					if (!acc[productId]) {
						acc[productId] = {
							product: movement.product,
							quantity: 0,
							totalValue: 0,
						};
					}
					const quantity = movement.type === 'IN' ? movement.quantity : -movement.quantity;
					acc[productId].quantity += quantity;
					acc[productId].totalValue += quantity * movement.product.price;
					return acc;
				}, {});
				return {
					id: section.id,
					name: section.name,
					type: section.type,
					totalValue: sectionTotal,
					products: Object.values(products).filter((p: any) => p.quantity > 0),
				};
			}),
		};
		report.totalValue = report.sections.reduce((total: number, section: any) => total + section.totalValue, 0);
		res.json(report);
	} catch (error) {
		console.error('Error generating site report:', error);
		res.status(500).json({
			error: 'Ошибка при формировании отчета',
			details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
		});
	}
});

// Получить отчет по движению товаров за период
router.get('/stock-movements', auth(), async (req: Request, res: Response) => {
	try {
		const { startDate, endDate } = req.query;
		const movements = await prisma.stockMovement.findMany({
			where: {
				date: {
					gte: startDate ? new Date(String(startDate)) : undefined,
					lte: endDate ? new Date(String(endDate)) : undefined,
				},
			},
			include: {
				product: true,
				section: { include: { constructionSite: true } },
			},
		});
		const report = movements.reduce((acc: any, movement: any) => {
			const productId = movement.product.id;
			if (!acc[productId]) {
				acc[productId] = {
					product: movement.product,
					totalIn: 0,
					totalOut: 0,
					movements: [],
				};
			}
			acc[productId].movements.push({
				date: movement.date,
				type: movement.type,
				quantity: movement.quantity,
				section: movement.section,
			});
			if (movement.type === 'IN') {
				acc[productId].totalIn += movement.quantity;
			} else {
				acc[productId].totalOut += movement.quantity;
			}
			return acc;
		}, {});
		res.json(Object.values(report));
	} catch (error) {
		console.error('Error generating stock movements report:', error);
		res.status(500).json({
			error: 'Ошибка при формировании отчета о движении товаров',
			details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
		});
	}
});

// Получить отчет по низким остаткам
router.get('/low-stock', auth(), async (req: Request, res: Response) => {
	try {
		const products = await prisma.product.findMany({ include: { stockMovements: true } });
		const lowStockProducts = products
			.map((product: any) => {
				const stock = product.stockMovements.reduce((total: number, movement: any) => {
					return total + (movement.type === 'IN' ? movement.quantity : -movement.quantity);
				}, 0);
				return {
					id: product.id,
					code: product.code,
					name: product.name,
					unit: product.unit,
					price: product.price,
					currentStock: stock,
					minQuantity: product.minQuantity,
					value: stock * product.price,
				};
			})
			.filter((product: any) => product.currentStock <= product.minQuantity);
		res.json(lowStockProducts);
	} catch (error) {
		console.error('Error generating low stock report:', error);
		res.status(500).json({
			error: 'Ошибка при формировании отчета по низким остаткам',
			details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
		});
	}
});

// Получить общий итоговый отчет
router.get('/summary', auth(), async (req: Request, res: Response) => {
	try {
		const sites = await prisma.constructionSite.findMany({
			where: { status: 'ACTIVE' },
			include: {
				sections: {
					include: {
						stockMovements: { include: { product: true } },
					},
				},
			},
		});
		const summary = {
			totalSites: sites.length,
			activeSections: 0,
			totalStockValue: 0,
			sitesValue: 0,
		};
		sites.forEach((site: any) => {
			site.sections.forEach((section: any) => {
				// Если нужен подсчет только по активным разделам, раскомментируйте:
				// if (section.status === 'ACTIVE') summary.activeSections++;
				section.stockMovements.forEach((movement: any) => {
					const amount = movement.quantity * movement.product.price;
					if (movement.type === 'IN') {
						summary.sitesValue += amount;
					} else {
						summary.sitesValue -= amount;
					}
				});
			});
		});
		res.json(summary);
	} catch (error) {
		console.error('Error generating summary report:', error);
		res.status(500).json({
			error: 'Ошибка при формировании итогового отчета',
			details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
		});
	}
});

export default router;
