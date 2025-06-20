import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	// Создаем администратора
	const adminPassword = await bcrypt.hash('admin123', 10);
	const admin = await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: {
			email: 'admin@example.com',
			name: 'Admin',
			password: adminPassword,
			role: 'ADMIN',
		},
	});

	// Создаем тестового поставщика
	const supplier = await prisma.supplier.create({
		data: {
			name: 'ТОВ "Будматеріали"',
			contactPerson: 'Іван Петренко',
			phone: '+380501234567',
			email: 'sales@budmat.com',
		},
	});

	// Создаем несколько тестовых товаров
	const products = await Promise.all([
		prisma.product.create({
			data: {
				code: 'CAB-001',
				name: 'Кабель ВВГ 3х1.5',
				unit: 'м',
				price: 25.5,
				minQuantity: 100,
			},
		}),
		prisma.product.create({
			data: {
				code: 'PIPE-001',
				name: 'Труба PPR 20мм',
				unit: 'м',
				price: 15.75,
				minQuantity: 50,
			},
		}),
	]);

	// Создаем тестовый объект строительства
	const site = await prisma.constructionSite.create({
		data: {
			name: 'ЖК "Сонячний"',
			address: 'вул. Будівельників, 1',
			status: 'ACTIVE',
		},
	});

	// Создаем разделы для объекта
	const electricalSection = await prisma.section.create({
		data: {
			name: 'Електрика',
			type: 'ELECTRICAL',
			constructionSiteId: site.id,
		},
	});

	const plumbingSection = await prisma.section.create({
		data: {
			name: 'Сантехніка',
			type: 'PLUMBING',
			constructionSiteId: site.id,
		},
	});

	console.log('Seed data created successfully:', {
		admin,
		supplier,
		products,
		site,
		sections: {
			electrical: electricalSection,
			plumbing: plumbingSection,
		},
	});
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
