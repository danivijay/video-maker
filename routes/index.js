const express = require('express');
const path = require('path');
const fs = require('fs');
const Promise = require("bluebird");
const request = require('request-promise');
const promisePoller = require('promise-poller').default;

// policies
const upload = require('../policies/fileupload');
const API = require('../services/http-common');
const createClip = require('../services/create-clip');

const router = express.Router();

// rputes
router.get('/', (req, res) => {
  res.render('index');
});


router.post('/', (req, res) => {
  let initRes = res;
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
                // create export
                var exportUrl = JSON.parse(response).url;
                  exportId = JSON.parse(response).id;
                  console.log('Successfully created export: ' + exportUrl);

                  // poll until the export finish
                  var poller = promisePoller({
                      taskFn: isExportCompleted,
                      interval: 1000,
                      retries: 60*60*1000,
                      timeout: 2000
                    })
                    .then(function(exportOutputUrl) {
                    // ready to download
                    console.log('Download ' + exportOutputUrl);
                    request(exportOutputUrl).pipe(fs.createWriteStream('./public/downloads/Output-' + projectId + '.mp4'));
                    initRes.render('index', {
                      link: exportOutputUrl,
                      projectId: projectId
                    });
                  })
                  .catch(err=> {
                    initRes.render('index', {
                      err: "Unable to export"
                    });
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

router.get('/delete/:id', (req, res) => {
  API.httpDelete(`/projects/${req.params.id}/`)
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.log(err);
    })
  res.render('index');
});

// support functions
function isExportCompleted() {
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
            console.log(err);
          });
  });
}


module.exports = router