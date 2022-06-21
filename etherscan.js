import env from 'dotenv';
import fetch from 'node-fetch';

env.config();

const chain = 'eth';
const address = '0x8355DbC1bF959bbc2805Df0344c3958E3416eB84';

async function getEthNftTxs(address) {
  const url = `https://api.etherscan.io/api?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=${process.env.ETHERSCAN_KEY}`

  const response = await fetch(url, { method: 'get' });
  const ethNftTxs = await response.json();

  console.log(ethNftTxs);
}

getEthNftTxs(address);