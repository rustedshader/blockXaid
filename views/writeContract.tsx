import React, {useState} from 'react';
import {View} from 'react-native';
import {Button} from '@reown/appkit-ui-react-native';

import {RequestModal} from '../components/RequestModal';

import {
  useAppKitAccount,
  useAppKitProvider,
} from '@reown/appkit-ethers-react-native';
import {BrowserProvider, Contract, JsonRpcSigner} from 'ethers';
import { contractABI } from '../contract/abi';

export function WriteContract(contractAddress: string) {
  const [requestModalVisible, setRequetsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<string | undefined>();
  const [error, setError] = useState(false);
  const {walletProvider} = useAppKitProvider();
  const {isConnected, address} = useAppKitAccount();

  const onPress = async () => {
    if (!isConnected || !walletProvider) {
      return;
    }

    setData(undefined);
    setError(false);
    setIsLoading(true);

    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = new JsonRpcSigner(ethersProvider, address!);
      const contract = new Contract(contractAddress, contractABI, signer);
      const response = await contract.approve(address, 100000);
      setData(response.toString());
    } catch (e) {
      console.log(e);
      setError(true);
    } finally {
      setIsLoading(false);
      setRequetsModalVisible(true);
    }
  };

  return isConnected ? (
    <View>
      <Button disabled={requestModalVisible || isLoading} onPress={onPress}>
        {isLoading ? 'Loading...' : 'Write contract'}
      </Button>

      <RequestModal
        isVisible={requestModalVisible}
        isLoading={isLoading}
        rpcResponse={data ? data : undefined}
        rpcError={error ? 'Error writing contract' : undefined}
        onClose={() => setRequetsModalVisible(false)}
      />
    </View>
  ) : null;
}