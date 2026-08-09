import mongoose, { Schema, Document, models } from 'mongoose';

export interface IOrderDocument extends Document {
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: Array<{
    courseId: string;
    courseTitle: string;
    price: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentGateway: string;
  paymentId: string;
  status: string;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    items: [Schema.Types.Mixed],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentGateway: { type: String, default: 'RAZORPAY' },
    paymentId: { type: String, required: true },
    status: { type: String, enum: ['SUCCESSFUL', 'FAILED', 'REFUNDED', 'PENDING'], default: 'SUCCESSFUL' }
  },
  { timestamps: true }
);

export default models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);
