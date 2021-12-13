const {fetchXi} = require('./fetchXiData')

const getLatestBlock = async (req, res, next) => {
  try {
    const response = await fetchXi('/blocks/latest');
    if (response.error) {
      res.status(400).send(response.error);
    } 
    req.latestBlock = response.height;
    req.numberOfBlockPages = Math.floor((response.height / 10) + 1) 
    next();
    } catch (error) {
      console.error();
    }
}

module.exports = {getLatestBlock}