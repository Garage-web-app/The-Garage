import { Router } from 'express';
import { createUser } from '../controllers/user_controller.js';

// Create a new router
const router: Router = Router();

// Handle routs using the user controllers
router.post('/', createUser);

export { router };
