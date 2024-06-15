import jwt from 'jsonwebtoken';
import { FullUserType } from '../types/types';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_AUTH_KEY = process.env.SECRET_AUTH_KEY as string;

export function generateToken(userInfo: FullUserType[]) {
    if (!userInfo[0]) {
        throw new Error('User not found');
    }
    const tokenInfo = {
        id: userInfo[0].id,
        email: userInfo[0].email,
        name: userInfo[0].name,
        phoneNumber: userInfo[0].phoneNumber,
        subscribed: userInfo[0].subscribed,
    };
    const token = jwt.sign(tokenInfo, SECRET_AUTH_KEY, { expiresIn: '1d' });
    return token;
}

export const verifyToken = (token: string): string | jwt.JwtPayload | undefined => {
    try {
        return jwt.verify(token, SECRET_AUTH_KEY);
    } catch (err) {
        return undefined;
    }
};