import { Request, Response } from 'express';
import { changeAccountInfo, changePassword, getAccountInfo, addQuestionsForUser } from '../db/dbInteractions/dbAccount';
import { hashPassword } from '../services/hashService';
import { ChangebleUserFields } from "../types/types";

class AccountController {

    constructor() {
        this.changeInfo = this.changeInfo.bind(this);
        this.changePassword = this.changePassword.bind(this);
    }

    public async getAccountInfo(req: Request, res: Response) {
        const userId = res.locals.tokenInfo.id;
        const userInfo = await getAccountInfo(userId);
        res.status(200).json(userInfo);
    }

    public async changeInfo(req: Request, res: Response) {
        const userId = res.locals.tokenInfo.id;
        const params: Partial<ChangebleUserFields> = {};
        if (req.body.email) params.email = req.body.email;
        if (req.body.name) params.name = req.body.name;
        if (req.body.phoneNumber) params.phoneNumber = req.body.phoneNumber;
        await changeAccountInfo(userId, params);
        res.status(200).json({ message: 'Account info changed' });
    }

    public async changePassword(req: Request, res: Response) {
        const userId = res.locals.tokenInfo.id;
        const password = req.body.password;
        const passwordHash = await hashPassword(password);
        await changePassword(userId, passwordHash);
        res.status(200).json({ message: 'Password changed' });
    }

    public async giveThreeQuestions(req: Request, res: Response) {
        const userId = res.locals.tokenInfo.id;
        await addQuestionsForUser(userId, 3);
    }
}

const accountController = new AccountController();
export default accountController;