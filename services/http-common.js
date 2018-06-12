const request = require('request-promise');

const protocol = 'http';
const server = 'cloud.openshot.org';
const auth = { 
  'user': 'demo-cloud',
  'pass': 'demo-password'
};

exports.httpPost = function(endpoint, data) {
  // Prepare request object and POST data to OpenShot API
  const r = request.post(protocol + '://' + auth.user + ':' + auth.pass + '@' + server + endpoint, function (err, response, body) {
      if (err) {
          return err;
      } else {
          console.log(response.statusCode + ': ' + body);
          return body;
      }
  });

  // Append form data to request form-data
  const form_data = r.form();
  for ( var key in data ) {
      form_data.append(key, data[key]);
  }
  return r;
}

exports.httpGet = function(endpoint, data) {
  // Prepare request object and GET data to OpenShot API
  return request.get(protocol + '://' + auth.user + ':' + auth.pass + '@' + server + endpoint, function (err, response, body) {
      if (err) {
          return err;
      } else {
          console.log(response.statusCode + ': ' + body);
          return body;
      }
  });
}

exports.httpDelete = function(endpoint, data) {
  // Prepare request object and GET data to OpenShot API
  return request.delete(protocol + '://' + auth.user + ':' + auth.pass + '@' + server + endpoint, function (err, response, body) {
      if (err) {
          return err;
      } else {
          console.log(response.statusCode + ': ' + body);
          return body;
      }
  });
}