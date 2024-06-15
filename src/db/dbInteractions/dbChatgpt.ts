import { db } from "../db";
import { eq } from 'drizzle-orm';
import { ChatHistoryRecord, ChatType, ChatgptMessage } from "../../types/types";

const promt = "Imagine that you are [famous person]. Respond to questions and engage in conversation as if you were speaking as [famous person] directly. Capture the personality, mannerisms, and speech patterns of [famous person] in your responses. Feel free to discuss a wide range of topics, from your experiences and accomplishments to your thoughts and opinions. Remember to maintain the persona of [famous person] throughout the conversation.";

export async function getHistory(chatId: number): Promise<ChatgptMessage[]> {
    const chatHistory = await db.db.select({
        message: db.chatHistory.message,
        role: db.chatHistory.role
    }).from(db.chatHistory).where(eq(db.chatHistory.chatId, chatId)).orderBy(db.chatHistory.id);

    return chatHistory.map(record => ({ content: record.message, role: record.role }));
}

export async function getChat(chatId: number): Promise<ChatType[]> {
    const chat = await db.db.select({
        chatId: db.chats.chatId,
        userId: db.chats.userId,
        actLike: db.chats.actLike
    }).from(db.chats).where(eq(db.chats.chatId, chatId));

    return chat;
}

export async function getFullChat(chatId: number): Promise<ChatType & { chatHistory: ChatgptMessage[] } | null> {
    const chat = await getChat(chatId);
    if (chat.length === 0) {
        return null;
    }
    const chatHistory = await getHistory(chatId);
    return {
        ...chat[0],
        chatHistory
    };
}

export async function createChat(userId: number, actLike: string): Promise<ChatType & { chatHistory: ChatgptMessage[] }> {
    const chat = await db.db.insert(db.chats).values({
        userId,
        actLike
    }).returning() as ChatType[];
    await db.db.insert(db.chatHistory).values({
        chatId: chat[0].chatId,
        message: promt.replaceAll("[famous person]", actLike),
        role: "system"
    })
    return {
        ...chat[0],
        chatHistory: [{
            content: promt.replaceAll("[famous person]", actLike),
            role: "system"
        }]
    }
}

export async function saveMessages(chatId: number, messages: ChatgptMessage[]): Promise<void> {
    const insertArray = messages.map(message => ({ chatId, role: message.role, message: message.content }))
    await db.db.insert(db.chatHistory).values(insertArray)
}