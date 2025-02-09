import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    Pressable, 
    Alert,
    ActivityIndicator, 
    SafeAreaView,
    Linking
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { AppKit, AppKitButton, createAppKit, defaultConfig, useAppKitAccount, useAppKitProvider } from "@reown/appkit-ethers-react-native";
import { BrowserProvider, ethers } from "ethers";
import { contractABI } from "../contract/abi";
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
    accepted_at: string;
    seller_id: number;
    buyer_id: number;
    quantity: number;
    item_id: number;
    delivered: boolean;
    paid: boolean;
    paid_at: string;
    contract_address: string;
    cost: number,
    rejected: boolean | null ,
    tracking_id: number | null,
    shipment_company_name: string | null,
    shipment_company_contact: string | null,
    shipment_expected_date: string | null,
    shipped: boolean | null,
    received: boolean | null
}

export default function SellerActiveOrder() {
    const navigation: any = useNavigation();
    const [userId, setUserId] = useState<string>('');
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const { walletProvider } = useAppKitProvider();
    const { isConnected, address, chainId } = useAppKitAccount();

    const getData = async() => {
        setIsLoading(true);
        try {
            const id = await AsyncStorage.getItem('id');
            const type = await AsyncStorage.getItem('type');
            if (id && type === 'SELLER') {
                setUserId(id);
            } else {
                Alert.alert('Error', 'You are not authorized to view this page');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while loading data');
        } finally {
            setIsLoading(false);
        }
    }

    const getAcceptedOrders = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/get_accepted_orders?seller_id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: Order[] = await response.json();
            if (data) {
                setActiveOrders(data);
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while fetching orders');
        } finally {
            setIsLoading(false);
        }
    }

    const setOrderDelivered = async (contract_address: string, orderId: number) => {
        if (!isConnected || !address) {
            Alert.alert('Error', 'Please connect your wallet first');
            return;
        }

        if (!contract_address) {
            Alert.alert('Error', 'No contract address provided for this order');
            return;
        }

        if (isProcessing === orderId) return;

        Alert.alert(
            "Confirm Delivery",
            "Are you sure you want to confirm delivery? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Confirm",
                    onPress: async () => {
                        setIsProcessing(orderId);
                        try {
                            if (!walletProvider) {
                                throw new Error('Wallet provider is not initialized');
                            }

                            const provider = new BrowserProvider(walletProvider);
                            const signer = await provider.getSigner(address);
                            const contract = new ethers.Contract(contract_address, contractABI, signer);

                            const feeData = await provider.getFeeData();
                            const nonce = await provider.getTransactionCount(address);

                            const tx = await contract.deliveryConfirmed({
                                nonce: nonce,
                                gasLimit: 200000n,
                                maxFeePerGas: feeData.maxFeePerGas || 2000000000n,
                                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 2000000000n,
                                type: 2,
                            });

                            console.log('Transaction sent:', tx.hash);

                            const receipt = await Promise.race([
                                tx.wait(),
                                new Promise((_, reject) => 
                                    setTimeout(() => reject(new Error('Transaction timeout')), 60000)
                                )
                            ]);

                            if (!receipt || receipt.status === 0) {
                                throw new Error('Transaction failed or reverted');
                            }

                            const response = await fetch(
                                `${process.env.EXPO_PUBLIC_API_URL}/order_delivered?order_id=${orderId}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                }
                            );
                            const data = await response.json();
                            
                            if (data) {
                                Alert.alert('Success', 'Delivery confirmed successfully');
                                getAcceptedOrders();
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert(
                                'Error',
                                error instanceof Error ? error.message : 'An error occurred during delivery confirmation'
                            );
                        } finally {
                            setIsProcessing(null);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (userId) {
            getAcceptedOrders();
        }
    }, [userId]);

    return (
        <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Active Orders</Text>
                <Text style={styles.headerSubtitle}>Track your ongoing orders</Text>
                <AppKit/>
                <AppKitButton/>
            </View>
    
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00FF9D" />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : (
                <ScrollView style={styles.ordersList}>
                    {activeOrders.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="local-shipping" size={64} color="#333333" />
                            <Text style={styles.emptyStateText}>No active orders</Text>
                            <Text style={styles.emptyStateSubtext}>Your ongoing orders will appear here</Text>
                        </View>
                    ) : (
                        activeOrders.map((order: Order) => (
                            <View key={order.id} style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.orderId}>Order #{order.id}</Text>
                                        <Text style={styles.orderDate}>
                                            Created: {new Date(order.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <MaterialIcons name="local-shipping" size={16} color="#00FF9D" />
                                        <Text style={styles.statusText}>Active</Text>
                                    </View>
                                </View>
    
                                <View style={styles.orderTimeline}>
                                    <View style={styles.timelineItem}>
                                        <MaterialIcons name="check-circle" size={20} color="#00FF9D" />
                                        <View style={styles.timelineContent}>
                                            <Text style={styles.timelineTitle}>Order Accepted</Text>
                                            <Text style={styles.timelineDate}>
                                                {new Date(order.accepted_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
    
                                    <View style={styles.timelineItem}>
                                        <MaterialIcons 
                                            name={order.paid ? "check-circle" : "pending"} 
                                            size={20} 
                                            color={order.paid ? "#00FF9D" : "#666666"} 
                                        />
                                        <View style={styles.timelineContent}>
                                            <Text style={styles.timelineTitle}>Payment Status</Text>
                                            <Text style={[
                                                styles.timelineDate,
                                                { color: order.paid ? "#00FF9D" : "#666666" }
                                            ]}>
                                                {order.paid ? `Paid on ${new Date(order.paid_at).toLocaleDateString()}` : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>
    
                                    <View style={styles.timelineItem}>
                                        <MaterialIcons 
                                            name={order.delivered ? "check-circle" : "local-shipping"} 
                                            size={20} 
                                            color={order.delivered ? "#00FF9D" : "#666666"} 
                                        />
                                        <View style={styles.timelineContent}>
                                            <Text style={styles.timelineTitle}>Delivery Status</Text>
                                            <Text style={[
                                                styles.timelineDate,
                                                { color: order.delivered ? "#00FF9D" : "#666666" }
                                            ]}>
                                                {order.paid ? (order.delivered ? 'Delivered' : 'In transit') : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
    
                                <View style={styles.orderDetails}>
                                    <View style={styles.detailRow}>
                                        <MaterialIcons name="shopping-cart" size={18} color="#00FF9D" />
                                        <Text style={styles.detailLabel}>Quantity:</Text>
                                        <Text style={styles.detailValue}>{order.quantity} units</Text>
                                    </View>
    
                                    <View style={styles.detailRow}>
                                        <MaterialIcons name="person" size={18} color="#00FF9D" />
                                        <Text style={styles.detailLabel}>Buyer ID:</Text>
                                        <Text style={styles.detailValue}>{order.buyer_id}</Text>
                                    </View>
    
                                    {!order.delivered && (
                                        <>
                                        {!order.shipped && (
                                            <View style={styles.deliverySection}>
                                                <Pressable 
                                                    style={({pressed}) => [
                                                        styles.shipmentButton,
                                                        pressed && styles.buttonPressed
                                                    ]}
                                                    onPress={() => navigation.navigate('SellerShipmentOrder', { order_id: order.id })}
                                                >
                                                    <MaterialIcons name="local-shipping" size={20} color="#121212" />
                                                    <Text style={styles.shipmentButtonText}>Set Shipment Details</Text>
                                                </Pressable>
                                            </View>
                                        )}
    
                                            {order.paid && order.shipped && (
                                                <View style={styles.deliverySection}>
                                                    <Pressable 
                                                        style={({pressed}) => [
                                                            styles.deliveryButton,
                                                            pressed && styles.buttonPressed,
                                                            isProcessing === order.id && styles.buttonDisabled
                                                        ]}
                                                        onPress={() => setOrderDelivered(order.contract_address, order.id)}
                                                        disabled={isProcessing === order.id}
                                                    >
                                                        {isProcessing === order.id ? (
                                                            <ActivityIndicator color="#121212" size="small" />
                                                        ) : (
                                                            <>
                                                                <MaterialIcons name="check-circle" size={20} color="#121212" />
                                                                <Text style={styles.deliveryButtonText}>Confirm Delivery</Text>
                                                            </>
                                                        )}
                                                    </Pressable>
                                                </View>
                                            )}
                                        </>
                                    )}
    
                                    <View style={styles.contractAddress}>
                                        <MaterialIcons name="token" size={18} color="#00FF9D" />
                                        <Text style={styles.contractLabel}>Contract Address:</Text>
                                        <Pressable onPress={() => Linking.openURL(`https://amoy.polygonscan.com/address/${order.contract_address}`)}>
                                        <Text style={styles.contractValue}>
                                            {`${order.contract_address.substring(0, 6)}...${order.contract_address.substring(order.contract_address.length - 4)}`}
                                        </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </ScrollView>
        </SafeAreaView>
    );
    }
    
    const styles = StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: '#121212',
        },
        container: {
            flex: 1,
            backgroundColor: '#121212',
        },
        header: {
            position: 'relative',
            padding: 24,
            paddingTop: 100, // Increased padding to lower the header
            paddingBottom: 16,
        },
        backButton: {
            position: 'absolute',
            left: 24,
            top: 100, // Adjusted to match header padding
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#1E1E1E',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            color: '#FFFFFF',
            marginTop: 16,
            fontSize: 16,
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
        ordersList: {
            padding: 16,
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
        },
        emptyStateText: {
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
            alignItems: 'flex-start',
            marginBottom: 16,
        },
        orderId: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#FFFFFF',
        },
        orderDate: {
            fontSize: 14,
            color: '#666666',
            marginTop: 4,
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: '#00FF9D33',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
        },
        statusText: {
            color: '#00FF9D',
            fontSize: 12,
            fontWeight: 'bold',
        },
        orderTimeline: {
            backgroundColor: '#2A2A2A',
            padding: 16,
            borderRadius: 8,
            gap: 16,
            marginBottom: 16,
        },
        timelineItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        timelineContent: {
            flex: 1,
        },
        timelineTitle: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '500',
        },
        timelineDate: {
            fontSize: 12,
            color: '#666666',
            marginTop: 2,
        },
        orderDetails: {
            gap: 12,
        },
        detailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        detailLabel: {
            color: '#666666',
            fontSize: 14,
            flex: 1,
        },
        detailValue: {
            color: '#FFFFFF',
            fontSize: 14,
            flex: 2,
        },
        deliverySection: {
            backgroundColor: '#2A2A2A',
            padding: 16,
            borderRadius: 12,
            marginVertical: 12,
        },
        shipmentButton: {
            backgroundColor: '#00FF9D',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            borderRadius: 8,
            gap: 8,
        },
        shipmentButtonText: {
            color: '#121212',
            fontSize: 16,
            fontWeight: 'bold',
        },
        deliveryButton: {
            backgroundColor: '#00FF9D',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            borderRadius: 8,
            gap: 8,
        },
        buttonPressed: {
            opacity: 0.8,
            transform: [{scale: 0.98}],
        },
        buttonDisabled: {
            opacity: 0.5,
            backgroundColor: '#666666',
        },
        deliveryButtonText: {
            color: '#121212',
            fontSize: 14,
            fontWeight: 'bold',
        },
        contractAddress: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#2A2A2A',
            padding: 12,
            borderRadius: 8,
        },
        contractLabel: {
            color: '#666666',
            fontSize: 14,
        },
        contractValue: {
            color: '#00FF9D',
            fontSize: 14,
            fontWeight: '500',
        },
    });