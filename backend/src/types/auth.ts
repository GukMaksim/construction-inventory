import { Request } from 'express';
import { PrismaClient, User } from '@prisma/client';

export interface AuthRequest extends Request {
	user?: User;
	prisma: PrismaClient;
}
