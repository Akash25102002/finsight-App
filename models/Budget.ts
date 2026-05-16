import mongoose, { Schema, Document } from 'mongoose'

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId
  categoryId: mongoose.Types.ObjectId
  limit: number
  month: number
  year: number
  currency: string
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    limit: { type: Number, required: true, min: 1 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
)

BudgetSchema.index({ userId: 1, month: 1, year: 1 })

export default mongoose.models.Budget ||
  mongoose.model<IBudget>('Budget', BudgetSchema)
