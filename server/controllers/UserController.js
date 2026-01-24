import userService from '../services/UserService.js';
import asyncHandler from 'express-async-handler';

class UserController {
    register = asyncHandler(async (req, res) => {
        const user = await userService.register(req.body);
        res.status(201).json({
            success: true,
            data: user,
            message: 'User registered successfully'
        });
    });

    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const result = await userService.login(email, password);
        res.status(200).json({
            success: true,
            ...result,
            message: 'Logged in successfully'
        });
    });

    getProfile = asyncHandler(async (req, res) => {
        const user = await userService.getProfile(req.userId);
        res.status(200).json({
            success: true,
            data: user
        });
    });
}

export default new UserController();
