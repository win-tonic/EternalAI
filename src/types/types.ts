import { users, questions, chats, chatHistory, paymentIntents } from "../db/schema";
import { type InferSelectModel } from 'drizzle-orm';


export type FullUserType = InferSelectModel<typeof users>;
export type FullQuestionType = InferSelectModel<typeof questions>;
export type ChatHistoryRecordFull = InferSelectModel<typeof chatHistory>;
export type ChatType = InferSelectModel<typeof chats>;
export type PaymentIntentType = InferSelectModel<typeof paymentIntents>;

export interface UserType {
    id: number;
    email: string;
    phoneNumber: string;
    name: string;
    subscribed: boolean;
}

export interface ChangebleUserFields {
    name: string,
    email: string,
    phoneNumber: string
}

export interface ChatgptMessage {
    role: 'system' | 'user' | 'assistant',
    content: string
}

export interface ChatHistoryRecord {
    chatId: number,
    message: string,
    role: 'system' | 'user' | 'assistant'
}



