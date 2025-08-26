import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure the upload folder exists
const UPLOAD_FOLDER = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, //10mb
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// Single file upload
const profileImage = upload.single("avatar");
const chatImage = upload.single("chatImage");
const audio = upload.single("audio");
const certificate = upload.single("certificate");
const diagnosticLogo = upload.single("diagnosticLogo");

// Multiple fields
const doctorFileUploader = upload.fields([
  { name: "bmdcFile", maxCount: 1 },
  { name: "avatar", maxCount: 1 },
  { name: "certificateFile", maxCount: 1 },
]);

const reportImages = upload.fields([{ name: "reportFile", maxCount: 5 }]);
const prescriptionFile = upload.single("prescriptionFile");

const uploadMultiple = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "classVideo", maxCount: 1 },
]);

export const fileUploader = {
  uploadMultiple,
  doctorFileUploader,
  profileImage,
  chatImage,
  audio,
  certificate,
  diagnosticLogo,
  upload,
  reportImages,
  prescriptionFile,
};
