import mongoose, { Schema, Document, models } from 'mongoose';

export type AgentName = 'concierge' | 'tutor' | 'support';

export interface IAgentMessage {
  role: 'user' | 'assistant';
  content: string;
  at: Date;
  meta?: Record<string, unknown>;
}

/** Conversation memory for one learner with one agent (the tutor keeps one thread per course). */
export interface IAgentThreadDocument extends Document {
  userId: string;
  agent: AgentName;
  scope: string;
  messages: IAgentMessage[];
}

const AgentThreadSchema = new Schema<IAgentThreadDocument>(
  {
    userId: { type: String, required: true, index: true },
    agent: { type: String, enum: ['concierge', 'tutor', 'support'], required: true },
    scope: { type: String, default: 'global' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        at: { type: Date, default: Date.now },
        meta: { type: Schema.Types.Mixed },
        _id: false
      }
    ]
  },
  { timestamps: true }
);

AgentThreadSchema.index({ userId: 1, agent: 1, scope: 1 }, { unique: true });

export default models.AgentThread || mongoose.model<IAgentThreadDocument>('AgentThread', AgentThreadSchema);
