const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
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

// init app
const app = express();

// parse urlencoded and json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set(express.static('./public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.render('index', {
        err: err
      });
    } else {
      let paths = req.files.map((file) => `${file.destination}${file.filename}`)
      console.log(paths)
      res.render('index', {
        link: "http://danivijay.com"
      });
    }
  })
});

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`server running at ${port}`)
});