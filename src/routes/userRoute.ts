import {Router} from 'express';
import * as userController from '../controllers/userController.js';
const router = Router();


router.route('/').get(userController.getUser);

export default router;