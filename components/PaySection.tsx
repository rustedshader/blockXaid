// import { useContractWrite } from "wagmi";
// import { contractABI } from "../contract/abi";


// export default function PaySection(orderAmount: number,contractAddress: string) {
//     const {
//         data: contractName,
//         isError,
//         isLoading,
//         isSuccess,
//     } = useContractRead({
//         address: `0x${contractAddress}`,
//         abi: contractABI,
//         functionName: 'buyer',
//     });

//     const {config} =  useContractWrite({
//         address: `0x${contractAddress}`,
//         abi: contractABI,
//         functionName: 'depositAmount',
//         args: [orderAmount]
//     })
// }