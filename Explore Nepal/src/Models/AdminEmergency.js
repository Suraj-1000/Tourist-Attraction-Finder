import mongoose from 'mongoose';

const AdminEmergencySchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    type: { type: String, required: true }
}, { timestamps: true });

const Emergency = mongoose.model('Emergency', AdminEmergencySchema);
export default Emergency;
