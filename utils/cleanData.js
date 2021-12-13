//convert unix timestamp into an object with date and time in formats dd/mm/yyyy and hh:mm, and when which is minutes since.
const convertTimestamp = (timestamp) => {
  //for adding leading zeros
  const addZero = (num) => num.toString().padStart(2, '0');

  // get date and time of timestamp
  const fullDate = new Date(timestamp);
  const date = addZero(fullDate.getDate()) + '/' + addZero((fullDate.getMonth() + 1)) + '/' + fullDate.getFullYear();
  const time = addZero(fullDate.getHours()) + ':' + addZero(fullDate.getMinutes());

  // get minutes since timestamp
  const now = Date.now();
  const diff = Math.ceil((now - timestamp) / (1000 * 60));
  const when = diff + ' minute' + (diff > 1 ? 's' : '') + ' ago';

  return {date, time, when}
} 

/* 
Whilst there is no need to remove any of the data from the XI api before sending to the frontend, the data will be reformatted so it's readable by the reusable Table component in the Vue app. 
Every key:value pair will be reformatted in the following format
  {
    a: 1, 
    b: 2, 
    c: 3
  } 
  =>
  {
    a: {data: 1, to:"/route..."}, 
    b: {data: 2, to:"/route..."}, 
    c: {data: 3, to: null}
  }
  (where "to" will represent a link for vueRouter so users can easily navigate between data - it will be null if no link is required)
 */

// convert a single data object
const cleanData = (rawData) => {
  let tableData = {}

  // parse original data and add a "to" property
  for (const key in rawData) {
    tableData[key] = {
      data: rawData[key],
      to: addLink(rawData, key)
    }
  }

  // add date, time and when (minutes since)
  if (rawData.timestamp) {
    const convertedDate = convertTimestamp(rawData.timestamp);
    tableData.date = {data: convertedDate.date};
    tableData.time = {data: convertedDate.time};
    tableData.when = {data: convertedDate.when}
  }
  
  // both blocks and transactions have a unique "hash" which can be used as a key, however wallets have a unique "address"
  tableData.key = rawData.hash ? rawData.hash : rawData.address

  return tableData;
}

// convert an array of data objects
const cleanListOfData = (rawData) => {
  return rawData.map(item => cleanData(item));
  
}

// add "to" property to certain data properties - this will act as the link for vueRouter
const addLink = (data, key) => {
  switch (key) {
    // links to wallets
    case 'to': 
    case 'from': 
    case 'miner': 
    case 'address': 
      return `/wallets/${data[key]}`;
    // links to blocks
    case 'height': 
    case 'block':
      return `/blocks/${data[key]}`;
    // also link to block - parent hash refers to the parent block (which is always the previous one to the current block)
    case 'parentHash': 
      return `/blocks/${data.height - 1}`;
    // both blocks and transactions have a "hash" key
    // to distinguish between them, only blocks have a height property, and only txs have a signature property 
    case 'hash':
      if (data.height) {
        return `/blocks/${data.height}`;
      } else if (data.signature) {
        return `/transactions/${data[key]}`;
      }        
      break;
    // all other data will not have a link
    default:
      break;
  }
}
  
  
  module.exports = {
    cleanData,
    cleanListOfData
  }