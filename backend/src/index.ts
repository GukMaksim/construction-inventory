import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import supplierRoutes from './routes/suppliers';
import productRoutes from './routes/products';
import invoiceRoutes from './routes/invoices';
import siteRoutes from './routes/sites';
import stockRoutes from './routes/stock';
import reportRoutes from './routes/reports';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware для добавления prisma в req
app.use((req: any, res, next) => {
	req.prisma = prisma;
	next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error(err.stack);
	res.status(500).json({
		message: 'Something broke!',
		error: process.env.NODE_ENV === 'development' ? err.message : undefined,
	});
});

const server = app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
