import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  },
  { timestamps: true }
);

categorySchema.index({ business: 1, name: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
