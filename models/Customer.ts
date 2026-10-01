import mongoose, { Schema, model, models } from "mongoose";

export interface ICustomer {
  _id: string;
  fullName: string;
  whatsappNumber: string;
  address: string;
  pincode: string;
  voucherId: string;
  deliveryStatus: "sent" | "failed" | "pending";
  deliveryError?: string;
  redeemed: boolean;
  redeemedAt?: Date;
  scanCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    fullName: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    voucherId: { type: String, required: true, unique: true, index: true },
    deliveryStatus: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "pending",
    },
    deliveryError: { type: String },
    redeemed: { type: Boolean, default: false },
    redeemedAt: { type: Date },
    scanCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Customer =
  (models.Customer5000 as mongoose.Model<ICustomer>) ||
  model<ICustomer>("Customer5000", CustomerSchema, "customers_5000");