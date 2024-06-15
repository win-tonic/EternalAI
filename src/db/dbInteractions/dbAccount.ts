import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { ChangebleUserFields } from "../../types/types";

export async function getAccountInfo(userId: number) {
    const accInfo = await db.db.select({
        id: db.users.id,
        email: db.users.email,
        phoneNumber: db.users.phoneNumber,
        name: db.users.name,
        subscribed: db.users.subscribed
    }).from(db.users).where(eq(db.users.id, userId))
    return accInfo[0]
}

export async function changeAccountInfo(userId: number, params: Partial<ChangebleUserFields>): Promise<void> {
    await db.db.update(db.users).set(params).where(eq(db.users.id, userId))
}

export async function changePassword(userId: number, passwordHash: string): Promise<void> {
    await db.db.update(db.users).set({ passwordHash }).where(eq(db.users.id, userId))
}

export async function addQuestionsForUser(userId: number, byAmount: number): Promise<void> {
    const stringifiedAmount = byAmount > 0 ? `+ ${byAmount}` : `- ${Math.abs(byAmount)}`
    await db.db.update(db.questions).set({
        questionsLeft: sql`${db.questions.questionsLeft} ${sql.raw(stringifiedAmount)}`
    }).where(eq(db.questions.userId, userId))
}

export async function getUsersQuestionsAmount(userId: number): Promise<number> {
    const user = await db.db.select({ questionsLeft: db.questions.questionsLeft }).from(db.questions).where(eq(db.questions.userId, userId))
    const questionLeft = (user.length > 0) ? user[0].questionsLeft: Infinity
    return questionLeft
}

export async function changeQuestionsAmount(userId: number, newAmount: number): Promise<void> {
    await db.db.update(db.questions).set({
        questionsLeft: newAmount
    }).where(eq(db.questions.userId, userId))
}

export async function makeUserSubscribed(userId: number): Promise<void>{
    await db.db.delete(db.questions).where(eq(db.questions.userId, userId))
    await db.db.update(db.users).set({
        subscribed: 1,
        nextPayment: sql`now() + interval '1 month'`
    }).where(eq(db.users.id, userId))
}

export async function makeUserUnsubscribed(userId: number): Promise<void>{
    await db.db.insert(db.questions).values({userId, questionsLeft: 0})
    await db.db.update(db.users).set({
        subscribed: 0,
        nextPayment: null
    }).where(eq(db.users.id, userId))
}

// async function test(){
//     await addQuestionsForUser(3, 3)
// }

// test();
