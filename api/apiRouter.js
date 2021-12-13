const express = require('express');
const apiRouter = express.Router();


const blocksRouter = require('./blocksRouter.js');
apiRouter.use('/blocks', blocksRouter);

const transactionsRouter = require('./transactionsRouter.js');
apiRouter.use('/transactions', transactionsRouter);

const walletsRouter = require('./walletsRouter.js');
apiRouter.use('/wallets', walletsRouter);

module.exports = apiRouter;
