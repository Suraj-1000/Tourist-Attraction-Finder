import mongoose from 'mongoose';

const AdminEmergencySchema = new mongoose.Schema({
    phone: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        required: true 
    },
    icon: { 
        type: String, 
        default: "📞" 
    }
}, { timestamps: true });

const Emergency = mongoose.model('Emergency', AdminEmergencySchema);
export default Emergency;
