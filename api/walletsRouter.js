const express = require('express');
const {fetchXi, getWalletTxs} = require('../utils/fetchXiData');
const {cleanData, cleanListOfData} = require('../utils/cleanData')

const walletsRouter = express.Router();

// get 1st page of wallets (10 most recent)
walletsRouter.get('/', async (req, res) => {
  const page = req.query.page ? req.query.page : 1;
  const firstWallet = page * 10;

  const walletsRaw = await fetchXi('/wallets');
  if (walletsRaw.error) {
    res.status(400).send(walletsRaw)
  } 
  
  // clean data so readable by by Table componenet in Vue app, and limit to 10
  const walletsClean = cleanListOfData(walletsRaw.slice(firstWallet, firstWallet + 10));
  res.send(walletsClean);
})


// get single wallet by address and associated transactions (10 per page)
walletsRouter.get('/:address', async (req, res) => {
  const page = req.query.page ? req.query.page : 1;

  const walletAddress = req.params.address;
  let latestBlock = req.latestBlock;
  
  // get wallet and associated transactions
  const walletRaw = await fetchXi('/wallets/' + walletAddress);
  const transactionsRaw = await getWalletTxs(walletAddress, latestBlock, page);
  
  // clean data so readable by by Table componenet in Vue app
  const walletClean = cleanData(walletRaw);
  if (transactionsRaw.length !== 0) {
    const transactionsClean = cleanListOfData(transactionsRaw)
    walletClean.transactions = transactionsClean;
  }

  res.send(walletClean)
})

module.exports = walletsRouter;
