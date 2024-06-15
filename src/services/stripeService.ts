import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function createCustomer(userId: number, email?: string, name?: string, phoneNumber?: string) {
    return await stripe.customers.create({
        metadata: { userId, phoneNumber: phoneNumber || null },
        email: email,
        name: name
    });
}

export async function createSubscription(userId: number, customerId: string, price: string) {
    return await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price }],
        collection_method: 'charge_automatically',
        metadata: { userId },
        payment_behavior: 'default_incomplete',
        payment_settings: {save_default_payment_method: 'on_subscription'},
        expand: ['latest_invoice.payment_intent']
    });
}

export async function cancelSubscription(subscriptionId: string) {
    return await stripe.subscriptions.cancel(subscriptionId);
}

export async function retieveInvoice(invoiceId: string) {
    return await stripe.invoices.retrieve(invoiceId, {
        expand: ['payment_intent']
    });
}

export function verifyStripeSignature(payload: Buffer, sig: string | undefined): Stripe.Event {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !endpointSecret) {
        throw new Error('Missing Stripe signature or endpoint secret');
    }

    try {
        return stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`Webhook Error: ${err.message}`);
        } else {
            throw new Error('Unknown error during webhook verification');
        }
    }
}

export async function handleStripeWebhook(event: Stripe.Event) {
    if ((event.type === 'payment_intent.succeeded') || (event.type === 'payment_intent.payment_failed')) {
        const intent = event.data.object as Stripe.PaymentIntent;

        const itemType = intent.metadata?.itemType;
        const itemId = intent.metadata?.itemId;
        const userId = intent.metadata?.userId;

        if (!itemType || !itemId || !userId) {
            throw new Error('Missing metadata in Stripe session');
        }

         return {
            success: event.type === 'payment_intent.succeeded' ? 1 : 0,
            metadata: intent.metadata,
            clientSecret: intent.client_secret,
            event
        };
    }

    return {success: null, event};
}