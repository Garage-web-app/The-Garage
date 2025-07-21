import { Router } from 'express';
import { welcomeController } from '../controllers/welcome_controller.js';

// Create a new router
const router: Router = Router();

// Handle root route using the welcome controller
router.get('/', welcomeController);

export { router };
