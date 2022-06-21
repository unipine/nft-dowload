import env from "dotenv";
import fs from "fs";
import fetch from "node-fetch";
import { promisify } from "util";
import { randomUUID } from "crypto";

env.config();

const requestOptions = {
  method: 'GET',
  redirect: 'follow'
};

const alchemyUrl = 'https://eth-mainnet.alchemyapi.io/nft/v2';
const alchemyApiKey = 'demo'; // this is for demo, should use our own api_key
const baseURL = `${alchemyUrl}/${alchemyApiKey}`;
const ownerAddr = "0x8355DbC1bF959bbc2805Df0344c3958E3416eB84";

const writeFilePromise = promisify(fs.writeFile);

const checkSpam = (contractAddr) =>
  fetch(`${baseURL}/isSpamContract?contractAddress=${contractAddr}`, requestOptions)
    .then(response => response.json())
    .catch(error => console.error("> checkSpam:\n", error));

const downloadMedia = (contractAddr, url, fileName, ind) =>
  fetch(url, requestOptions)
    .then(response => response.arrayBuffer())
    .then(async (buf) => {
      try {
        await writeFilePromise(`img/${fileName}`, Buffer.from(buf));
        return ` #${ind} ${contractAddr} : success`;
      } catch {
        return ` #${ind} ${contractAddr} : failed`;
      }
    })
    .then(res => console.log(res));

const getMetadata = (contractAddr, tokenId, tokenType, ind) =>
  fetch(`${baseURL}/getNFTMetadata?contractAddress=${contractAddr}&tokenId=${tokenId}&tokenType=${tokenType}`, requestOptions)
    .then(response => response.json())
    .then(async (metadata) => {
      if (metadata.media[0].raw == "" || metadata.metadata.animation_url) {
        return console.log(` #${ind} ${contractAddr} : skip`);
      }

      try {
        let url = metadata.media[0].gateway || metadata.metadata.image;

        if (url.indexOf("api.opensea") > 0) {
          url = metadata.media[0].raw;
        }

        await downloadMedia(
          contractAddr,
          url.replace("ipfs://", "https://ipfs.io/ipfs/"),
          `${randomUUID()}.jpg`,
          ind
        );
      } catch {
        console.warn(` #${ind} ${contractAddr} : failed`);
      }
    })
    .catch(error => console.error("> getMetadata:\n", error));

const getNfts = (ownerAddr) =>
  fetch(`${baseURL}/getNFTs?owner=${ownerAddr}`, requestOptions)
    .then(response => response.json())
    .then(nfts => {
      nfts.ownedNfts.forEach(async (nft, ind) => {
        const isSpam = await checkSpam(nft.contract.address);

        if (isSpam) {
          console.log(` #${ind + 1} ${nft.contract.address} : spam`);
        } else {
          getMetadata(
            nft.contract.address,
            nft.id.tokenId,
            nft.id.tokenMetadata.tokenType,
            ind + 1
          );
        }
      })
    })
    .catch(error => console.error("> getNfts:\n", error));

getNfts(ownerAddr);