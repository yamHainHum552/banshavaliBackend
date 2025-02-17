import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// const uploadOnCloudinary = async (file, folder) => {
//   try {
//     const buffer = await file.arrayBuffer();
//     const bytes = Buffer.from(buffer);

//     return new Promise((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         {
//           resource_type: "auto",
//           folder,
//         },
//         (error, result) => {
//           if (error) {
//             return reject(error.message);
//           }
//           return resolve(result);
//         }
//       );

//       const stream = require("stream");
//       const bufferStream = new stream.PassThrough();
//       bufferStream.end(bytes);
//       bufferStream.pipe(uploadStream);
//     });
//   } catch (error) {
//     throw new Error(`Failed to upload file: ${error.message}`);
//   }
// };

const uploadOnCloudinary = async (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "auto" }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
      .end(fileBuffer);
  });
};
const deleteImage = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.api.delete_resources([publicId], (err, result) => {
      if (err) {
        console.error("Error deleting image from Cloudinary:", err.message);
        reject(err.message);
      } else {
        console.log("Image deleted successfully:", result);
        resolve(result);
      }
    });
  });
};

export { uploadOnCloudinary, deleteImage };
