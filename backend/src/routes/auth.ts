import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', auth(['ADMIN']), async (req: any, res) => {
	try {
		const { email, password, name, role } = req.body;

		// Check if user exists
		const existingUser = await req.prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return res.status(400).json({ message: 'User already exists' });
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user
		const user = await req.prisma.user.create({
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
router.post('/login', async (req: any, res) => {
	try {
		const { email, password } = req.body;

		// Find user
		const user = await req.prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		// Check password
		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			return res.status(401).json({ message: 'Invalid credentials' });
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
router.get('/me', auth(), async (req: any, res) => {
	try {
		const user = await req.prisma.user.findUnique({
			where: { id: req.user.userId },
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		res.json({
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		});
	} catch (error) {
		res.status(500).json({ message: 'Error getting user data' });
	}
});

export default router;
