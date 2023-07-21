import { SwapSDK } from '@chainflip/sdk/swap';

const options = {
  network: 'partnernet' as any,
};

const swapSDK = new SwapSDK(options);


(async () => {
    try {
        const status = await swapSDK.getStatus({ id: "0x9b10285f73bb2a86197d1723d826788b8d3a8b4cd6ad464f589447952b0254b7" })

        console.log("status: ", status)
    } catch (error) {
        console.log("error: ", error)
    }
})()