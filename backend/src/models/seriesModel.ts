import mongoose, { Schema, type Model } from "mongoose";
import type { ISeries } from "../types/model.db.js";

const seriesSchema = new Schema<ISeries>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true }
);

const Series: Model<ISeries> =
  (mongoose.models.Series as Model<ISeries>) ??
  mongoose.model<ISeries>("Series", seriesSchema);

export default Series;
