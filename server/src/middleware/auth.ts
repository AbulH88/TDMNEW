import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const USERS_FILE = path.join(__dirname, '../../data/users.json');

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        role: string;
        permissions: string[];
    };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Re-verify user exists in our "database"
        if (!fs.existsSync(USERS_FILE)) {
            return res.status(500).json({ error: 'User database not found' });
        }
        
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const user = users.find((u: any) => u.id === decoded.id);

        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' });
        }

        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role === 'admin' || req.user.permissions.includes(permission)) {
            return next();
        }

        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    };
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};
