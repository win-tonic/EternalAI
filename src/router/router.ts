import { Router } from "express";
import authController from "../controllers/authController";
import accountController from "../controllers/accountController";
import chatController from "../controllers/chatController";
import paymentController from "../controllers/paymentController";
import { needsToken } from "../middleware/authMiddleware";

const router = Router();

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.post('/googleAuth', authController.googleAuth);

router.get('/accountInfo', needsToken(accountController.getAccountInfo));
router.post('/changeAccountInfo', needsToken(accountController.changeInfo))
router.post('/changePassword', needsToken(accountController.changePassword))
router.post('/socialMediaShared', needsToken(accountController.giveThreeQuestions))

router.post('/newChat', needsToken(chatController.createNewChat));
router.get('/chatInfo', needsToken(chatController.getChatInfo));
router.post('/sendMessage', needsToken(chatController.sendMessage));

router.post('/subscribe', needsToken(paymentController.createPaymentIntent));
router.post('/unsubscribe', needsToken(paymentController.cancelSubscription));
router.post('/stripe/webhook', paymentController.webhook);

export { router };