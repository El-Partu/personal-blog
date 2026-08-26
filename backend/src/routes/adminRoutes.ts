import { Router } from "express";
import multer from "multer";
import protect from "../middleware/protect.js";
import { validateBody } from "../middleware/validation.js";
import * as admin from "../controllers/adminController.js";
import * as uploads from "../controllers/uploadController.js";
import {
  postInputSchema,
  postUpdateSchema,
  seriesInputSchema,
  tagInputSchema,
} from "../schema/content.schema.js";

const router = Router();

// Every route below requires a valid admin JWT.
router.use(protect);

// Posts
router.get("/posts", admin.listAdminPosts);
router.post("/posts", validateBody(postInputSchema), admin.createPost);
router.get("/posts/:id", admin.getAdminPost);
router.patch("/posts/:id", validateBody(postUpdateSchema), admin.updatePost);
router.delete("/posts/:id", admin.deletePost);

// Series
router.get("/series", admin.listAdminSeries);
router.post("/series", validateBody(seriesInputSchema), admin.createSeries);
router.patch("/series/:id", validateBody(seriesInputSchema.partial()), admin.updateSeries);
router.patch("/series/:id/order", admin.reorderSeries);
router.delete("/series/:id", admin.deleteSeries);

// Tags
router.get("/tags", admin.listAdminTags);
router.post("/tags", validateBody(tagInputSchema), admin.createTag);
router.delete("/tags/:id", admin.deleteTag);

// Image uploads — 5 MB cap, images only.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed."));
      return;
    }
    callback(null, true);
  },
});

router.get("/uploads", uploads.listImages);
router.post("/uploads", upload.single("image"), uploads.uploadImage);
router.delete("/uploads/:publicId", uploads.deleteImage);

export default router;
