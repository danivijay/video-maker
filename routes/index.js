const express = require('express');
const path = require('path');
const fs = require('fs');
const Promise = require("bluebird");
const request = require('request-promise');
const promisePoller = require('promise-poller').default;

// policies
const upload = require('../policies/fileupload');
const API = require('../services/http-common');

const router = express.Router();

// rputes
router.get('/', (req, res) => {
  res.render('index');
});

router.post('/', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.render('index', {
        err: err
      });
    } else {
      if (req.files.length === 0) {
        res.render('index', {
          err: 'Error: No file selected'
        });
      } else {
        const paths = req.files.map((file) => `${file.destination}${file.filename}`);
        const projectData = {
          'json': '{}',
          'name': 'Sample Project'
        }
        
        // create project
        API.httpPost('/projects/', projectData)
          .then(res => {
            projectUrl = JSON.parse(res).url;
            projectId = JSON.parse(res).id;

            console.log('Successfully created project: ' + projectUrl);

            let promiseArray = [];

            for (let i=0; paths.lenght<i; i++) {
              promiseArray.push(
                createClip({
                    "path": paths[i],
                    "position": parseFloat(i*10),
                    "end": parseFloat((i+1)*10)
                }, projectUrl));  
            }

            Promise.all(promiseArray).then(function(responseArray){
              // export as a new video
              exportData = {
                "export_type": "video",
                "video_format": "mp4",
                "video_codec": "libx264",
                "video_bitrate": 15000000,
                "audio_codec": "ac3",
                "audio_bitrate": 1920000,
                "project": projectUrl,
                "json": '{}'
              };
              API.httpPost('/exports/', exportData)
                .then(function(response){
                  // export has been created and will begin processing soon
                  var exportUrl = JSON.parse(response).url;
                  exportId = JSON.parse(response).id;
                  console.log('Successfully created export: ' + exportUrl);

                  // poll until the export has finished
                  var poller = promisePoller({
                      taskFn: isExportCompleted,
                      interval: 1000,
                      retries: 60*60*1000,
                      timeout: 2000
                  }).then(function(exportOutputUrl) {
                      // New exported video is ready for download now
                      console.log('Download ' + exportOutputUrl);
                      request(exportOutputUrl).pipe(fs.createWriteStream('Output-' + projectId + '.mp4'));
                  }).catch(err=> {
                    console.log('-------err2-------',err)
                  });
                });
            });
          })
          .catch(err => {
            console.log(err)
          }) 
      }
    }
  })
});

// support functions
function isExportCompleted(exportId) {
  return new Promise(function (resolve, error) {

    API.httpGet('/exports/' + exportId + '/', {})
          .then(function(response) {
              var exportStatus = JSON.parse(response).status;
              var exportOutputUrl = JSON.parse(response).output;
              if (exportStatus == 'completed') {
                  console.log('Export completed: ' + JSON.stringify(response));
                  resolve(exportOutputUrl);
              }
          })
          .catch(err => {
            console.log('-------err1-------', err);
          });
  });
}

function createClip(clip, projectUrl) {
  // create new File object (and upload file from filesystem)
  const fileData = {
      'json': '{}',
      'project': projectUrl,
      'media': fs.createReadStream(clip.path)
  };

  return new Promise(function (resolve) {
      API.httpPost('/files/', fileData)
          .then(function(response) {
              // file uploaded and object created
              const fileUrl = JSON.parse(response).url;
              console.log('Successfully created file: ' + fileUrl);

              // now we need to add a clip which references this new File object
              const clipData = {
                  'file': fileUrl,
                  'json': '{}',
                  'position': clip.position || 0.0,
                  'start': clip.start || 0.0,
                  'end': clip.end || JSON.parse(response).json.duration,
                  'layer': clip.layer || 0,
                  'project': projectUrl
              };
              return API.httpPost('/clips/', clipData).then(function(response){
                  const clipUrl = JSON.parse(response).url;
                  console.log('Successfully created clip: ' + clipUrl);
                  resolve();
              });
          });
  });
}

module.exports = router