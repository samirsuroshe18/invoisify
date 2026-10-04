import { v2 as cloudinary } from "cloudinary";
import ApiError from "./ApiError.js";

const ROOT_FOLDER = 'invoisify';
const KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

// attachments are optional everywhere, so the system also runs without a file store
const uploadsEnabled = () => KEYS.every((key) => Boolean(process.env[key]));

// sends the bytes to Cloudinary and gives back the https address
const uploadToCloudinary = (buffer, folder) => new Promise((resolve, reject) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });

    const stream = cloudinary.uploader.upload_stream(
        // images only, whatever the file is called
        { folder, resource_type: 'image', allowed_formats: ['jpg', 'png', 'webp'] },
        (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );

    stream.end(buffer);
});

// Stores a file that acceptFile read from a form and returns its address.
// Returns null when no file was sent or no file store is set up.
const storeFile = async (file, folder, { uploader = uploadToCloudinary } = {}) => {
    if (!file || !uploadsEnabled()) return null;

    try {
        return await uploader(file.buffer, `${ROOT_FOLDER}/${folder}`);
    } catch (error) {
        console.log(`Storing a file failed: ${error.message}`);
        throw new ApiError(502, "The file could not be stored. Try again without it.");
    }
};

export { uploadsEnabled, storeFile }
