import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { FlatList, View ,Text, StyleSheet, Pressable } from "react-native";
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
    paid_at: string ;
}


export default function SellerPastOrders(){
    const [userId, setUserId] = useState<string>('');
    const [notAcceptedOrders, setNotAcceptedOrders] = useState<Order[]>([]);
    const navigation: any = useNavigation();
    
    const getData = async() => {
        try {
            const id = await AsyncStorage.getItem('id');
            const type = await AsyncStorage.getItem('type');
            if (id && type === 'SELLER'){
                setUserId(id);
            } else {
                alert('You are not authorized to view this page');
            }
        } catch (error) {
            alert('An error occurred during opening Dashboard');
        }
    }

    const getPastOrders = async() => {
        try {
            const response: Response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/get_seller_past_orders?seller_id=${userId}`,
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
            alert('An error occurred during fetching orders');
        }
    }

    useEffect(
        () => {
            getData();
            if (userId) {
                getPastOrders();
            }
        }
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
            <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Order History</Text>
                <Text style={styles.headerSubtitle}>View your completed orders</Text>
            </View>
    
            {notAcceptedOrders.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="history" size={64} color="#333333" />
                    <Text style={styles.emptyStateText}>No past orders</Text>
                    <Text style={styles.emptyStateSubtext}>Your completed orders will appear here</Text>
                </View>
            ) : (
                <>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{notAcceptedOrders.length}</Text>
                            <Text style={styles.statLabel}>Total Orders</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {notAcceptedOrders.filter(order => order.delivered).length}
                            </Text>
                            <Text style={styles.statLabel}>Delivered</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {notAcceptedOrders.filter(order => order.paid).length}
                            </Text>
                            <Text style={styles.statLabel}>Paid</Text>
                        </View>
                    </View>
    
                    <FlatList
                        data={notAcceptedOrders}
                        renderItem={({item}) => (
                            <View style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.orderId}>Order #{item.id}</Text>
                                        <Text style={styles.orderDate}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        item.delivered ? styles.completedBadge : styles.pendingBadge
                                    ]}>
                                        <MaterialIcons 
                                            name={item.delivered ? "check-circle" : "pending"} 
                                            size={16} 
                                            color={item.delivered ? "#00FF9D" : "#FFB84D"}
                                        />
                                        <Text style={[
                                            styles.statusText,
                                            item.delivered ? styles.completedText : styles.pendingText
                                        ]}>
                                            {item.delivered ? 'Completed' : 'In Progress'}
                                        </Text>
                                    </View>
                                </View>
    
                                <View style={styles.orderDetails}>
                                    <View style={styles.detailRow}>
                                        <MaterialIcons name="shopping-cart" size={18} color="#00FF9D" />
                                        <Text style={styles.detailLabel}>Quantity:</Text>
                                        <Text style={styles.detailValue}>{item.quantity} units</Text>
                                    </View>
    
                                    <View style={styles.detailRow}>
                                        <MaterialIcons name="person" size={18} color="#00FF9D" />
                                        <Text style={styles.detailLabel}>Buyer ID:</Text>
                                        <Text style={styles.detailValue}>{item.buyer_id}</Text>
                                    </View>
    
                                    <View style={styles.detailRow}>
                                        <MaterialIcons name="inventory" size={18} color="#00FF9D" />
                                        <Text style={styles.detailLabel}>Item ID:</Text>
                                        <Text style={styles.detailValue}>{item.item_id}</Text>
                                    </View>
    
                                    <View style={styles.paymentStatus}>
                                        <MaterialIcons 
                                            name={item.paid ? "payments" : "payment"} 
                                            size={18} 
                                            color={item.paid ? "#00FF9D" : "#FF6B6B"} 
                                        />
                                        <Text style={[
                                            styles.paymentText,
                                            { color: item.paid ? "#00FF9D" : "#FF6B6B" }
                                        ]}>
                                            {item.paid ? `Paid on ${new Date(item.paid_at).toLocaleDateString()}` : 'Payment Pending'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                </>
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
        listContainer: {
            padding: 16,
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
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
        },
        completedBadge: {
            backgroundColor: '#00FF9D33',
        },
        pendingBadge: {
            backgroundColor: '#FFB84D33',
        },
        statusText: {
            fontSize: 12,
            fontWeight: 'bold',
        },
        completedText: {
            color: '#00FF9D',
        },
        pendingText: {
            color: '#FFB84D',
        },
        orderDetails: {
            backgroundColor: '#2A2A2A',
            padding: 16,
            borderRadius: 8,
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
        paymentStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: '#333333',
        },
        paymentText: {
            fontSize: 14,
            fontWeight: '500',
        },
    });