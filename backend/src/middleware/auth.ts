import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function auth(roles: string[] = []) {
	return function (req: Request, res: Response, next: NextFunction): void {
		try {
			const token = req.header('Authorization')?.replace('Bearer ', '');
			if (!token) {
				throw new Error();
			}
			const decoded = jwt.verify(token, process.env.JWT_SECRET!);
			(req as any).user = decoded;
			if (roles.length && !roles.includes((decoded as any).role)) {
				res.status(403).json({ message: 'Insufficient permissions' });
				return;
			}
			next();
		} catch (error) {
			res.status(401).json({ message: 'Please authenticate' });
		}
	};
}
