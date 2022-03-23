const express = require("express");
const {
  uploadImages,
  deleteImages,
} = require("../controllers/imageController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

const upload = multer({ storage: storage });

router.post("/", upload.single("image"), uploadImages);
router.post("/delete-image", deleteImages);
router.post("/multiple-images", upload.array("image", 3), uploadImages);

module.exports = router;
