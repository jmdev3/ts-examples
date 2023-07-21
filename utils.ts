import { ethers } from "ethers";
import { Assets, Asset, Chain, chainContractIds, assetContractIds } from "@chainflip/sdk/swap";
import * as dotenv from "dotenv";

import vaultAbi from "./chainflipVault.json";
import erc20Abi from "./erc20.json";
import { ContractCall, SquidCallType } from "@0xsquid/sdk";

dotenv.config();

const vaultAddress = "0xAfD0C34E6d25F707d931F8b7EE9cf0Ff52160A46";
const vaultContract = new ethers.utils.Interface(vaultAbi);
const erc20Interface = new ethers.utils.Interface(erc20Abi);

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

export const generateApprovalCall = (params: Params): ContractCall => {
    const tokenAddress = tokenAddresses[params.srcAsset];
   
    return {
      callType: SquidCallType.FULL_TOKEN_BALANCE,
      target: tokenAddress,
      value: "0",
      callData: erc20Interface.encodeFunctionData("approve", [vaultAddress, 0]),
      payload: {
        tokenAddress: tokenAddress,
        inputPos: 1
      },
      estimatedGas: "40000"
    }
  };
  
  export const generateChainFlipCall = (params: Params): ContractCall => {
    const tokenAddress = tokenAddresses[params.srcAsset];
  
    let callData;
    let callType;
    let payload;
    let estimatedGas;
  
    if (isNativeSwap(params)) {
      callData = vaultContract.encodeFunctionData("xSwapNative", [
        chainContractIds[params.destChain],
        stringToHex(params.destAddress),
        assetContractIds[params.destAsset],
        []
      ]);
      callType = SquidCallType.FULL_NATIVE_BALANCE;
      payload = {
        tokenAddress: tokenAddress,
        inputPos: 4
      }
      estimatedGas = "40000"
    } else {
      callData = vaultContract.encodeFunctionData("xSwapToken", [
        chainContractIds[params.destChain],
        stringToHex(params.destAddress),
        assetContractIds[params.destAsset],
        tokenAddress,
        params.amount,
        []
      ]);
      callType = SquidCallType.FULL_TOKEN_BALANCE;
      payload = {
        tokenAddress: tokenAddress,
        inputPos: 4
      }
      estimatedGas = "90000"
    }
  
    return {
      callType,
      target: vaultAddress,
      value: "0",
      callData,
      payload,
      estimatedGas
    }
  }
  