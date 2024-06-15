import OpenAI from "openai";
import { ChatgptMessage } from "../types/types";
import { createChat, getFullChat, saveMessages } from "../db/dbInteractions/dbChatgpt";
import dotenv from 'dotenv';
dotenv.config();

const CHAT_GPT_API_KEY = process.env.CHAT_GPT_API_KEY as string;

const openai = new OpenAI({ apiKey: CHAT_GPT_API_KEY });

const maxInactiveTime = 5 * 60; // 5 minutes

class ChatgptChat {
    public messageHistory: ChatgptMessage[];
    public oldMessagesAmount: number;
    public chatId: number;
    public userId: number;
    public actLike: string;
    public lastMessageTime: Date;

    constructor(chatId: number, userId?: number, actLike?: string) {
        this.messageHistory = []
        this.oldMessagesAmount = 1;
        this.chatId = chatId
        this.userId = userId || 0
        this.actLike = actLike || ''
        this.lastMessageTime = new Date();
        this.responseFromChatgpt = this.responseFromChatgpt.bind(this);
        this.completeChat = this.completeChat.bind(this);
        this.setupChat = this.setupChat.bind(this);
        this.getChatInfo = this.getChatInfo.bind(this);
        this.tryToSleep = this.tryToSleep.bind(this);
        this.timeToSleep = this.timeToSleep.bind(this);
        this.forceToSleep = this.forceToSleep.bind(this);
    }

    public async setupChat(createNew: boolean = true) {
        const chatInfo = await getFullChat(this.chatId);
        if (!chatInfo) {
            if (!createNew) {
                throw new Error('Chat not found');
            }
            let newInfo = await createChat(this.userId, this.actLike);
            this.chatId = newInfo.chatId;
            this.messageHistory = newInfo.chatHistory;
        } else {
            this.userId = chatInfo.userId;
            this.actLike = chatInfo.actLike;
            this.messageHistory = chatInfo.chatHistory;
            this.oldMessagesAmount = this.messageHistory.length;
        }
    }

    public async responseFromChatgpt() {
        const params: OpenAI.Chat.ChatCompletionCreateParams = {
            messages: this.messageHistory,
            model: 'gpt-3.5-turbo',
        };
        const completion = await openai.chat.completions.create(params);
        const answer = completion.choices[0].message;
        return answer as ChatgptMessage;
    }

    public async completeChat(newMessage: string): Promise<string | null> {
        const message: ChatgptMessage = {
            role: 'user',
            content: newMessage,
        }
        this.messageHistory.push(message);
        const answer = await this.responseFromChatgpt();
        this.messageHistory.push(answer);
        return answer.content;
    }

    // public async completeChat(newMessage: string): Promise<string | null> {
    //     const message: ChatgptMessage = {
    //         role: 'user',
    //         content: newMessage,
    //     }
    //     this.messageHistory.push(message);
    //     await new Promise(resolve => setTimeout(resolve, 1000));
    //     const answer = `Answer to ${newMessage}, number ${this.messageHistory.length}`
    //     this.messageHistory.push({ role: 'assistant', content: answer });
    //     this.lastMessageTime = new Date();
    //     return answer;
    // }

    public async getChatInfo() {
        return {
            chatId: this.chatId,
            userId: this.userId,
            actLike: this.actLike,
            messageHistory: this.messageHistory.slice(1)
        }
    }

    public timeToSleep() {
        const now = new Date();
        const pingedTimeAgo = now.getTime() - this.lastMessageTime.getTime();
        if (pingedTimeAgo > maxInactiveTime * 1000) {
            return true;
        }
        return false;
    }

    public async forceToSleep() {
        const newMessages = this.messageHistory.slice(this.oldMessagesAmount);
        console.log(`Saving messages for chat ${this.chatId}: ${newMessages}`)
        await saveMessages(this.chatId, newMessages);
        return true;
    }

    public async tryToSleep() {
        if (this.timeToSleep()) {
            console.log(`Chat ${this.chatId} is sleepy`)
            await this.forceToSleep();
            return true;
        } else{
            console.log(`Chat ${this.chatId} is not sleepy`)
            return false;
        }
    }
}

export default ChatgptChat;

// async function test(){
//     const chat = new ChatgptChat(0, 0, 'test');
//     await chat.setupChat();
    
// }