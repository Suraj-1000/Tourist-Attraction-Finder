import userRepository from '../repositories/UserRepository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserService {
    async register(userData) {
        const { email, phone, password } = userData;

        const existingUserByEmail = await userRepository.findByEmail(email);
        if (existingUserByEmail) {
            throw new Error('Email already exists');
        }

        const existingUserByPhone = await userRepository.findByPhone(phone);
        if (existingUserByPhone) {
            throw new Error('Phone number already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userRepository.create({
            ...userData,
            password: hashedPassword
        });

        return user;
    }

    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return {
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                gender: user.gender || null,
                dateOfBirth: user.dateOfBirth,
                image: user.image,
                role: user.role,
                lastLogin: user.lastLogin,
                guideProfile: user.role === 'guide' ? user.guideProfile : null
            }
        };
    }

    async getProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}

export default new UserService();
