import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISupportTicketDocument extends Document {
  userId: string;
  email: string;
  subject: string;
  summary: string;
  category: 'PAYMENT' | 'REFUND' | 'ACCESS' | 'CERTIFICATE' | 'ACCOUNT' | 'OTHER';
  status: 'OPEN' | 'RESOLVED';
}

const SupportTicketSchema = new Schema<ISupportTicketDocument>(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, default: '' },
    subject: { type: String, required: true },
    summary: { type: String, required: true },
    category: { type: String, enum: ['PAYMENT', 'REFUND', 'ACCESS', 'CERTIFICATE', 'ACCOUNT', 'OTHER'], default: 'OTHER' },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN', index: true }
  },
  { timestamps: true }
);

export default models.SupportTicket || mongoose.model<ISupportTicketDocument>('SupportTicket', SupportTicketSchema);
