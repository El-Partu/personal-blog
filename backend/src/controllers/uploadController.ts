import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import type { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";
import { env } from "../config/env.js";
import {
  detectRasterImageFormat,
  rasterExtension,
  RASTER_EXTENSION_PATTERN,
} from "../utils/images.js";

const LOCAL_UPLOAD_DIR = resolve(process.cwd(), "uploads");

if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

/**
 * POST /api/v1/admin/uploads
 *
 * Uploads to Cloudinary when credentials are configured; otherwise writes to a
 * local `uploads/` directory served statically, so image handling works out of
 * the box in development.
 */
export const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw new AppError("No image file was provided.", 400);

  // Authoritative check on the actual bytes: SVG and every other scriptable /
  // non-raster format is refused, regardless of the client-supplied filename
  // or MIME type.
  const format = detectRasterImageFormat(file.buffer);
  if (!format) {
    throw new AppError(
      "Only raster images are allowed (PNG, JPEG, GIF, WebP or AVIF).",
      400
    );
  }

  if (env.cloudinary.enabled) {
    const result = await new Promise<Record<string, unknown>>((resolvePromise, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "blog", resource_type: "image" },
        (error, uploaded) => {
          if (error || !uploaded) return reject(error ?? new Error("Upload failed"));
          resolvePromise(uploaded as unknown as Record<string, unknown>);
        }
      );
      stream.end(file.buffer);
    });

    res.status(201).json({
      status: "success",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: new Date().toISOString(),
      },
    });
    return;
  }

  mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  // Extension comes from the detected magic bytes only — never from
  // `file.originalname`, which the client controls.
  const filename = `${randomUUID()}${rasterExtension(format)}`;
  writeFileSync(resolve(LOCAL_UPLOAD_DIR, filename), file.buffer);

  res.status(201).json({
    status: "success",
    data: {
      url: `/uploads/${filename}`,
      publicId: filename,
      bytes: file.size,
      createdAt: new Date().toISOString(),
    },
  });
});

/** GET /api/v1/admin/uploads — media library listing. */
export const listImages = catchAsync(async (_req: Request, res: Response) => {
  if (env.cloudinary.enabled) {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "blog",
      max_results: 100,
    });
    const data = (result.resources as Record<string, unknown>[]).map((item) => ({
      url: item.secure_url,
      publicId: item.public_id,
      width: item.width,
      height: item.height,
      format: item.format,
      bytes: item.bytes,
      createdAt: item.created_at,
    }));
    res.status(200).json({ status: "success", data });
    return;
  }

  let files: string[] = [];
  try {
    files = readdirSync(LOCAL_UPLOAD_DIR);
  } catch {
    files = [];
  }

  const data = files
    .filter((name) => RASTER_EXTENSION_PATTERN.test(name))
    .map((name) => {
      const stats = statSync(resolve(LOCAL_UPLOAD_DIR, name));
      return {
        url: `/uploads/${name}`,
        publicId: name,
        bytes: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.status(200).json({ status: "success", data });
});

/** DELETE /api/v1/admin/uploads/:publicId */
export const deleteImage = catchAsync(async (req: Request, res: Response) => {
  const publicId = decodeURIComponent(String(req.params.publicId));

  if (env.cloudinary.enabled) {
    await cloudinary.uploader.destroy(publicId);
    res.status(204).end();
    return;
  }

  // Reject traversal attempts before touching the filesystem.
  if (publicId.includes("/") || publicId.includes("..")) {
    throw new AppError("Invalid image id.", 400);
  }
  try {
    unlinkSync(resolve(LOCAL_UPLOAD_DIR, publicId));
  } catch {
    throw new AppError("Image not found.", 404);
  }
  res.status(204).end();
});
