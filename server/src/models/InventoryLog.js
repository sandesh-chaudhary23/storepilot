import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    change: { type: Number, required: true }, // +restock / -sale/adjustment
    stockAfter: { type: Number, required: true },
    reason: {
      type: String,
      enum: ['restock', 'sale', 'adjustment', 'order_cancelled', 'initial'],
      required: true,
    },
    note: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
