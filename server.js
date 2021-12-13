const express = require('express');
const cors = require('cors');
const {getLatestBlock} = require('./utils/customMiddleware')
const app = express();  

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const path = __dirname + '/views/'

//Mount the api router at the '/api' path
const apiRouter = require('./api/apiRouter');
app.use('/api', getLatestBlock, apiRouter);
app.use(express.static(path))

//
app.get('/', function (req, res) {
  res.sendFile(path + "index.html");
});


app.listen(PORT, () => console.log((`XI Blockchain Explorer server is listening at port ${PORT}`)));