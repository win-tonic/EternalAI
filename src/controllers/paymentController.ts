import { Request, Response } from 'express';
import Stripe from 'stripe';
import { makeUserSubscribed, makeUserUnsubscribed, getAccountInfo } from '../db/dbInteractions/dbAccount';
import { createCustomer, createSubscription, verifyStripeSignature} from '../services/stripeService';
import { addPaymentIntentRecord, updatePaymentIntentRecord, getPaymentIntentRecord, getPaymentIntentRecordBySubscriptionId, getPaymentIntentRecordByUserId } from '../db/dbInteractions/dbPayments';

const stripe = new Stripe(process.env.STRIPE_KEY as string)

class PaymentController {
  constructor() {
    this.createPaymentIntent = this.createPaymentIntent.bind(this);
    this.webhook = this.webhook.bind(this);
  }

  public async createPaymentIntent(req: Request, res: Response) {
    const userId = res.locals.tokenInfo.id;
    const userInfo = await getAccountInfo(userId);
    if (userInfo.subscribed) {
      return res.status(400).json({ error: 'User is already subscribed' });
    }

    try {
      const price = 'price_1PQs0hRs4PB16lesnbspiUfQ';
      const customer = await createCustomer(userId, userInfo.email, userInfo.name, userInfo.phoneNumber);
      const subscription = await createSubscription(userId, customer.id, price);
      if (!subscription.latest_invoice || typeof subscription.latest_invoice === 'string' || !subscription.latest_invoice.payment_intent || typeof subscription.latest_invoice.payment_intent === 'string' || !subscription.latest_invoice.payment_intent.client_secret) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      const clientSecret = subscription.latest_invoice.payment_intent.client_secret;
      const paymentIntentId = subscription.latest_invoice.payment_intent.id;
      await addPaymentIntentRecord(paymentIntentId, userId, clientSecret, subscription.id);
      res.status(200).json({ subscriptionId: subscription.id, clientSecret });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  public async cancelSubscription(req: Request, res: Response) {
    const userId = res.locals.tokenInfo.id;
    const prevInfo = await getPaymentIntentRecordByUserId(userId);
    if (!prevInfo || !prevInfo[0]) {
      return res.status(404).json({ error: 'User wasnt subscribed' });
    }
    const subscriptionId = prevInfo[0].subscriptionId;
    const deletedSubscription = await stripe.subscriptions.cancel(
      subscriptionId
    );
    res.send(deletedSubscription);
  }

  public async webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;

    try {
      const event = verifyStripeSignature(req.body, sig);
      if (event.type === 'invoice.payment_succeeded') {
        const paymentIntentId = event.data.object.payment_intent as string;
        const updatedInfo = await updatePaymentIntentRecord(paymentIntentId, 'SUCCEEDED');
        await makeUserSubscribed(updatedInfo[0].userId);
      } else if (event.type === 'invoice.payment_failed') {
        const paymentIntentId = event.data.object.payment_intent as string;
        await updatePaymentIntentRecord(paymentIntentId, 'FAILED');
      } else if (event.type === 'invoice.finalized'){
        const paymentIntentId = event.data.object.payment_intent as string;
        const subscriptionId = event.data.object.subscription as string;
        const prevInfo = await getPaymentIntentRecord(paymentIntentId);
        if (prevInfo.length > 0) {
          await addPaymentIntentRecord(paymentIntentId, prevInfo[0].userId, prevInfo[0].clientSecret, subscriptionId);
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const subscriptionId = event.data.object.id as string;
        const prevInfo = await getPaymentIntentRecordBySubscriptionId(subscriptionId);
        if (prevInfo.length > 0) {
          await makeUserUnsubscribed(prevInfo[0].userId);
        }
      }
      res.status(200).json({ received: true });
    } catch (error) {
      if (error instanceof Error) {
        const event = verifyStripeSignature(req.body, sig);
        console.error(`Error handling Stripe webhook ${event.type}:`, error);
        res.status(400).send(`Webhook Error: ${error.message}`);
      } else {
        console.error('Unknown error handling Stripe webhook:', error);
        res.status(400).send('Webhook Error');
      }
    }
  }

  public async getPaymentIntentStatus(req: Request, res: Response) {
    const subscriptionId = req.query.subscriptionId as string;
    const userId = res.locals.tokenInfo.id;
    try {
      if (!subscriptionId) {
        return res.status(400).json({ error: 'Item not specified' });
      }
      const paymentIntent = await getPaymentIntentRecordBySubscriptionId(subscriptionId);
      if (!paymentIntent || !paymentIntent[0]) {
        return res.status(404).json({ error: 'Payment intent not found' });
      }
      if (paymentIntent[0].userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      res.status(200).json({ paymentStatus: paymentIntent[0].status });
    } catch (error) {
      console.error('Error getting payment intent:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

const paymentController = new PaymentController();
export default paymentController;