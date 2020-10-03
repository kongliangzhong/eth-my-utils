import fs = require("fs");
import Web3 from "web3";
const PrivateKeyProvider = require("truffle-privatekey-provider");

export interface TxOpts {
  from?: string;
  gasPrice?: number;
  gasLimit?: number;
  nonce?: number;
}

export function newWeb3(privJsonFile: string, ethNodeUrl: string) {
  const secureConfig = JSON.parse(fs.readFileSync(privJsonFile, "ascii"));
  const provider = new PrivateKeyProvider(
    secureConfig.privKey,
    ethNodeUrl
  )
  const web3 = new Web3(provider);
  return web3;
}

export class Eth{

  private web3: Web3;
  private logEnabled: boolean;

  constructor(web3: Web3, logEnabled = true) {
    this.web3 = web3;
    this.logEnabled = logEnabled;
  }

  public async encodeCall(
    abiFile: string,
    contractAddress: string,
    methodName: string,
    ...params: any[]
  ) {
    const contract = new this.web3.eth.Contract(
      JSON.parse(fs.readFileSync(abiFile, "ascii")),
      contractAddress
    );

    const data = contract.methods[methodName](...params).encodeABI();
    this.consoleLog("encoded data:", data);
    return data;
  }

  public async call(
    abiFile: string,
    contractAddress: string,
    methodName: string,
    ...params: any[]
  ) {
    const contract = new this.web3.eth.Contract(
      JSON.parse(fs.readFileSync(abiFile, "ascii")),
      contractAddress
    );
    const result = await contract.methods[methodName](...params).call();
    this.consoleLog("result:", result);
    return result;
  }

  public async sendTx(
    abiFile: string,
    contractAddress: string,
    methodName: string,
    txOpt: TxOpts,
    ...params: any[]
  ) {
    const owner = (await this.web3.eth.getAccounts())[0];
    const sendOpt = {
      from: txOpt.from ? txOpt.from : owner,
      gasPrice: txOpt.gasPrice ? txOpt.gasPrice: 50e9,
      gasLimit: txOpt.gasLimit ? txOpt.gasLimit : 6700000,
      nonce: txOpt.nonce ? txOpt.nonce : undefined
    };
    this.consoleLog("sendOpt:", sendOpt);

    const contract = new this.web3.eth.Contract(
      JSON.parse(fs.readFileSync(abiFile, "ascii")),
      contractAddress
    );

    await contract.methods[methodName](...params).send(sendOpt);
    this.consoleLog("done.");
  }

  public async getEvents(
    abiFile: string,
    contractAddress: string,
    eventName: string,
    stepBack = 0
  ) {
    const contract = new this.web3.eth.Contract(
      JSON.parse(fs.readFileSync(abiFile, "ascii")),
      contractAddress
    );
    const blockNumber = await this.web3.eth.getBlockNumber();
    const events = await contract.getPastEvents(
      eventName,
      {
        fromBlock: blockNumber - stepBack,
        toBlock: blockNumber
      }
    );

    this.consoleLog("events:", events);
    return events;
  }

  private consoleLog(...args: any[]) {
    if (this.logEnabled) {
      console.log(args);
    }
  }

}
