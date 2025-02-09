import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from "react-native";
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
    cost: number;
    rejected: boolean | null;
    tracking_id: number | null;
    shipment_company_name: string | null;
    shipment_company_contact: string | null;
    shipment_expected_date: string | null;
    shipped: boolean | null;
    received: boolean | null;
}

export default function OrgActiveOrders() {
    const [userId, setUserId] = useState<string>('');
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const { walletProvider } = useAppKitProvider();
    const { isConnected, address, chainId } = useAppKitAccount();
    const navigation: any = useNavigation();

    const getData = async() => {
        setIsLoading(true);
        try {
            const id = await AsyncStorage.getItem('id');
            const type = await AsyncStorage.getItem('type');
            if (id && type === 'ORG'){
                setUserId(id);
            } else {
                Alert.alert('Error', 'You are not authorized to view this page');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while loading data');
        } finally {
            setIsLoading(false);
        }
    }

    const getActiveOrdersPaymentConfirmed = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/get_active_orders_payment_confirmed?buyer_id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: Order[] = await response.json();
            if (data){
                setActiveOrders(data);
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while fetching orders');
        } finally {
            setIsLoading(false);
        }
    }

    const checkSuspeciousActivity = async (orderId: number) => {  
        try {
            const response: Response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/check_suspecious_transactions?order_id=${orderId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: any = await response.json();
            console.log(data)
            if (data.length === 0 ) {
                alert('No suspecious activity detected');
            } else {
                alert('Suspecious activity detected');
            }
        } catch (error) {
            alert('An error occurred during checking suspecious activity');
        }
    }

    const updateSellerBalance = async (sellerId: number, conntract_address: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/add_pseudo_balance?seller_id=${sellerId}?contract_address=${conntract_address}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: Order[] = await response.json();
            if (data){
                setActiveOrders(data);
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while fetching orders');
        } finally {
            setIsLoading(false);
        }
    }

    const setOrderReceived = async (contract_address: string, orderId: number) => {
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
            "Confirm Order Received",
            "Are you sure you want to confirm shippment of this order? This action cannot be undone.",
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
                                `${process.env.EXPO_PUBLIC_API_URL}/received_shipment?order_id=${orderId}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                }
                            );
                            const data: Order = await response.json();
                            
                            if (data) {
                                Alert.alert('Success', 'Receipt confirmed successfully');
                                getActiveOrdersPaymentConfirmed();
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert(
                                'Error',
                                error instanceof Error ? error.message : 'An error occurred during confirmation'
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
            getActiveOrdersPaymentConfirmed();
        }
    }, [userId]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
            <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Active Orders</Text>
                <Text style={styles.headerSubtitle}>Monitor your current orders</Text>
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
                        <>
                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{activeOrders.length}</Text>
                                    <Text style={styles.statLabel}>Active</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>
                                        {activeOrders.filter(order => order.delivered).length}
                                    </Text>
                                    <Text style={styles.statLabel}>Delivered</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>
                                        {activeOrders.filter(order => order.received).length}
                                    </Text>
                                    <Text style={styles.statLabel}>Received</Text>
                                </View>
                            </View>

                            {activeOrders.map((order: Order) => (
                                <View key={order.id} style={styles.orderCard}>
                                    <View style={styles.orderHeader}>
                                        <View>
                                            <Text style={styles.orderId}>Order #{order.id}</Text>
                                            <Text style={styles.orderDate}>
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <View style={styles.orderStatus}>
                                            <MaterialIcons 
                                                name={order.received ? "check-circle" : order.delivered ? "local-shipping" : "pending"} 
                                                size={24} 
                                                color={order.received ? "#00FF9D" : order.delivered ? "#FFB84D" : "#666666"} 
                                            />
                                        </View>
                                    </View>
                                    <View>
                                        <Pressable 
                                            style={styles.statusRow}
                                            onPress={() => checkSuspeciousActivity(order.id)}
                                        >
                                            <View style={styles.statusItem}>
                                                <MaterialIcons name="security" size={18} color="#00FF9D" />
                                                <Text style={styles.statusText}>Check Suspecious Activity</Text>
                                            </View>
                                            <MaterialIcons name="chevron-right" size={24} color="#666666" />
                                        </Pressable>
                                    </View>
                                    
                                    <View>
                                    {order.shipment_company_name && (
                                        <View style={styles.shipmentInfo}>
                                            <Text style={styles.shipmentInfoTitle}>
                                                {order.delivered ? 'Delivered' : order.shipped ? 'In Transit' : 'Processing'}
                                            </Text>
                                            <View style={styles.shipmentInfoRow}>
                                                <MaterialIcons name="local-shipping" size={16} color="#666666" />
                                                <Text style={styles.shipmentInfoLabel}>Carrier:</Text>
                                                <Text style={styles.shipmentInfoValue}>{order.shipment_company_name}</Text>
                                            </View>
                                            {order.tracking_id && (
                                                <View style={styles.shipmentInfoRow}>
                                                    <MaterialIcons name="track-changes" size={16} color="#666666" />
                                                    <Text style={styles.shipmentInfoLabel}>Tracking ID:</Text>
                                                    <Text style={styles.shipmentInfoValue}>#{order.tracking_id}</Text>
                                                </View>
                                            )}
                                            {order.shipment_expected_date && (
                                                <View style={styles.shipmentInfoRow}>
                                                    <MaterialIcons name="event" size={16} color="#666666" />
                                                    <Text style={styles.shipmentInfoLabel}>Expected:</Text>
                                                    <Text style={styles.shipmentInfoValue}>
                                                        {new Date(order.shipment_expected_date).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}</View>

                                    <View style={styles.orderStats}>
                                        <View style={styles.statItem}>
                                            <MaterialIcons name="shopping-cart" size={20} color="#00FF9D" />
                                            <Text style={styles.statItemLabel}>Quantity</Text>
                                            <Text style={styles.statItemValue}>{order.quantity}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <MaterialIcons name="attach-money" size={20} color="#00FF9D" />
                                            <Text style={styles.statItemLabel}>Cost</Text>
                                            <Text style={styles.statItemValue}>{order.cost}</Text>
                                        </View>
                                    </View>

                                    {order.delivered && !order.received && (
                                        <View style={styles.deliverySection}>
                                            <Pressable 
                                                style={({pressed}) => [
                                                    styles.confirmButton,
                                                    pressed && styles.buttonPressed,
                                                    isProcessing === order.id && styles.buttonDisabled
                                                ]}
                                                onPress={() => setOrderReceived(order.contract_address, order.id)}
                                                disabled={isProcessing === order.id}
                                            >
                                                {isProcessing === order.id ? (
                                                    <ActivityIndicator color="#121212" size="small" />
                                                ) : (
                                                    <>
                                                        <MaterialIcons name="check-circle" size={20} color="#121212" />
                                                        <Text style={styles.confirmButtonText}>Confirm Receipt</Text>
                                                    </>
                                                )}
                                            </Pressable>
                                        </View>
                                    )}

                                    <View style={styles.contractContainer}>
                                        <MaterialIcons name="token" size={18} color="#666666" />
                                        <Pressable onPress={() => Linking.openURL(`https://amoy.polygonscan.com/address/${order.contract_address}`)}>
                                        <Text style={styles.contractAddress}>
                                            {`${order.contract_address.substring(0, 6)}...${order.contract_address.substring(order.contract_address.length - 4)}`}
                                        </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
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
    header: {
        padding: 24,
        paddingBottom: 16,
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
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
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
    statCard: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333333',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00FF9D',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    ordersList: {
        flex: 1,
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
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
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
    orderDate: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
    },
    orderStatus: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#2A2A2A',
    },
    orderStats: {
        flexDirection: 'row',
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statItemLabel: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
    },
    statItemValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 2,
    },
    deliverySection: {
        backgroundColor: '#2A2A2A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    confirmButton: {
        backgroundColor: '#00FF9D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
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
    confirmButtonText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
    },
    contractContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2A2A2A',
        padding: 12,
        borderRadius: 8,
    },
    contractAddress: {
        flex: 1,
        fontSize: 14,
        color: '#666666',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    shipmentInfo: {
        backgroundColor: '#2A2A2A',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    shipmentInfoTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    shipmentInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    shipmentInfoLabel: {
        fontSize: 12,
        color: '#666666',
    },
    shipmentInfoValue: {
        fontSize: 12,
        color: '#FFFFFF',
        flex: 1,
    },
});