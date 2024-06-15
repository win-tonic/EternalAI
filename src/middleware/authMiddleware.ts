import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwtService';

const needsToken = (controller: (req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization;
        if (!token) {
            return res.status(401).json({ status: 401, message: 'No token provided' });
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ status: 401, message: 'Invalid token' });
        }
        res.locals = { ...res.locals, tokenInfo: decoded }
        controller(req, res, next);
    };
};


export { needsToken }