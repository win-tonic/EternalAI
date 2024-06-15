import { Request, Response, NextFunction, RequestHandler } from 'express';

const errorMiddleware = (controller: (req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            controller(req, res, next);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ status: 500, message: 'Internal Server Error' });
        }
    };
};

export { errorMiddleware };