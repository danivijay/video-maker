const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const routes = require('./routes');

// init app
const app = express();

// parse urlencoded and json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.set(express.static('./public'));

app.use('/', routes);

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`server running at ${port}`)
});