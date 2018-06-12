const createClip = function (clip, projectUrl) {
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

module.exports = createClip