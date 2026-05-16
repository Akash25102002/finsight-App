import mongoose, { Schema, Document } from 'mongoose'

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  amount: number
  type: 'income' | 'expense'
  categoryId: mongoose.Types.ObjectId
  date: Date
  note?: string
  currency: string
  isRecurring: boolean
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['income', 'expense'], required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, maxlength: 500 },
    currency: { type: String, default: 'INR' },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
  },
  { timestamps: true }
)

TransactionSchema.index({ userId: 1, date: -1 })
TransactionSchema.index({ userId: 1, type: 1 })

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema)
