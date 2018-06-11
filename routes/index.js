const express = require('express');
const path = require('path');
const axios = require('axios');

// policies
const upload = require('../policies/fileupload')

const router = express.Router();

router.post('/', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.render('index', {
        err: err
      });
    } else {
      console.log(req.files.length)
      if (req.files.length === 0) {
        res.render('index', {
          err: 'Error: No file selected'
        });
      } else {
        console.log(req.files)
        let paths = req.files.map((file) => `${file.destination}${file.filename}`)
        res.render('index', {
          link: "http://danivijay.com"
        });
      }
    }
  })
});

router.get('/', (req, res) => {
  res.render('index');
});


module.exports = router