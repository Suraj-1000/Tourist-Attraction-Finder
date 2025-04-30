import mongoose from 'mongoose';

const LanguageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  flag: { type: String, required: true }
});

const Language = mongoose.model('Language', LanguageSchema);

export default Language;
