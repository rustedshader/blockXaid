import { http } from "viem";
import { createConfig } from "@wagmi/core";
import { polygonAmoy } from "viem/chains";

export const config = createConfig({
    chains: [polygonAmoy],
    transports: {
        [polygonAmoy.id]: http(),
    }
})