import mongoose from 'mongoose';

const AdminAddIVSchema = new mongoose.Schema({
  url: { type: String, required: true }, 
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true }, 
}, { timestamps: true });

export default mongoose.model('AdminAddIV', AdminAddIVSchema);
