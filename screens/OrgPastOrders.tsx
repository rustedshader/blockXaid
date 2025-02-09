import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    Alert,
    Pressable 
} from "react-native";

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

export default function OrgPastOrders() {
    const [userId, setUserId] = useState<string>('');
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
    const navigation: any = useNavigation();

    const getData = async() => {
        setIsLoading(true);
        try {
            const id = await AsyncStorage.getItem('id');
            const type = await AsyncStorage.getItem('type');
            if (id && type === 'ORG') {
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

    const getPastOrders = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/get_past_orders?buyer_id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: Order[] = await response.json();
            if (data) {
                setPastOrders(data.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ));
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while fetching orders');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (userId) {
            getPastOrders();
        }
    }, [userId]);

    const calculateTotalSpent = () => {
        return pastOrders.reduce((total, order) => total + order.cost, 0).toFixed(2);
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
            <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Past Orders</Text>
                <Text style={styles.headerSubtitle}>View your completed orders</Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00FF9D" />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : (
                <ScrollView style={styles.ordersList}>
                    {pastOrders.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="history" size={64} color="#333333" />
                            <Text style={styles.emptyStateText}>No past orders</Text>
                            <Text style={styles.emptyStateSubtext}>Completed orders will appear here</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{pastOrders.length}</Text>
                                    <Text style={styles.statLabel}>Total Orders</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{calculateTotalSpent()}</Text>
                                    <Text style={styles.statLabel}>Total Spent</Text>
                                </View>
                            </View>

                            {pastOrders.map((order: Order) => (
                                <Pressable 
                                    key={order.id}
                                    onPress={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                                    style={({pressed}) => [
                                        styles.orderCard,
                                        pressed && styles.orderCardPressed
                                    ]}
                                >
                                    <View style={styles.orderHeader}>
                                        <View>
                                            <Text style={styles.orderId}>Order #{order.id}</Text>
                                            <Text style={styles.orderDate}>
                                                Completed: {new Date(order.paid_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <View style={styles.costBadge}>
                                            <MaterialIcons name="attach-money" size={16} color="#00FF9D" />
                                            <Text style={styles.costText}>{order.cost}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.orderStats}>
                                        <View style={styles.statItem}>
                                            <MaterialIcons name="shopping-cart" size={20} color="#00FF9D" />
                                            <Text style={styles.statItemLabel}>Quantity</Text>
                                            <Text style={styles.statItemValue}>{order.quantity}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <MaterialIcons name="event" size={20} color="#00FF9D" />
                                            <Text style={styles.statItemLabel}>Order Date</Text>
                                            <Text style={styles.statItemValue}>
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>

                                    {selectedOrder === order.id && (
                                        <>
                                            {order.shipment_company_name && (
                                                <View style={styles.shipmentInfo}>
                                                    <Text style={styles.shipmentInfoTitle}>Shipment Details</Text>
                                                    <View style={styles.shipmentInfoRow}>
                                                        <MaterialIcons name="local-shipping" size={16} color="#666666" />
                                                        <Text style={styles.shipmentInfoLabel}>Company:</Text>
                                                        <Text style={styles.shipmentInfoValue}>{order.shipment_company_name}</Text>
                                                    </View>
                                                    <View style={styles.shipmentInfoRow}>
                                                        <MaterialIcons name="confirmation-number" size={16} color="#666666" />
                                                        <Text style={styles.shipmentInfoLabel}>Tracking ID:</Text>
                                                        <Text style={styles.shipmentInfoValue}>{order.tracking_id}</Text>
                                                    </View>
                                                    <View style={styles.shipmentInfoRow}>
                                                        <MaterialIcons name="phone" size={16} color="#666666" />
                                                        <Text style={styles.shipmentInfoLabel}>Contact:</Text>
                                                        <Text style={styles.shipmentInfoValue}>{order.shipment_company_contact}</Text>
                                                    </View>
                                                </View>
                                            )}

                                            <View style={styles.contractContainer}>
                                                <MaterialIcons name="token" size={18} color="#666666" />
                                                <Text style={styles.contractAddress}>
                                                    {`${order.contract_address.substring(0, 6)}...${order.contract_address.substring(order.contract_address.length - 4)}`}
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </Pressable>
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
    orderCardPressed: {
        opacity: 0.9,
        transform: [{scale: 0.98}],
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
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00FF9D22',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    costText: {
        color: '#00FF9D',
        fontSize: 14,
        fontWeight: 'bold',
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
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 2,
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
        width: 70,
    },
    shipmentInfoValue: {
        fontSize: 12,
        color: '#FFFFFF',
        flex: 1,
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
});