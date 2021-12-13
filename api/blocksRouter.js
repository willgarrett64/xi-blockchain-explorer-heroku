const express = require('express');
const {fetchXi} = require('../utils/fetchXiData');
const {cleanData, cleanListOfData} = require('../utils/cleanData');

const blocksRouter = express.Router();


// get list of all blocks (separated into pages of 10)
blocksRouter.get('/', async (req, res) => {
  const page = req.query.page;
  let blocksRaw; // will hold raw data from api
  
  // if no page query, request is for page 1
  // '/blocks' endpoint gets 10 most recent so no need to get blocks 1 by 1
  if (!page || page == 1) {
    blocksRaw = await fetchXi('/blocks');
    if (blocksRaw.error) {
      res.status(400).send(blocksRaw)
    } 
  } 
  // for subsequent pages, it is only possible to get blocks one by one using '/blocks/:height' endpoint
  if (page > 1) {
    const latestBlock = req.latestBlock;

    // if (pageNo > req.numberOfBlockPages) {
    //   res.status(400).send("page not found")
    // }
  
    // this refers to the first block height for the selected page - e.g. if the most recent block is 35, page 2 would start from block 25, and page 3 from block 15, etc
    const startingBlock = latestBlock - (10 * (page - 1));
  
    const promises = [];
    for (let i = startingBlock; i > startingBlock - 10 && i > 0; i--) {
      promises.push(fetchXi('/blocks/' + i));
    }
    blocksRaw = await Promise.all(promises);    
  }

  // add total number of transactions property
  blocksRaw.forEach((block, index, blocksRaw) => {
    blocksRaw[index].totalTxs = block.transactions.length;
    delete blocksRaw[index].transactions; //remove transactions as not needed
  });
  
  // clean data so readable by by Table componenet in Vue app
  const blocksClean = cleanListOfData(blocksRaw);

  res.send(blocksClean);
})


// get single block by height
blocksRouter.get('/:height', async (req, res) => {
  const page = req.query.page ? req.query.page : 1;
  const firstTx = (page - 1) * 10

  const height = req.params.height;
  
  const blockRaw = await fetchXi('/blocks/' + height);
  if (blockRaw.error) {
    res.status(400).send(blockRaw);
    return;
  } 

  // add total number of transactions
  blockRaw.totalTxs = blockRaw.transactions.length

  // add block height to each transaction
  let transactionsRaw = blockRaw.transactions.map((tx) => {
    return {...tx, block: blockRaw.height};
  })

  // clean data so readable by by Table componenet in Vue app
  const blockClean = cleanData(blockRaw);
  const transactionsClean = cleanListOfData(transactionsRaw);
  blockClean.transactions = transactionsClean.slice(firstTx, firstTx + 10);
  blockClean.txAll = transactionsClean // CURRENT WORKAROUND GETTING SUMMARY DATA

  res.send(blockClean)
})


module.exports = blocksRouter;
