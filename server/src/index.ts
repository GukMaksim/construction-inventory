import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

// Настройка CORS для разрешения запросов с фронтенда
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:5173',
		credentials: true,
	})
);
app.use(express.json());

// Маршруты для постачальників
app.get('/api/suppliers', async (req, res) => {
	try {
		const suppliers = await prisma.supplier.findMany();
		res.json(suppliers);
	} catch (error) {
		res.status(500).json({ error: 'Помилка при отриманні постачальників' });
	}
});

app.post('/api/suppliers', async (req, res) => {
	try {
		const supplier = await prisma.supplier.create({
			data: req.body,
		});
		res.json(supplier);
	} catch (error) {
		res.status(500).json({ error: 'Помилка при створенні постачальника' });
	}
});

// Маршруты для товарів
app.get('/api/products', async (req, res) => {
	try {
		const products = await prisma.product.findMany();
		res.json(products);
	} catch (error) {
		res.status(500).json({ error: 'Помилка при отриманні товарів' });
	}
});

app.post('/api/products', async (req, res) => {
	try {
		const product = await prisma.product.create({
			data: req.body,
		});
		res.json(product);
	} catch (error) {
		res.status(500).json({ error: 'Помилка при створенні товару' });
	}
});

// Маршруты для накладних
app.get('/api/invoices', async (req, res) => {
	try {
		const invoices = await prisma.invoice.findMany({
			include: {
				supplier: true,
				items: {
					include: {
						product: true,
					},
				},
			},
		});
		res.json(invoices);
	} catch (error) {
		res.status(500).json({ error: 'Помилка при отриманні накладних' });
	}
});

app.post('/api/invoices', async (req, res) => {
	const { items, ...invoiceData } = req.body;

	try {
		const invoice = await prisma.invoice.create({
			data: {
				...invoiceData,
				items: {
					create: items,
				},
			},
			include: {
				items: true,
			},
		});

		// Створюємо рух товарів для кожної позиції
		await Promise.all(
			items.map((item) =>
				prisma.movement.create({
					data: {
						date: invoiceData.date,
						type: 'IN',
						quantity: item.quantity,
						productId: item.productId,
						invoiceId: invoice.id,
					},
				})
			)
		);

		res.json(invoice);
	} catch (error) {
		res.status(500).json({ error: 'Помилка при створенні накладної' });
	}
});

// Маршруты для об'єктів
app.get('/api/construction-sites', async (req, res) => {
	try {
		const sites = await prisma.constructionSite.findMany({
			include: {
				sections: true,
			},
		});
		res.json(sites);
	} catch (error) {
		res.status(500).json({ error: "Помилка при отриманні об'єктів" });
	}
});

app.post('/api/construction-sites', async (req, res) => {
	try {
		const site = await prisma.constructionSite.create({
			data: req.body,
			include: {
				sections: true,
			},
		});
		res.json(site);
	} catch (error) {
		res.status(500).json({ error: "Помилка при створенні об'єкту" });
	}
});

// Маршрути для переміщення товарів
app.post('/api/movements', async (req, res) => {
	const { items, sectionId, date } = req.body;

	try {
		const movements = await Promise.all(
			items.map((item) =>
				prisma.movement.create({
					data: {
						date,
						type: 'TRANSFER',
						quantity: item.quantity,
						productId: item.productId,
						sectionId,
					},
				})
			)
		);

		res.json(movements);
	} catch (error) {
		res.status(500).json({ error: 'Помилка при переміщенні товарів' });
	}
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
