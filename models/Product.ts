import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  url: string;
  image?: string;
  price?: string;
  availability: "AVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";
  isMonitoring: boolean;
  lastChecked?: Date;
  lastAvailable?: Date;
  lastNotificationSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    price: { type: String, default: "" },
    availability: {
      type: String,
      enum: ["AVAILABLE", "OUT_OF_STOCK", "UNKNOWN"],
      default: "UNKNOWN",
    },
    isMonitoring: { type: Boolean, default: true },
    lastChecked: { type: Date },
    lastAvailable: { type: Date },
    lastNotificationSent: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
