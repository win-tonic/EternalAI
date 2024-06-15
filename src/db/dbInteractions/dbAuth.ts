import { db } from "../db";
import { eq } from "drizzle-orm";
import { FullUserType } from "../../types/types";

export async function createUserProfile(email: string, passwordHash: string, name?: string): Promise<FullUserType[]> {
    const userName = name || ''
    return (await db.db.insert(db.users).values({
        email,
        passwordHash,
        name: userName
    }).returning({
        id: db.users.id,
        email: db.users.email,
        passwordHash: db.users.passwordHash,
        phoneNumber: db.users.phoneNumber,
        name: db.users.name,
        subscribed: db.users.subscribed,
        nextPayment: db.users.nextPayment
    }))
}

export async function createQuestionsLimit(userId: number): Promise<void> {
    await db.db.insert(db.questions).values({
        userId,
        questionsLeft: 5
    })
}

export async function createUser(email: string, passwordHash: string, name?: string): Promise<FullUserType[]> {
    const user = await createUserProfile(email, passwordHash, name)
    await createQuestionsLimit(user[0].id)
    return user
}

export async function userExists(email: string): Promise<boolean> {
    const user = await db.db.select({
        id: db.users.id
    }).from(db.users).where(eq(db.users.email, email))
    return user.length > 0
}

export async function getFullUser(email: string): Promise<FullUserType[]> {
    const user = await db.db.select({
        id: db.users.id,
        email: db.users.email,
        passwordHash: db.users.passwordHash,
        phoneNumber: db.users.phoneNumber,
        name: db.users.name,
        subscribed: db.users.subscribed,
        nextPayment: db.users.nextPayment
    }).from(db.users).where(eq(db.users.email, email))
    return user
}