import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Получить все объекты строительства
router.get('/', auth(), async (req: Request, res: Response) => {
	try {
		console.log('Fetching all construction sites...');
		const sites = await prisma.constructionSite.findMany({
			include: {
				sections: true,
			},
		});
		console.log(`Found ${sites.length} sites`);
		res.json(sites);
	} catch (error) {
		console.error('Error fetching construction sites:', error);
		res.status(500).json({
			error: 'Ошибка при получении объектов строительства',
			details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
		});
	}
});

// Получить один объект строительства по ID
router.get('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const site = await prisma.constructionSite.findUnique({
			where: { id: Number(id) },
			include: {
				sections: true,
			},
		});
		if (!site) {
			res.status(404).json({ error: 'Объект строительства не найден' });
			return;
		}
		res.json(site);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при получении объекта строительства' });
	}
});

// Создать новый объект строительства
router.post('/', auth(), async (req: Request, res: Response) => {
	try {
		const { name, address } = req.body;
		const site = await prisma.constructionSite.create({
			data: {
				name,
				address,
			},
			include: {
				sections: true,
			},
		});
		res.status(201).json(site);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при создании объекта строительства' });
	}
});

// Обновить объект строительства
router.put('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name, address, status } = req.body;
		const site = await prisma.constructionSite.update({
			where: { id: Number(id) },
			data: {
				name,
				address,
				status,
			},
			include: {
				sections: true,
			},
		});
		res.json(site);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при обновлении объекта строительства' });
	}
});

// Удалить объект строительства
router.delete('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		await prisma.constructionSite.delete({
			where: { id: Number(id) },
		});
		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при удалении объекта строительства' });
	}
});

export default router;
