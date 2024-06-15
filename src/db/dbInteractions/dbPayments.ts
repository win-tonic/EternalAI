import { db } from '../db';
import { PaymentIntentType } from '../../types/types';
import { eq, desc } from 'drizzle-orm';

export async function addPaymentIntentRecord(paymentIntentId: string, userId: number, clientSecret: string, subscriptionId: string) {
    await db.db.insert(db.paymentIntents)
        .values({id: paymentIntentId, userId, clientSecret, timeCreated: new Date(), status: 'PENDING', subscriptionId })
}

export async function getPaymentIntentRecord(paymentIntentId: string): Promise<PaymentIntentType[]> {
    const paymentIntent = await db.db.select({ id: db.paymentIntents.id, userId: db.paymentIntents.userId, clientSecret: db.paymentIntents.clientSecret, timeCreated: db.paymentIntents.timeCreated, status: db.paymentIntents.status, subscriptionId: db.paymentIntents.subscriptionId})
        .from(db.paymentIntents)
        .where(eq(db.paymentIntents.id, paymentIntentId)).orderBy(desc(db.paymentIntents.timeCreated));
    return paymentIntent;
}

export async function getPaymentIntentRecordBySubscriptionId(subscriptionId: string): Promise<PaymentIntentType[]> {
    const paymentIntent = await db.db.select({ id: db.paymentIntents.id, userId: db.paymentIntents.userId, clientSecret: db.paymentIntents.clientSecret, timeCreated: db.paymentIntents.timeCreated, status: db.paymentIntents.status, subscriptionId: db.paymentIntents.subscriptionId})
        .from(db.paymentIntents)
        .where(eq(db.paymentIntents.subscriptionId, subscriptionId)).orderBy(desc(db.paymentIntents.timeCreated));
    return paymentIntent;
}

export async function getPaymentIntentRecordByUserId(userId: number): Promise<PaymentIntentType[]> {
    const paymentIntent = await db.db.select({ id: db.paymentIntents.id, userId: db.paymentIntents.userId, clientSecret: db.paymentIntents.clientSecret, timeCreated: db.paymentIntents.timeCreated, status: db.paymentIntents.status, subscriptionId: db.paymentIntents.subscriptionId})
        .from(db.paymentIntents)
        .where(eq(db.paymentIntents.userId, userId)).orderBy(desc(db.paymentIntents.timeCreated));
    return paymentIntent;
}

export async function updatePaymentIntentRecord(paymentIntentId: string, status: string): Promise<PaymentIntentType[]>{
    const updatedInfo = await db.db.update(db.paymentIntents)
        .set({ status })
        .where(eq(db.paymentIntents.id, paymentIntentId)).returning() as PaymentIntentType[];
    return updatedInfo;
}

