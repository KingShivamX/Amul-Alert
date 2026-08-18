import mongoose, { Schema, Document } from "mongoose";

export interface INotificationLog extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  recipientEmail: string;
  status: "SUCCESS" | "FAILED";
  message: string;
  error?: string;
  sentAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
    message: { type: String, required: true },
    error: { type: String },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.NotificationLog ||
  mongoose.model<INotificationLog>("NotificationLog", NotificationLogSchema);
