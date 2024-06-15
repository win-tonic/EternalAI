import { Request, Response } from 'express';
import { changeQuestionsAmount, getUsersQuestionsAmount } from '../db/dbInteractions/dbAccount';
import ChatgptChat from '../services/chatgptService';

const inactivityCheckerInterval = 60; // seconds

class ChatController {
    private chatsOnline: Record<number, { chat: ChatgptChat, questionLeft: number }>;

    constructor() {
        this.chatsOnline = {};
        this.createNewChat = this.createNewChat.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.getChatInfo = this.getChatInfo.bind(this);
        this.sleepChat = this.sleepChat.bind(this);
        this.exitHandler = this.exitHandler.bind(this);
        this.spendQuestion = this.spendQuestion.bind(this);
        this.tryToResumeChat = this.tryToResumeChat.bind(this);
        this.sleepAllChats = this.sleepAllChats.bind(this);
    
        this.startInactivityChecker();
        this.setupExitHandlers();
    }

    private async tryToResumeChat(chatId: number) {
        if (!this.chatsOnline[chatId]) {
            const resumedChat = new ChatgptChat(chatId);
            try {
                await resumedChat.setupChat(false)
                const questionsLeft = await this.calcQuestionsLeft(resumedChat.userId);
                this.chatsOnline[chatId] = { chat: resumedChat, questionLeft: questionsLeft };
            } catch (error: any) {
                if (error.message === 'Chat not found') {
                    return 0;
                } else {
                    throw error;
                }
            }
        }
        return 1;
    }

    public async createNewChat(req: Request, res: Response) {
        const tokenInfo = res.locals.tokenInfo;
        const userId = tokenInfo.id;
        const questionsLeft = await this.calcQuestionsLeft(userId);
        if (questionsLeft <= 0) {
            return res.status(403).json({ message: 'You have no questions left' });
        }
        const actLike = req.body.actLike;
        const chat = new ChatgptChat(0, userId, actLike);
        await chat.setupChat();
        this.chatsOnline[chat.chatId] = { chat, questionLeft: questionsLeft };
        const info = await chat.getChatInfo();
        console.log(this.chatsOnline)
        res.status(201).json(info);
    }

    private async calcQuestionsLeft(userId: number) {
        let usersOtherChats = Object.keys(this.chatsOnline).filter((chatId) => this.chatsOnline[Number(chatId)].chat.userId === userId);
        if (usersOtherChats.length === 0) {
            const questionsLeft = await getUsersQuestionsAmount(userId);
            return questionsLeft;
        } else {
            return this.chatsOnline[Number(usersOtherChats[0])].questionLeft;
        }
    }

    private spendQuestion(userId: number) {
        Object.keys(this.chatsOnline).forEach((chatId) => {
            if (this.chatsOnline[Number(chatId)].chat.userId === userId) {
                this.chatsOnline[Number(chatId)].questionLeft--;
            }
        });
    }

    public async sendMessage(req: Request, res: Response) {
        console.log(this.chatsOnline)
        const chatId = req.body.chatId;
        const message = req.body.message;
        const wokeUp = await this.tryToResumeChat(chatId);
        if (!wokeUp) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        const userId = res.locals.tokenInfo.id;
        const chatsUserId = this.chatsOnline[chatId]?.chat.userId;
        if (chatsUserId !== userId) {
            return res.status(403).json({ message: 'You are not allowed to send messages to this chat' });
        }
        const questionsLeft = this.chatsOnline[chatId].questionLeft;
        if (questionsLeft <= 0) {
            return res.status(403).json({ message: 'You have no questions left' });
        }
        const answer = await this.chatsOnline[chatId].chat.completeChat(message);
        res.status(200).json({ message: answer });
        this.spendQuestion(this.chatsOnline[chatId].chat.userId);
        console.log(this.chatsOnline)
    }

    public async getChatInfo(req: Request, res: Response) {
        console.log(this.chatsOnline)
        const chatId = parseInt(req.query.chatId as string, 10);
        const wokeUp = await this.tryToResumeChat(chatId);
        if (!wokeUp) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        const userId = res.locals.tokenInfo.id;
        const chatsUserId = this.chatsOnline[chatId]?.chat.userId;
        if (chatsUserId !== userId) {
            return res.status(403).json({ message: 'You are not allowed to see this chat' });
        }
        const info = await this.chatsOnline[chatId].chat.getChatInfo();
        res.status(200).json(info);
        console.log(this.chatsOnline)
    }

    private async sleepChat(chatId: number, force: boolean) {
        console.log('SLEEP CHAT')
        if (this.chatsOnline[chatId]) {
            console.log(`Chat ${chatId} is going to sleep, force: ${force}`)
            let sentToSleep = false;
            if (force) {
                sentToSleep = await this.chatsOnline[chatId].chat.forceToSleep()
            } else {
                sentToSleep = await this.chatsOnline[chatId].chat.tryToSleep()
            }
            if (sentToSleep) {
                await changeQuestionsAmount(this.chatsOnline[chatId].chat.userId, this.chatsOnline[chatId].questionLeft);
                delete this.chatsOnline[chatId];
            }
        }
    }

    public async sleepAllChats(force: boolean) {
        const promises = Object.keys(this.chatsOnline).map(async (chatId) => await this.sleepChat(Number(chatId), force));
        await Promise.all(promises);
    }


    private async startInactivityChecker() {
        const checkInactivity = async () => {
            this.sleepAllChats(false);
        }
        setInterval(checkInactivity, inactivityCheckerInterval * 1000);
    }


    private async exitHandler(evtOrExitCodeOrError: number | string | Error) {
        console.log('EXIT HANDLER STARTED')
        try {
            await this.sleepAllChats(true);
        } catch (e) {
            console.error('EXIT HANDLER ERROR', e);
        }
        process.exit(isNaN(+evtOrExitCodeOrError) ? 1 : +evtOrExitCodeOrError);
    }

    private setupExitHandlers() {
        [
            'exit', 'beforeExit', 'uncaughtException', 'unhandledRejection',
            'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP',
            'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV',
            'SIGUSR2', 'SIGTERM',
        ].forEach(evt => process.on(evt, this.exitHandler));
    }
}

const chatController = new ChatController();
export default chatController;