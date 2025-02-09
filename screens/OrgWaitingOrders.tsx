import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View , Text, ScrollView, Pressable , StyleSheet} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';



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


export default function OrgWatingOrders(){
    const [userId, setUserId] = useState<string>('');
    const [waitingOrders, setWaitingOrders] = useState<Order[]>([]);

    const getData = async() => {
        try {
            const id = await AsyncStorage.getItem('id');
            const type = await AsyncStorage.getItem('type');
            if (id && type === 'ORG'){
                setUserId(id);
            } else {
                alert('You are not authorized to view this page');
            }
        } catch (error) {
            alert('An error occurred during opening Dashboard');
        }
    }

    const get_waiting_orders = async () => {
        try {
            const response: Response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/get_wating_orders?buyer_id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: Order[] = await response.json();
            if (data){
                setWaitingOrders(data);
            }
        } catch (error) {
            alert('An error occurred during fetching orders');
        }
    }

    useEffect(
        () => {
            getData();
            if (userId) {
                get_waiting_orders();
            }
        }, [userId]
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Waiting Orders</Text>
                <Text style={styles.headerSubtitle}>Orders pending payment</Text>
            </View>
    
            {waitingOrders.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="hourglass-empty" size={64} color="#333333" />
                    <Text style={styles.emptyStateText}>No Waiting Orders</Text>
                    <Text style={styles.emptyStateSubtext}>Orders pending payment will appear here</Text>
                </View>
            ) : (
                <ScrollView style={styles.ordersList}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{waitingOrders.length}</Text>
                            <Text style={styles.statLabel}>Total Pending</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {waitingOrders.reduce((acc, curr) => acc + curr.cost, 0).toFixed(2)}
                            </Text>
                            <Text style={styles.statLabel}>Total ETH</Text>
                        </View>
                    </View>
    
                    {waitingOrders.map((order: Order) => (
                        <Pressable 
                            key={order.id}
                            style={({pressed}) => [
                                styles.orderCard,
                                pressed && styles.orderCardPressed
                            ]}
                        >
                            <View style={styles.orderHeader}>
                                <View>
                                    <Text style={styles.orderId}>Order #{order.id}</Text>
                                    <Text style={styles.orderDate}>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.costBadge}>
                                    <MaterialIcons name="attach-money" size={16} color="#00FF9D" />
                                    <Text style={styles.costText}>{order.cost} ETH</Text>
                                </View>
                            </View>
    
                            <View style={styles.orderDetails}>
                                <View style={styles.detailRow}>
                                    <MaterialIcons name="shopping-cart" size={20} color="#00FF9D" />
                                    <Text style={styles.detailLabel}>Quantity:</Text>
                                    <Text style={styles.detailValue}>{order.quantity} units</Text>
                                </View>
    
                                <View style={styles.detailRow}>
                                    <MaterialIcons name="inventory" size={20} color="#00FF9D" />
                                    <Text style={styles.detailLabel}>Item ID:</Text>
                                    <Text style={styles.detailValue}>#{order.item_id}</Text>
                                </View>
    
                                <View style={styles.statusContainer}>
                                    <View style={styles.statusItem}>
                                        <MaterialIcons 
                                            name={order.delivered ? "local-shipping" : "pending"} 
                                            size={20} 
                                            color={order.delivered ? "#00FF9D" : "#FFB84D"} 
                                        />
                                        <Text style={[
                                            styles.statusText,
                                            { color: order.delivered ? "#00FF9D" : "#FFB84D" }
                                        ]}>
                                            {order.delivered ? 'Delivered' : 'Pending Delivery'}
                                        </Text>
                                    </View>
    
                                    <View style={styles.statusItem}>
                                        <MaterialIcons 
                                            name={order.paid ? "check-circle" : "schedule"} 
                                            size={20} 
                                            color={order.paid ? "#00FF9D" : "#FF6B6B"} 
                                        />
                                        <Text style={[
                                            styles.statusText,
                                            { color: order.paid ? "#00FF9D" : "#FF6B6B" }
                                        ]}>
                                            {order.paid ? 'Paid' : 'Awaiting Payment'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>
    )};
    
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
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
    emptyState: {
        flex: 1,
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
    orderCard: {
        backgroundColor: '#1E1E1E',
        margin: 16,
        marginTop: 0,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333333',
        overflow: 'hidden',
    },
    orderCardPressed: {
        opacity: 0.9,
        transform: [{scale: 0.98}],
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
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
    orderDetails: {
        padding: 16,
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
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#2A2A2A',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
});