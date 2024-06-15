import {Request, Response, NextFunction} from 'express';
import bodyParser from 'body-parser';

const jsonParser = bodyParser.json();
const rawParser = bodyParser.raw({ type: 'application/json' })

export function customBodyParser(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/stripe/webhook') {
        return rawParser(req, res, next);
    }
    return jsonParser(req, res, next);
}