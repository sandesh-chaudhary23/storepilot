import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currency: { type: String, default: 'USD' },
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate a unique slug from the business name on first save / rename.
businessSchema.pre('save', async function () {
  if (this.slug && !this.isModified('name')) return;
  const base = slugify(this.name) || 'store';
  let slug = base;
  let n = 1;
  // Ensure uniqueness across businesses.
  // eslint-disable-next-line no-await-in-loop
  while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${n++}`;
  }
  this.slug = slug;
});

export const Business = mongoose.model('Business', businessSchema);
