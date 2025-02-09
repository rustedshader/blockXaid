import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable, ScrollView, Linking } from "react-native";
import '@walletconnect/react-native-compat';
import { createAppKit, defaultConfig, AppKit, AppKitButton, useAppKitAccount, useAppKitProvider } from '@reown/appkit-ethers-react-native';
import { contractABI } from "../contract/abi";
import { BrowserProvider, ethers } from 'ethers';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";


const projectId = '243737188910daa7caf8faea15727be1';

const metadata = {
  name: 'AppKit RN',
  description: 'AppKit RN Example',
  url: 'https://reown.com/appkit',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
  redirect: {
    native: 'expo://',
    universal: 'YOUR_APP_UNIVERSAL_LINK.com'
  }
};

const config = defaultConfig({ metadata })

const polygonAmoy = {
  chainId: 8002,
  name: 'Polygon Amoy',
  currency: 'POL',
  explorerUrl: 'https://amoy.polygonscan.com',
  rpcUrl: 'https://rpc-amoy.polygon.technology',
}

const chains = [polygonAmoy]

createAppKit({
  projectId,
  chains,
  config,
})


interface Order {
  id: number;
  created_at: string;
  accepted: boolean;
  accepted_at: string | null;
  seller_id: number;
  buyer_id: number;
  quantity: number;
  item_id: number;
  delivered: boolean;
  paid: boolean;
  paid_at: string | null;
  contract_address: string | null;
  cost: number;
}

export default function OrgPayOrders() {
  const [userId, setUserId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isConnected, address, chainId } = useAppKitAccount();
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const {walletProvider} = useAppKitProvider();
  const navigation: any = useNavigation();

  const getData = async () => {
    try {
      const id = await AsyncStorage.getItem('id');
      const type = await AsyncStorage.getItem('type');
      
      if (id && type === 'ORG') {
        setUserId(id);
      } else {
        Alert.alert('Error', 'You are not authorized to view this page');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard information');
    }
  };

  const getOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/get_confirmed_orders?buyer_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch orders');
    }
  };

  const doPayment = async (orderId: number, contract_address: string | null, orderAmount: number) => {
    if (!isConnected || !address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }
  
    if (!contract_address) {
      Alert.alert('Error', 'No contract address provided for this order');
      return;
    }
  
    setIsProcessing(true);
    try {
      if (!walletProvider) {
        throw new Error('Wallet provider is not initialized');
      }
  
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner(address);
      const contract = new ethers.Contract(contract_address, contractABI, signer);

      // Get current gas price
      const feeData = await provider.getFeeData();
      
      // Get current nonce
      const nonce = await provider.getTransactionCount(address);
      
      const amount = BigInt(orderAmount);

      // Prepare transaction with dynamic gas parameters
      const tx = await contract.depositAmount(amount, {
        nonce: nonce,
        gasLimit: 200000n,
        maxFeePerGas: feeData.maxFeePerGas || 2000000000n,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 2000000000n,
        type: 2, // EIP-1559 transaction
      });
  
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation with timeout
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout')), 60000)
        )
      ]);

      if (!receipt || receipt.status === 0) {
        throw new Error('Transaction failed or reverted');
      }
  
      console.log('Transaction confirmed:', receipt);
  
      setActiveOrderId(orderId);
      setTransactionHash(receipt.transactionHash);
  
      await handleSuccessfulPayment(orderId);
    } catch (error) {
      console.error('Payment Failed:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('JSON-RPC')) {
          errorMessage = 'Network error. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
};

  const handleSuccessfulPayment = async (orderId: number) => {
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/payment_confirmed?order_id=${orderId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      await getOrders();
      Alert.alert('Success', 'Payment completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark order as paid');
    }
  };


  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (userId) {
      getOrders();
    }
  }, [userId]);

  useEffect(() => {
    if (transactionHash) {
      const confirmPayment = async () => {
        try {
          await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/payment_confirmed?order_id=${activeOrderId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );
          await getOrders();
          Alert.alert('Success', 'Payment completed successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to mark order as paid');
        }
      };

      confirmPayment();
    }
  }, [transactionHash]);

  return (
    <View style={styles.container}>
        <View style={styles.header}>
        <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
            <Text style={styles.headerTitle}>Payment Orders</Text>
            <Text style={styles.headerSubtitle}>Manage your pending payments</Text>
        </View>

        <View style={styles.walletSection}>
      <AppKit />
      <AppKitButton balance="show" />
      {address && (
        <View style={styles.walletInfo}>
          <MaterialIcons name="account-balance-wallet" size={20} color="#00FF9D" />
          <Text style={styles.walletAddress}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </Text>
          {isConnected && (
            <View style={styles.connectionBadge}>
              <Text style={styles.connectionStatus}>Connected</Text>
            </View>
          )}
        </View>
      )}
    </View>

        <ScrollView style={styles.ordersList}>
            {orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="receipt-long" size={64} color="#333333" />
                    <Text style={styles.noOrders}>No orders found</Text>
                    <Text style={styles.emptyStateSubtext}>Your payment orders will appear here</Text>
                </View>
            ) : (
                orders.map((order: Order) => (
                    <View key={order.id} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>Order #{order.id}</Text>
                            <View style={[
                                styles.statusBadge,
                                order.paid ? styles.statusPaid : styles.statusPending
                            ]}>
                                <Text style={styles.statusText}>
                                    {order.paid ? 'Paid' : 'Unpaid'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.orderDetails}>
                            <View style={styles.detailRow}>
                                <MaterialIcons name="calendar-today" size={18} color="#00FF9D" />
                                <Text style={styles.orderDetail}>
                                    {new Date(order.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <MaterialIcons name="shopping-cart" size={18} color="#00FF9D" />
                                <Text style={styles.orderDetail}>Quantity: {order.quantity}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <MaterialIcons name="attach-money" size={18} color="#00FF9D" />
                                <Text style={styles.orderDetail}>{order.cost}</Text>
                            </View>
                        </View>

                        {!order.paid && (
                            <Pressable 
                                style={({pressed}) => [
                                    styles.payButton,
                                    isProcessing && styles.payButtonDisabled,
                                    pressed && styles.buttonPressed
                                ]}
                                onPress={() => doPayment(order.id, order.contract_address, order.cost)}
                                disabled={!isConnected || isProcessing}
                            >
                                <MaterialIcons 
                                    name={isProcessing ? "hourglass-empty" : "payment"} 
                                    size={20} 
                                    color="#121212" 
                                />
                                <Text style={styles.payButtonText}>
                                    {isProcessing ? 'Processing...' : 'Pay Now'}
                                </Text>
                            </Pressable>
                        )}
                        
                        {transactionHash && (
                            <View style={styles.hashContainer}>
                                <MaterialIcons name="receipt" size={16} color="#666666" />
                                <Pressable onPress={() => Linking.openURL(`https://amoy.polygonscan.com/tx/${transactionHash}`)} >
                                <Text style={styles.hash}>
                                    {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                                </Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                ))
            )}
        </ScrollView>
    </View>
)};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#121212',
    },
    header: {
        padding: 24,
        paddingBottom: 16,
    },
    backButton: {
      position: 'absolute',
      left: 24,
      top: 24,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#1E1E1E',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
  },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#00FF9D',
    },
    walletSection: {
        padding: 16,
        backgroundColor: '#1E1E1E',
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    walletInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    walletAddress: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    connectionBadge: {
        backgroundColor: '#00FF9D33',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    connectionStatus: {
        fontSize: 12,
        color: '#00FF9D',
    },
    ordersList: {
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    noOrders: {
        fontSize: 18,
        color: '#FFFFFF',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666666',
        marginTop: 8,
    },
    orderCard: {
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333333',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusPending: {
        backgroundColor: '#FF6B6B33',
    },
    statusPaid: {
        backgroundColor: '#00FF9D33',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    orderDetails: {
        gap: 8,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderDetail: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    payButton: {
        backgroundColor: '#00FF9D',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    payButtonDisabled: {
        backgroundColor: '#333333',
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    payButtonText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
    },
    hashContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        padding: 8,
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
    },
    hash: {
        fontSize: 12,
        color: '#666666',
    },
});