import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    Pressable, 
    StyleSheet, 
    ActivityIndicator,
    Alert 
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

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
}

export default function SellerAcceptOrder() {
    const navigation = useNavigation();
    const [userId, setUserId] = useState<string>('');
    const [notAcceptedOrders, setNotAcceptedOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    
    const getData = async() => {
        setIsLoading(true);
        try {
            const id = await AsyncStorage.getItem('id');
            const type = await AsyncStorage.getItem('type');
            if (id && type === 'SELLER'){
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

    const getUnacceptedOrders = async() => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/not_accepted_orders?seller_id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: Order[] = await response.json();
            if (data){
                setNotAcceptedOrders(data);
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while fetching orders');
        } finally {
            setIsLoading(false);
        }
    }

    const acceptOrder = async(orderId: number) => {
        if (isProcessing === orderId) return;
        
        setIsProcessing(orderId);
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/accept_order?order_id=${orderId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: Order = await response.json();
            if (data){
                Alert.alert('Success', 'Order accepted successfully');
                getUnacceptedOrders();
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while accepting the order');
        } finally {
            setIsProcessing(null);
        }
    }

    const rejectOrder = async(orderId: number) => {
        if (isProcessing === orderId) return;

        setIsProcessing(orderId);
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/reject_order?order_id=${orderId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: Order = await response.json();
            if (data){
                Alert.alert('Success', 'Order rejected successfully');
                getUnacceptedOrders();
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while rejecting the order');
        } finally {
            setIsProcessing(null);
        }
    }

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (userId) {
            getUnacceptedOrders();
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
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Pending Orders</Text>
                    <Text style={styles.headerSubtitle}>Review and accept new orders</Text>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00FF9D" />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : (
                <ScrollView style={styles.ordersList}>
                    {notAcceptedOrders.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="inbox" size={64} color="#333333" />
                            <Text style={styles.emptyStateText}>No pending orders</Text>
                            <Text style={styles.emptyStateSubtext}>New orders will appear here</Text>
                        </View>
                    ) : (
                        notAcceptedOrders.map((order: Order) => (
                            <View key={order.id} style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.orderId}>Order #{order.id}</Text>
                                        <Text style={styles.orderDate}>
                                            {new Date(order.created_at).toLocaleDateString()} at{' '}
                                            {new Date(order.created_at).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusText}>New Order</Text>
                                    </View>
                                </View>

                                <View style={styles.orderDetails}>
                                    <View style={styles.detailRow}>
                                        <MaterialIcons name="shopping-cart" size={20} color="#00FF9D" />
                                        <Text style={styles.detailLabel}>Quantity:</Text>
                                        <Text style={styles.detailValue}>{order.quantity} units</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <MaterialIcons name="person" size={20} color="#00FF9D" />
                                        <Text style={styles.detailLabel}>Buyer ID:</Text>
                                        <Text style={styles.detailValue}>{order.buyer_id}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <MaterialIcons name="inventory" size={20} color="#00FF9D" />
                                        <Text style={styles.detailLabel}>Item ID:</Text>
                                        <Text style={styles.detailValue}>{order.item_id}</Text>
                                    </View>

                                    <View style={styles.paymentStatus}>
                                        <MaterialIcons 
                                            name={order.paid ? "check-circle" : "pending"} 
                                            size={20} 
                                            color={order.paid ? "#00FF9D" : "#FF6B6B"} 
                                        />
                                        <Text style={[
                                            styles.paymentStatusText,
                                            { color: order.paid ? "#00FF9D" : "#FF6B6B" }
                                        ]}>
                                            {order.paid ? 'Payment Received' : 'Payment Pending'}
                                        </Text>
                                    </View>
                                </View>

                                <Pressable 
                                    style={({pressed}) => [
                                        styles.acceptButton,
                                        pressed && styles.buttonPressed,
                                        isProcessing === order.id && styles.buttonDisabled
                                    ]}
                                    onPress={() => acceptOrder(order.id)}
                                    disabled={isProcessing === order.id}
                                >
                                    {isProcessing === order.id ? (
                                        <ActivityIndicator color="#121212" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="check-circle" size={24} color="#121212" />
                                            <Text style={styles.acceptButtonText}>Accept Order</Text>
                                        </>
                                    )}
                                </Pressable>

                                <Pressable 
                                    style={({pressed}) => [
                                        styles.rejectButton,
                                        pressed && styles.buttonPressed,
                                        isProcessing === order.id && styles.buttonDisabled
                                    ]}
                                    onPress={() => rejectOrder(order.id)}
                                    disabled={isProcessing === order.id}
                                >
                                    {isProcessing === order.id ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="cancel" size={24} color="#FFFFFF" />
                                            <Text style={styles.rejectButtonText}>Reject Order</Text>
                                        </>
                                    )}
                                </Pressable>
                            </View>
                        ))
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
        position: 'relative',
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
    headerContent: {
        alignItems: 'center',
        paddingTop: 40,
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
    orderDetails: {
        backgroundColor: '#2A2A2A',
        padding: 16,
        borderRadius: 8,
        gap: 12,
        marginBottom: 16,
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
        fontWeight: '500',
        flex: 2,
    },
    paymentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#333333',
    },
    paymentStatusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    acceptButton: {
        backgroundColor: '#00FF9D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 8,
    },
    rejectButton: {
        backgroundColor: '#FF6B6B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    acceptButtonText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rejectButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});