import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    icon: { type: String, default: '💳' },
    color: { type: String, default: '#6366f1' },
    type: { type: String, enum: ['income', 'expense'], required: true },
  },
  { timestamps: true }
)

export default mongoose.models.Category ||
  mongoose.model<ICategory>('Category', CategorySchema)
