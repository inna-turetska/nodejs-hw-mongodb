import { Router } from 'express';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import {
  registerUserController,
  logInUserController,
  logOutUserController,
  refreshUserSessionController,
} from '../controllers/auth.js';
import { registerUserSchema, logInUserSchema } from '../validation/auth.js';

const router = Router();
router.post(
  '/register',
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);
router.post(
  '/login',
  validateBody(logInUserSchema),
  ctrlWrapper(logInUserController),
);
router.post('/logout', ctrlWrapper(logOutUserController));

router.post('/refresh', ctrlWrapper(refreshUserSessionController));

export default router;
