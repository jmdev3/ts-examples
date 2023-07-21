import { ethers } from "ethers";
import { Chains, Assets, Asset, Chain, chainContractIds, assetContractIds } from "@chainflip/sdk/swap";
import * as dotenv from "dotenv";

import vaultAbi from "./chainflipVault.json";
import erc20Abi from "./erc20.json";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.goerliRpc);
const signer = new ethers.Wallet(process.env.privateKey as string, provider);
const vaultAddress = "0xAfD0C34E6d25F707d931F8b7EE9cf0Ff52160A46";
const vaultContract = new ethers.utils.Interface(vaultAbi);

const tokenAddresses: Record<Asset, string> = {
  [Assets.USDC]: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
  [Assets.FLIP]: "0x7D18Ed38e962FA25f39109f4aC8FbC4C75a0475C",
  [Assets.BTC]: "",
  [Assets.DOT]: "",
  [Assets.ETH]: ""
};

export type Params = {
  amount: string;
  srcChain: Chain;
  srcAsset: Asset;
  destChain: Chain;
  destAsset: Asset;
  destAddress: string;
};

const stringToHex = (s: string) => `0x${Buffer.from(s).toString("hex")}`;

const isNativeSwap = (params: Params) =>
  params.srcAsset != Assets.USDC && params.srcAsset != Assets.FLIP;

const swapToken = async (params: Params) => {
  const tokenAddress = tokenAddresses[params.srcAsset];

  const data = vaultContract.encodeFunctionData("xSwapToken", [
    chainContractIds[params.destChain],
    stringToHex(params.destAddress),
    assetContractIds[params.destAsset],
    tokenAddress,
    params.amount,
    []
  ]);

  const tx = await signer.sendTransaction({
    to: vaultAddress,
    data,
    gasLimit: 90000
  });

  console.log("> token, tx: ", await tx.wait());
};

const swapNative = async (params: Params) => {
  const data = vaultContract.encodeFunctionData("xSwapNative", [
    chainContractIds[params.destChain],
    stringToHex(params.destAddress),
    assetContractIds[params.destAsset],
    []
  ]);

  const tx = await signer.sendTransaction({
    to: vaultAddress,
    data,
    value: params.amount,
    gasLimit: 40000
  });

  console.log("> native, tx: ", await tx.wait());
};

const approveToken = async (params: Params) => {
  const tokenAddress = tokenAddresses[params.srcAsset];
  const contractInstance = new ethers.Contract(tokenAddress, erc20Abi, signer);

  return await contractInstance.approve(vaultAddress, params.amount);
};

(async () => {
  try {
    const isNative = process.argv[2] === "true";

    let params = {
      destChain: Chains.Bitcoin,
      destAsset: Assets.BTC,
      destAddress: "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF"
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
  
    if (isNativeSwap(params)) {
      await swapNative(params);
    } else {
      await approveToken(params);
      await swapToken(params);
    }
  } catch (error: any) {
    console.error("> error: ", JSON.stringify(error, null, 4));
  }
})();
