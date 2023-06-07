import { Squid } from "@0xsquid/sdk";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const main = async () => {
  try {
    const sdk = new Squid({ baseUrl: process.env.baseUrl });

    await sdk.init();

    const provider = new ethers.providers.JsonRpcProvider(
      process.env.avalanceRpcEndPoint
    );
    const signer = new ethers.Wallet(
      process.env.privateKey as string,
      provider
    );

    const { route } = await sdk.getRoute({
      toAddress: signer.address,
      fromChain: 43114,
      fromToken: sdk.tokens.find(
        t => t.symbol.toLowerCase() == "usdc" && t.chainId === 43114
      )?.address as string,
      fromAmount: ethers.utils.parseUnits("0.1", 6).toString(),
      toChain: 137,
      toToken: sdk.tokens.find(
        t => t.symbol.toLowerCase() == "axlusdc" && t.chainId === 137
      )?.address as string,
      slippage: 99,
      prefer: ["OpenOcean"]
    });

    const tx = await sdk.executeRoute({
      signer,
      route
    });
    const txReceipt = await tx.wait();

    console.log("> txReceipt: ", txReceipt);

   
  } catch (error) {
    console.log(error);
  }
};

main();
