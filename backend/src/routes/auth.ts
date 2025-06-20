import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// Register
router.post('/register', auth(['ADMIN']), async (req: Request, res: Response) => {
	try {
		const { email, password, name, role } = req.body;
		const { prisma } = req as AuthRequest;

		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			res.status(400).json({ message: 'User already exists' });
			return;
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user
		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name,
				role,
			},
		});

		res.status(201).json({
			message: 'User created successfully',
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		});
	} catch (error) {
		res.status(500).json({ message: 'Error creating user' });
	}
});

// Login
router.post('/login', async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		const { prisma } = req as AuthRequest;

		// Find user
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			res.status(401).json({ message: 'Invalid credentials' });
			return;
		}

		// Check password
		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			res.status(401).json({ message: 'Invalid credentials' });
			return;
		}

		// Generate token
		const token = jwt.sign(
			{
				userId: user.id,
				email: user.email,
				role: user.role,
			},
			process.env.JWT_SECRET!,
			{ expiresIn: '24h' }
		);

		res.json({
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
			token,
		});
	} catch (error) {
		res.status(500).json({ message: 'Error logging in' });
	}
});

// Get current user
router.get('/me', auth(), async (req: Request, res: Response) => {
	try {
		const { prisma, user } = req as AuthRequest;
		if (!user) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
		if (!dbUser) {
			res.status(404).json({ message: 'User not found' });
			return;
		}
		res.json({
			user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role },
		});
	} catch (error) {
		res.status(500).json({ message: 'Error getting user data' });
	}
});

export default router;
