import BaseRepository from './BaseRepository.js';
import User from '../models/Signup.js';

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async findByEmail(email) {
        return this.model.findOne({ email });
    }

    async findByPhone(phone) {
        return this.model.findOne({ phone });
    }

    // Add more user-specific queries here
}

export default new UserRepository();
