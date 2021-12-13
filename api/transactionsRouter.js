const express = require('express');
const {fetchXi, getAllTxBlock} = require('../utils/fetchXiData');
const {cleanData, cleanListOfData} = require('../utils/cleanData')

const transactionsRouter = express.Router();

// get list of all transactions (separated into pages of 10)
transactionsRouter.get('/', async (req, res) => {
  //FIX: need to figure out how to count total number of transactions to work out total number of pages!
  const page = req.query.page;
  let transactionsRaw; // will hold raw data from api
  
  // if no page query, request is for page 1
  // '/transactions' endpoint gets 10 most recent so no need to get txs 1 by 1
  if (!page || page == 1) {
    transactionsRaw = await fetchXi('/transactions');
    
    if (transactionsRaw.error) {
      res.status(400).send(transactionsRaw);
      return;
    } 

    transactionsRaw = await getAllTxBlock(transactionsRaw, req.latestBlock); // add block height to transactions
  }
  // for subsequent pages, it is only possible to get blocks one by one using '/blocks/:height' endpoint
  if (page > 1) {
    // since '/transactions' only returns latest 10, the only way to get previous transactions is by going back through blocks one by one using '/blocks/:height' and extracting the transactions from there
    let latestBlock = req.latestBlock;
    const skipTxs = (page - 1) * 10; // skip 10 transaction per page - i.e. if we want page 3, we need to skip the first 20 transactions as they are for pages 1 and 2
    
    transactionsRaw = [];
    let skippedTxs = 0; // count how many txs have been skipped
    
    while (transactionsRaw.length < 10 && latestBlock > 0) {
      const block = await fetchXi('/blocks/' + latestBlock);
      block.transactions.forEach(tx => {
        if (skippedTxs >= skipTxs && transactionsRaw.length < 10) {
          // add block height to transactions
          transactionsRaw.push({...tx, block: block.height});
        } 
        skippedTxs++;
      })
      latestBlock--;
    }
  }

  // clean data so readable by by Table componenet in Vue app
  const transactionsClean = cleanListOfData(transactionsRaw);

  res.send(transactionsClean);
})


// get single transaction by hash 
transactionsRouter.get('/:hash', async (req, res) => {
  const txHash = req.params.hash;
  let latestBlock = req.latestBlock;
  
  // Since the xi api only allows you to request a single transaction if you also know the block height ('/blocks/:height/transactions/:hash'), there is no simple way to get a transaction from the hash alone. There is also no list of all transactions to search through. 
  //Solution: iterate through each block and search through the list of the block's transactions until a matching hash is found.
  // The search begins from the more recent block for performance purposes - the assumption being that it's more likely the user is searching something recent 
  let transactionRaw = null;
  while (!transactionRaw && latestBlock > 0) {
    const block = await fetchXi('/blocks/' + latestBlock);
    transactionRaw = block.transactions.find(tx => txHash === tx.hash)
    latestBlock--;
  }

  if (!transactionRaw) {
    res.status(400).send('transaction not found')
  }

  // set the block property of the transaction
  transactionRaw.block = latestBlock;

  // clean data so readable by by Table componenet in Vue app
  const transactionClean = cleanData(transactionRaw);

  res.send(transactionClean)
})



module.exports = transactionsRouter;
