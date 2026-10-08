import mongoose, { Schema, model, models } from "mongoose";

interface IVoucherCounter {
  _id: string;
  value: number;
}

const VoucherCounterSchema = new Schema<IVoucherCounter>(
  {
    _id: { type: String, required: true },
    value: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

export const VoucherCounter =
  (models.VoucherCounter as mongoose.Model<IVoucherCounter>) ||
  model<IVoucherCounter>("VoucherCounter", VoucherCounterSchema, "voucher_counters_5000");
