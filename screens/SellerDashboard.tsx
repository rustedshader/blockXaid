import { View , Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { MaterialIcons } from '@expo/vector-icons';


interface sellerProductsResponse {
    id?: number,
    created_at?: string,
    product_name?: string,
    seller_id?: number,
    quantity?: number,
    price?: number
}

interface sellerScoreResponse {
    score: number
}

export default function SellerDashboard() {
    const [userId, setUserId] = useState<string>('');
    const [sellerProducts, setSellerProducts] = useState<sellerProductsResponse[]>([]);
    const [sellerScore, setSellerScore] = useState<sellerScoreResponse | null>(null);

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

    const getSellerScore = async() => {
        try {
            const response: Response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/get_seller_score?seller_id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: sellerScoreResponse[] = await response.json();
            if (data && data.length > 0){
                setSellerScore(data[0]);
            }
        } catch (error) {
            alert('An error occurred during fetching seller score');
        }
    }


    const getSellerItems = async() => {
        try {
            const response: Response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/get_seller_products?seller_id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: sellerProductsResponse[] = await response.json();
            if (data){
                setSellerProducts(data);
            }
        } catch (error) {
            alert('An error occurred during fetching seller items');
        }
    }

    useFocusEffect(
        useCallback(() => {
            getData();
            if (userId) {
                getSellerScore();
                getSellerItems();
            }

            return () => {
            };
        }, [userId])
    );

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (userId) {
            getSellerItems();
        }
    }, [userId]);


    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
    <Pressable 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
    >
        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
    </Pressable>
    <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <View style={styles.headerInfo}>
            <Text style={styles.sellerId}>ID: {userId}</Text>
            <Text style={styles.sellerId}>Score: {sellerScore?.score || 0}</Text>
        </View>
    </View>
</View>
    
            <View style={styles.navigationGrid}>
                <Pressable 
                    style={styles.navCard}
                    onPress={() => navigation.navigate('SellerCreateOrder')}
                >
                    <MaterialIcons name="add-box" size={32} color="#00FF9D" />
                    <Text style={styles.navCardTitle}>New Listing</Text>
                </Pressable>
    
                <Pressable 
                    style={styles.navCard}
                    onPress={() => navigation.navigate('SellerAcceptOrder')}
                >
                    <MaterialIcons name="check-circle" size={32} color="#00FF9D" />
                    <Text style={styles.navCardTitle}>Accept Orders</Text>
                </Pressable>
    
                <Pressable 
                    style={styles.navCard}
                    onPress={() => navigation.navigate('SellerActiveOrder')}
                >
                    <MaterialIcons name="local-shipping" size={32} color="#00FF9D" />
                    <Text style={styles.navCardTitle}>Active Orders</Text>
                </Pressable>
    
                <Pressable 
                    style={styles.navCard}
                    onPress={() => navigation.navigate('SellerPastOrders')}
                >
                    <MaterialIcons name="history" size={32} color="#00FF9D" />
                    <Text style={styles.navCardTitle}>Past Orders</Text>
                </Pressable>
                <Pressable
                    style={styles.navCard}
                    onPress={() => navigation.navigate('Chatbot')}
                >
                    <MaterialIcons name="chat" size={32} color="#00FF9D" />
                    <Text style={styles.navCardTitle}>Chatbot</Text>
                </Pressable>
            </View>
    
            <View style={styles.productSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Listed Products</Text>
                    <Pressable style={styles.addButton} onPress={() => navigation.navigate('SellerCreateOrder')}>
                        <MaterialIcons name="add" size={24} color="#00FF9D" />
                    </Pressable>
                </View>
    
                <ScrollView style={styles.productList}>
                    {sellerProducts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="inventory" size={48} color="#333333" />
                            <Text style={styles.emptyStateText}>No products listed yet</Text>
                            <Text style={styles.emptyStateSubtext}>Create your first listing</Text>
                        </View>
                    ) : (
                        sellerProducts.map((product: sellerProductsResponse) => (
                            <View key={product.id} style={styles.productCard}>
                                <View style={styles.productHeader}>
                                    <Text style={styles.productName}>{product.product_name}</Text>
                                    <Pressable onPress={() => navigation.navigate('SellerEditListings', { listingId: product.id })}>
                                        <MaterialIcons name="edit" size={20} color="#00FF9D" />
                                    </Pressable>
                                </View>
                                
                                <View style={styles.productDetails}>
                                    <View style={styles.detailItem}>
                                        <MaterialIcons name="inventory" size={18} color="#00FF9D" />
                                        <Text style={styles.detailText}>Quantity: {product.quantity}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <MaterialIcons name="attach-money" size={18} color="#00FF9D" />
                                        <Text style={styles.detailText}>Price (Per Item): ${product.price}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <MaterialIcons name="monetization-on" size={18} color="#00FF9D" />
                                        <Text style={styles.detailText}>Total: ${(product.quantity || 0) * (product.price || 0)}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </ScrollView>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
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
        marginBottom: 8,
    },
    headerInfo: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    sellerId: {
        fontSize: 14,
        color: '#00FF9D',
    },
    navigationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        gap: 8,
    },
    navCard: {
        width: '48%',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333333',
        aspectRatio: 1,
    },
    navCardTitle: {
        color: '#FFFFFF',
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    productSection: {
        flex: 1,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    addButton: {
        padding: 8,
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333333',
    },
    productList: {
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
    productCard: {
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333333',
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    productDetails: {
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#FFFFFF',
    },
});