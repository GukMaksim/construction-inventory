import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Получить все разделы для объекта строительства
router.get('/site/:siteId', auth(), async (req: Request, res: Response) => {
	try {
		const { siteId } = req.params;
		const sections = await prisma.section.findMany({
			where: { constructionSiteId: Number(siteId) },
			include: {
				stockMovements: { include: { product: true } },
			},
		});
		res.json(sections);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при получении разделов' });
	}
});

// Получить один раздел по ID
router.get('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const section = await prisma.section.findUnique({
			where: { id: Number(id) },
			include: {
				constructionSite: true,
				stockMovements: { include: { product: true } },
			},
		});
		if (!section) {
			res.status(404).json({ error: 'Раздел не найден' });
			return;
		}
		res.json(section);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при получении раздела' });
	}
});

// Создать новый раздел
router.post('/', auth(), async (req: Request, res: Response) => {
	try {
		const { name, constructionSiteId, type } = req.body;
		const section = await prisma.section.create({
			data: {
				name,
				constructionSiteId: Number(constructionSiteId),
				type, // обязательно!
			},
			include: { constructionSite: true },
		});
		res.status(201).json(section);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при создании раздела' });
	}
});

// Обновить раздел
router.put('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name } = req.body;
		const section = await prisma.section.update({
			where: { id: Number(id) },
			data: { name },
			include: { constructionSite: true },
		});
		res.json(section);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при обновлении раздела' });
	}
});

// Удалить раздел
router.delete('/:id', auth(), async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		await prisma.section.delete({ where: { id: Number(id) } });
		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при удалении раздела' });
	}
});

export default router;
