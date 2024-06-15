import { Request, Response } from 'express';
import { createUser, userExists, getFullUser} from '../db/dbInteractions/dbAuth';
import { hashPassword, verifyPassword } from '../services/hashService';
import { verifyGoogleToken } from '../services/googleService';
import { generateToken } from '../services/jwtService';

class AuthController {

    constructor() {
        this.signUp = this.signUp.bind(this);
        this.signIn = this.signIn.bind(this);
        this.googleAuth = this.googleAuth.bind(this);
    }

    public async signUp(req: Request, res: Response) {
        const email = req.body.email, password = req.body.password;
        const exists = await userExists(req.body.email);
        if (exists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        } else if (password.length < 8) {
            res.status(400).json({ message: 'Password must be at least 8 characters long' });
            return;
        } else if (!email.includes('@')) {
            res.status(400).json({ message: 'Invalid email' });
            return;
        }
        const passwordHash = await hashPassword(password);
        await createUser(email, passwordHash);
        res.status(201).json({ message: 'User created' });
    }

    public async signIn(req: Request, res: Response) {
        const email = req.body.email, password = req.body.password;
        const user = await getFullUser(email);
        const match = user ? await verifyPassword(password, user[0].passwordHash) : false
        if (!match) {
            res.status(400).json({ message: 'Login or password are incorrect' });
            return;
        }
        const loginToken = generateToken(user);
        res.status(200).json({token: loginToken});
    }

    public async googleAuth(req: Request, res: Response) {
        const googleToken = req.body.token;
        const payload = await verifyGoogleToken(googleToken);
        if (!payload || !payload.email) {
            res.status(400).json({ message: 'Google token is invalid' });
            return;
        }
        const email = payload.email, name = payload.name;
        let userInfo = await getFullUser(email)
        userInfo = userInfo.length === 0 ? await createUser(email, '', name) : userInfo;
        console.log(userInfo)
        const loginToken = generateToken(userInfo);
        res.status(200).json({token: loginToken});
    }
}

const authController = new AuthController();
export default authController;