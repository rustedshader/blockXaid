import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Pressable, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import '@walletconnect/react-native-compat'
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from '@expo/vector-icons';



interface SellerProductsResponse {
    id?: number;
    product_name?: string;
    quantity?: number;
    price?: number;
    seller_name?: string;
    seller_id?: number;
}

interface OrderQuantities {
    [key: number]: number;
}

export default function OrgDashboard() {
    const [userId, setUserId] = useState<string>('');
    const [sellerProducts, setSellerProducts] = useState<SellerProductsResponse[]>([]);
    const [orderQuantities, setOrderQuantities] = useState<OrderQuantities>({});
    const navigation: any = useNavigation();
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

    const getAllSellersListings = async() => {
        try {
            const response: Response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/get_all_sellers_product`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: SellerProductsResponse[] = await response.json();
            if (data){
                setSellerProducts(data);
            }
        } catch (error) {
            alert('An error occurred during fetching seller items');
        }
    }

    const handleQuantityChange = (productId: number, quantity: string) => {
        setOrderQuantities(prev => ({
            ...prev,
            [productId]: parseInt(quantity) || 0
        }));
    }

    const handleCreateOrder = async (product: SellerProductsResponse) => {
        if (!product.id || !userId || !orderQuantities[product.id]) return;
        
        try {
            const encodedBuyerId = encodeURIComponent(userId);
            const encodedSellerId = encodeURIComponent(product.seller_id?.toString() || '');
            const encodedItemId = encodeURIComponent(product.id.toString());
            const quantity = orderQuantities[product.id].toString();
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create_order?buyer_id=${encodedBuyerId}&seller_id=${encodedSellerId}&item_id=${encodedItemId}&quantity=${quantity}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            
            const data = await response.json();
            if (data) {
                alert('Order created successfully!');
                setOrderQuantities(prev => ({
                    ...prev,
                    [product.id!]: 0
                }));
            }
        } catch (error) {
            alert('An error occurred while creating the order');
        }
    }

    useEffect(() => {
        getData();
        if (userId) {
            getAllSellersListings();
        }
    }, [userId]);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerSection}>
            <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
            <Text style={styles.header}>Organization Dashboard</Text>
            <Text style={styles.subHeader}>Available Products</Text>
            </View>
        
            <View style={styles.navigationBar}>
            <Pressable 
                style={styles.navButton}
                onPress={() => navigation.navigate('OrgPayOrders')}
            >
                <MaterialIcons name="payment" size={24} color="#00FF9D" />
                <Text style={styles.navButtonText}>Payable</Text>
            </Pressable>
            <Pressable 
                style={styles.navButton}
                onPress={() => navigation.navigate('OrgActiveOrders')}
            >
                <MaterialIcons name="local-shipping" size={24} color="#00FF9D" />
                <Text style={styles.navButtonText}>Active</Text>
            </Pressable>
            <Pressable
                style={styles.navButton}
                onPress={() => navigation.navigate('Chatbot')}
                >
                <MaterialIcons name="chat" size={24} color="#00FF9D" />
                <Text style={styles.navButtonText}>Chatbot</Text>
                </Pressable>
            {/* <Pressable 
                style={styles.navButton}
                onPress={() => navigation.navigate('OrgWaitingOrders')}
            >
                <MaterialIcons name="hourglass-empty" size={24} color="#00FF9D" />
                <Text style={styles.navButtonText}>Waiting</Text>
            </Pressable> */}
            <Pressable
                style={styles.navButton}
                onPress={() => navigation.navigate('OrgPastOrders')}
            >
                <MaterialIcons name="history" size={24} color="#00FF9D" />
                <Text style={styles.navButtonText}>Past Orders</Text>
            </Pressable>
            </View>
        
            <ScrollView style={styles.productList}>
            {sellerProducts.map((product: SellerProductsResponse) => (
                <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                    <Text style={styles.productName}>{product.product_name}</Text>
                    <Text style={styles.sellerName}>by {product.seller_name}</Text>
                </View>
        
                <View style={styles.productDetails}>
                    <View style={styles.detailItem}>
                    <MaterialIcons name="inventory" size={20} color="#00FF9D" />
                    <Text style={styles.detailText}>Available: {product.quantity}</Text>
                    </View>
                    <View style={styles.detailItem}>
                    <MaterialIcons name="attach-money" size={20} color="#00FF9D" />
                    <Text style={styles.detailText}>Price: {product.price}</Text>
                    </View>
                </View>
        
                <View style={styles.orderSection}>
                    <View style={styles.quantityInputContainer}>
                    <TextInput
                        style={styles.quantityInput}
                        placeholder="Quantity"
                        placeholderTextColor="#666666"
                        keyboardType="numeric"
                        value={orderQuantities[product.id!]?.toString() || ''}
                        onChangeText={(text) => handleQuantityChange(product.id!, text)}
                    />
                    </View>
                    <Pressable 
                    style={({pressed}) => [
                        styles.orderButton,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={() => handleCreateOrder(product)}
                    >
                    <MaterialIcons name="shopping-cart" size={20} color="#121212" />
                    <Text style={styles.orderButtonText}>Place Order</Text>
                    </Pressable>
                </View>
                </View>
            ))}
            </ScrollView>
        </ScrollView>
    )};
    
    const styles = StyleSheet.create({
        container: {
            flexGrow: 1,
            backgroundColor: '#121212',
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
        headerSection: {
            padding: 24,
            paddingBottom: 16,
        },
        header: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: 4,
        },
        subHeader: {
            fontSize: 16,
            color: '#00FF9D',
        },
        navigationBar: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#333333',
        },
        navButton: {
            flex: 1,
            alignItems: 'center',
            padding: 12,
        },
        navButtonText: {
            color: '#FFFFFF',
            marginTop: 4,
            fontSize: 12,
        },
        productList: {
            padding: 16,
        },
        productCard: {
            backgroundColor: '#1E1E1E',
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#333333',
        },
        productHeader: {
            marginBottom: 12,
        },
        productName: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: 4,
        },
        sellerName: {
            fontSize: 14,
            color: '#666666',
        },
        productDetails: {
            marginBottom: 16,
        },
        detailItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        detailText: {
            color: '#FFFFFF',
            marginLeft: 8,
            fontSize: 16,
        },
        orderSection: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        quantityInputContainer: {
            flex: 1,
        },
        quantityInput: {
            backgroundColor: '#2A2A2A',
            borderRadius: 8,
            padding: 12,
            color: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#333333',
        },
        orderButton: {
            backgroundColor: '#00FF9D',
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flex: 1,
        },
        buttonPressed: {
            opacity: 0.8,
            transform: [{ scale: 0.98 }],
        },
        orderButtonText: {
            color: '#121212',
            fontWeight: 'bold',
            fontSize: 16,
        },
    });