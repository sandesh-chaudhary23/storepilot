import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const customerSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
    // Set when the customer self-registers through the storefront.
    password: { type: String, select: false },
    hasAccount: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast lookup by store + email (uniqueness for accounts is enforced in the shop controller).
customerSchema.index({ business: 1, email: 1 });

customerSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

customerSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

export const Customer = mongoose.model('Customer', customerSchema);
