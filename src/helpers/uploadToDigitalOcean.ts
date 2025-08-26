import { ObjectCannedACL, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { tmpdir } from "os";
import path from "path";
import fs from "fs/promises";
import ApiError from "../errors/ApiErrors";
import config from "../config";
import fsSync from "fs";

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

const s3Config: S3ClientConfig = {
  endpoint: config.space.end_point,
  region: config.space.region,
  credentials: {
    accessKeyId: config.space.access_id as string,
    secretAccessKey: config.space.access_key as string,
  },
  forcePathStyle: true,
};

export const s3 = new S3Client(s3Config);
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * Converts video buffer to webm format.
 */
const convertVideoToWebM = async (buffer: Buffer): Promise<Buffer> => {
  const inputPath = path.join(tmpdir(), `input-${Date.now()}.mp4`);
  const outputPath = path.join(tmpdir(), `output-${Date.now()}.webm`);

  await fs.writeFile(inputPath, buffer);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec("libvpx")
      .audioCodec("libvorbis")
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });

  const outputBuffer = await fs.readFile(outputPath);
  await fs.unlink(inputPath);
  await fs.unlink(outputPath);

  return outputBuffer;
};

/**
 * Uploads a file buffer to DigitalOcean Spaces and returns the file URL.
 * Converts images to webp and videos to webm.
 */
const uploadToDigitalOcean = async (
  file: Express.Multer.File,
  folderName: string
): Promise<string> => {
  try {
    if (!file) throw new ApiError(400, "No file provided");

    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(
        400,
        `File size exceeds max limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    let fileBuffer = await fs.readFile(file.path);
    let fileExtension = path.extname(file.originalname).toLowerCase();
    let mimeType = file.mimetype;

    if (isImage) {
      fileBuffer = await sharp(fileBuffer).webp().toBuffer();
      fileExtension = ".webp";
      mimeType = "image/webp";
    } else if (isVideo) {
      fileBuffer = await convertVideoToWebM(fileBuffer);
      fileExtension = ".webm";
      mimeType = "video/webm";
    }

    const fileName = `uploads/${folderName}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${fileExtension}`;

    const uploadParams = {
      Bucket: config.space.space_name,
      Key: fileName,
      Body: fileBuffer,
      ACL: "public-read" as ObjectCannedACL,
      ContentType: mimeType,
    };

    const upload = new Upload({
      client: s3,
      params: uploadParams,
    });

    const data = await upload.done();
    await fs.unlink(file.path);
    const fileUrl =
      data.Location ||
      `${config.space.end_point}/${config.space.space_name}/${fileName}`;

    return fileUrl;
  } catch (error) {
    if (fsSync.existsSync(file.path)) {
      await fs.unlink(file.path);
    }
    throw new ApiError(
      500,
      error instanceof Error
        ? `Failed to upload file: ${error.message}`
        : "Failed to upload file to DigitalOcean Spaces"
    );
  }
};

export default uploadToDigitalOcean;
