import express from 'express';
import userController from '../controllers/UserController.js';

const router = express.Router();

// POST route for login
router.post('/', userController.login);

export default router;
