import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a-very-secret-key-32-chars-long!!'; // Must be 32 chars
const IV_LENGTH = 16;

function encrypt(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export interface AuthenticatedRequest extends Request {
    user?: {
        username: string;
        dbUser: string;
        dbPass: string;
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

        req.user = {
            username: decoded.username,
            dbUser: decoded.dbUser,
            dbPass: decrypt(decoded.dbPassEnc),
            role: 'admin', // Everyone logged in via SQL gets admin access for this TDM tool
            permissions: ['read_only', 'create', 'delete']
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // Since we refactored to give everyone all permissions upon successful SQL login:
        next();
    };
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Everyone is admin in this new simplified model
    next();
};

export { encrypt, decrypt };
