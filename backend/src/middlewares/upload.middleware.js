import multer from "multer";
import ApiError from "../utils/ApiError.js";

const MAX_BYTES = 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const WRONG_TYPE = "The logo must be a JPEG, PNG or WebP image";
const TOO_LARGE = "The logo must be 1 MB or smaller";

// the file is held in memory and passed on to the file store; nothing is written to disk
const upload = multer({
    storage: multer.memoryStorage(),
    // one file and a handful of short fields: nothing else is held in memory
    limits: { fileSize: MAX_BYTES, files: 1, fields: 30, fieldSize: 20 * 1024 },
    defParamCharset: 'utf8',
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ApiError(400, WRONG_TYPE));
        }
    },
});

// Reads a form that may carry one image in the given field. The image is optional;
// one of the wrong kind or size is refused with a message for the user.
const acceptImage = (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
        if (!error) return next();

        if (error instanceof ApiError) return next(error);

        if (error.code === 'LIMIT_FILE_SIZE') return next(new ApiError(400, TOO_LARGE));

        next(new ApiError(400, "The form could not be read"));
    });
};

export { acceptImage }
