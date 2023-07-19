import { ethers } from "ethers";
import { Chains, Assets, Asset, Chain } from "@chainflip/sdk/swap";
import * as dotenv from "dotenv";

import vaultAbi from "./chainflipVault.json";
import erc20Abi from "./erc20.json";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.goerliRpc);
const signer = new ethers.Wallet(process.env.privateKey as string, provider);
const vaultAddress = "0xe781866455c5ef1f791975512f7e27814dc200e1";
const vaultContract = new ethers.utils.Interface(vaultAbi);

const assetContractIds: Record<Asset, number> = {
  [Assets.ETH]: 1,
  [Assets.FLIP]: 2,
  [Assets.USDC]: 3,
  [Assets.DOT]: 4,
  [Assets.BTC]: 5
};

const chainContractIds: Record<Chain, number> = {
  [Chains.Ethereum]: 1,
  [Chains.Polkadot]: 2,
  [Chains.Bitcoin]: 3
};

const tokenAddresses: Record<Asset, string> = {
  [Assets.USDC]: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
  [Assets.FLIP]: "0x7D18Ed38e962FA25f39109f4aC8FbC4C75a0475C",
  [Assets.BTC]: "",
  [Assets.DOT]: "",
  [Assets.ETH]: ""
};

type Params = {
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
    console.log(isNative)
    let params = {
      destChain: Chains.Bitcoin,
      destAsset: Assets.BTC,
      destAddress: "tb1qw2c3lxufxqe2x9s4rdzh65tpf4d7fssjgh8nv6"
    } as Params;

    if (isNative) {
      params = {
        ...params,
        amount: ethers.utils.parseUnits("0.01", 6).toString(),
        srcChain: Chains.Ethereum,
        srcAsset: Assets.USDC,
      }
    } else {
      params = {
        ...params,
        amount: ethers.utils.parseUnits("0.01", 18).toString(),
        srcChain: Chains.Ethereum,
        srcAsset: Assets.ETH,
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
