const path = require('path');
const multer = require('multer');

// set storage engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// init upload
const upload = multer({
  storage: storage,
  limits: {fileSize: 1000000 * 20 }, // filesize limited to 20MB
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).array('images', 12);

// check file type
function checkFileType(file, cb) {
  
  // allowed extensions
  const filetypes = /jpeg|jpg|png|gif/;
  
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb (null, true);
  } else {
    cb('Error: Images only');
  }
}

module.exports = upload