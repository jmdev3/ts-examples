import { Squid } from "@0xsquid/sdk";
import { ethers, utils } from "ethers";

import * as dotenv from "dotenv";
import { Chains, Assets } from "@chainflip/sdk/swap";
import { generateApprovalCall, generateChainFlipCall, Params } from "./utils";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.bscTestnetRpc);
const signer = new ethers.Wallet(process.env.privateKey as string, provider);

const getSDK = (): Squid => {
  const squid = new Squid({
    baseUrl: "http://localhost:3000" // "https://testnet.api.0xsquid.com/"
  });
  return squid;
};

(async () => {
  try {
    const squid = getSDK();
    await squid.init();

    const isNative = process.argv[2] === "true";

    let params = {
      destChain: Chains.Bitcoin,
      destAsset: Assets.BTC,
      destAddress: "tb1quwh0te7vqw8sr37x7aut7hurtxfl7spztvu38k"
    } as Params;

    if (isNative) {
      params = {
        ...params,
        amount: ethers.utils.parseUnits("0.01", 18).toString(),
        srcChain: Chains.Ethereum,
        srcAsset: Assets.ETH,
      }
    } else {
      params = {
        ...params,
        amount: ethers.utils.parseUnits("0.01", 6).toString(),
        srcChain: Chains.Ethereum,
        srcAsset: Assets.USDC,
      }
    }

    const customContractCalls = [
      generateApprovalCall(params), generateChainFlipCall(params)
    ]

    const symbol = isNative ? "eth" : "usdc"

    const { route } = await squid.getRoute({
      toAddress: signer.address,
      fromChain: 97,
      fromToken: squid.tokens.find(
        t => t.symbol.toLowerCase() == "ausdc" && t.chainId === 97
      )?.address as string,
      fromAmount: utils.parseUnits("0.01", 6).toString(),
      toChain: 5,
      toToken: squid.tokens.find(
        t => t.symbol.toLowerCase() == symbol && t.chainId === 5
      )?.address as string,
      slippage: 99,
      customContractCalls
    });

    console.log("> route: ", JSON.stringify(route, null, 4));

    // return;
    const tx = await squid.executeRoute({
      signer,
      route
    });
    const txReceipt = await tx.wait();

    console.log("> txReceipt: ", txReceipt);
  } catch (error: any) {
    console.error(error);
  }
})();
