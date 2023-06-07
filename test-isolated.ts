import dotenv from "dotenv";
import { ethers } from "ethers";

import erc20abi from "./abis/erc20.json";
import wrcAbi from "./abis/wrcTokenAbi.json";

dotenv.config();

const usdc = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const wrc = "0x8559516e133aebd8a7d5616f9dafff2e55b291f9";
const amount = ethers.utils.parseUnits("0.1", 6);

const erc20interface = new ethers.utils.Interface(erc20abi);
const wrcInterface = new ethers.utils.Interface(wrcAbi);

const main = async () => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.polygonRpcEndPoint
    );
    const signer = new ethers.Wallet(
      process.env.privateKey as string,
      provider
    );

    const usdcInstance = new ethers.Contract(usdc, erc20abi, signer);

    const allowance = await usdcInstance.allowance(signer.address, wrc);

    if (!allowance.gte(amount)) {
      // this is one example of how to interact with contract
      // is the most simple way of doing it, but squid use encode data
      const approve = await usdcInstance.approve(wrc, amount, {
        gasPrice: 150000000000, // sometimes you need to set gas config i.e. polygon
        gasLimit: 800000
      });
  
      console.log("> approve: ", approve)
    }
    
    const depositData = wrcInterface.encodeFunctionData("deposit", [usdc, amount]);

    const tx = await signer.sendTransaction({
      to: wrc,
      data: depositData,
      gasLimit: 8000000,
      gasPrice: 150000000000,
    });

    console.log("> tx: ", await tx.wait());
   
  } catch (error) {
    console.log(error);
  }
};

main();
