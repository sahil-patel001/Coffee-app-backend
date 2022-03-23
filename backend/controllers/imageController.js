const asyncHandler = require("express-async-handler");
const { uploadFile } = require("../s3");

// ? single image upload
const uploadImages = asyncHandler(async (req, res) => {
  const file = req.file;
  const result = await uploadFile(file);

  if (result) {
    res
      .status(200)
      .json({ data: result, message: "Image Uploaded successfully..." });
  } else {
    res.status(500);
    throw new Error("Something went wrong.");
  }
});

// ! multiple image upload
// const uploadImages = asyncHandler(async (req, res) => {
//   const file = req.file;
//   const result = await uploadFile(file);

//   if (result) {
//     res.status(200).json({ message: "Image Uploaded successfully..." });
//   } else {
//     res.status(500);
//     throw new Error("Something went wrong.");
//   }
// });

const deleteImages = asyncHandler(async (req, res) => {});

module.exports = { uploadImages, deleteImages };
