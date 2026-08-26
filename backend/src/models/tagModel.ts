import mongoose, { Schema, type Model } from "mongoose";
import type { ITag } from "../types/model.db.js";

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

const Tag: Model<ITag> =
  (mongoose.models.Tag as Model<ITag>) ?? mongoose.model<ITag>("Tag", tagSchema);

export default Tag;
