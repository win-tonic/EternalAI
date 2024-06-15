import { Router } from "express";
import authController from "../controllers/authController";
import accountController from "../controllers/accountController";
import chatController from "../controllers/chatController";
import paymentController from "../controllers/paymentController";
import { needsToken } from "../middleware/authMiddleware";
import { errorMiddleware } from "../middleware/errorHandler";

const router = Router();

router.post('/signup', errorMiddleware(authController.signUp));
router.post('/signin', errorMiddleware(authController.signIn));
router.post('/googleAuth', errorMiddleware(authController.googleAuth));

router.get('/accountInfo', errorMiddleware(needsToken(accountController.getAccountInfo)));
router.post('/changeAccountInfo', errorMiddleware(needsToken(accountController.changeInfo)))
router.post('/changePassword', errorMiddleware(needsToken(accountController.changePassword)))
router.post('/socialMediaShared', errorMiddleware(needsToken(accountController.giveThreeQuestions)))

router.post('/newChat', errorMiddleware(needsToken(chatController.createNewChat)));
router.get('/chatInfo', errorMiddleware(needsToken(chatController.getChatInfo)));
router.post('/sendMessage', errorMiddleware(needsToken(chatController.sendMessage)));

router.post('/subscribe', errorMiddleware(needsToken(paymentController.createPaymentIntent)));
router.post('/unsubscribe', errorMiddleware(needsToken(paymentController.cancelSubscription)));
router.post('/stripe/webhook', errorMiddleware(paymentController.webhook));

export { router };