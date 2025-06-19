import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
	user?: any;
}

export const auth = (roles: string[] = []) => {
	return async (req: AuthRequest, res: Response, next: NextFunction) => {
		try {
			const token = req.header('Authorization')?.replace('Bearer ', '');

			if (!token) {
				throw new Error();
			}

			const decoded = jwt.verify(token, process.env.JWT_SECRET!);
			req.user = decoded;

			if (roles.length && !roles.includes(req.user.role)) {
				return res.status(403).json({ message: 'Insufficient permissions' });
			}

			next();
		} catch (error) {
			res.status(401).json({ message: 'Please authenticate' });
		}
	};
};
