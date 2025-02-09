import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { 
    View, 
    TextInput, 
    Pressable, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

interface sellerProductCreationResponse {
    status: string
}

interface FormErrors {
    product: string;
    quantity: string;
    price: string;
}

export default function SellerCreateOrder() {
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [product, setProduct] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [errors, setErrors] = useState<FormErrors>({
        product: '',
        quantity: '',
        price: ''
    });

    const getData = async() => {
        try {
            const id = await AsyncStorage.getItem('id');
            const type = await AsyncStorage.getItem('type');
            if (id && type === 'SELLER'){
                setUserId(id);
            } else {
                alert('You are not authorized to view this page');
                navigation.goBack();
            }
        } catch (error) {
            alert('An error occurred during opening Dashboard');
            navigation.goBack();
        }
    }

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            product: '',
            quantity: '',
            price: ''
        };

        if (!product.trim()) {
            newErrors.product = 'Product name is required';
            isValid = false;
        }

        if (!quantity.trim()) {
            newErrors.quantity = 'Quantity is required';
            isValid = false;
        } else if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
            newErrors.quantity = 'Please enter a valid quantity';
            isValid = false;
        }

        if (!price.trim()) {
            newErrors.price = 'Price is required';
            isValid = false;
        } else if (isNaN(Number(price)) || Number(price) <= 0) {
            newErrors.price = 'Please enter a valid price';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const addSellerItems = async() => {
        if (!validateForm()) return;
        if (isLoading) return;

        setIsLoading(true);
        try {
            const encodedProduct: string = encodeURIComponent(product);
            const encodedQuantity: string = encodeURIComponent(quantity);
            const encodedPrice: string = encodeURIComponent(price);

            const response: Response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/create_seller_product?seller_id=${userId}&product_name=${encodedProduct}&price=${encodedPrice}&quantity=${encodedQuantity}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: sellerProductCreationResponse = await response.json();
            if (data.status === 'success') {
                Alert.alert(
                    "Success",
                    "Product added successfully",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                setProduct('');
                                setQuantity('');
                                setPrice('');
                                navigation.goBack();
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while adding the product");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!validateForm()) return;
        
        Alert.alert(
            "Create Listing",
            "Are you sure you want to create this listing?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Create",
                    onPress: addSellerItems
                }
            ]
        );
    };

    useEffect(() => {
        getData();
    }, []);

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.header}>
                    <Pressable 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.headerContent}>
                        <MaterialIcons name="add-business" size={32} color="#00FF9D" />
                        <Text style={styles.headerTitle}>Create New Listing</Text>
                        <Text style={styles.headerSubtitle}>Add your product details</Text>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Product Name</Text>
                        <View style={[
                            styles.inputContainer,
                            errors.product ? styles.inputError : null
                        ]}>
                            <MaterialIcons name="inventory" size={20} color="#666666" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter product name"
                                placeholderTextColor="#666666"
                                value={product}
                                onChangeText={(text) => {
                                    setProduct(text);
                                    if (errors.product) {
                                        setErrors({...errors, product: ''});
                                    }
                                }}
                            />
                        </View>
                        {errors.product ? (
                            <Text style={styles.errorText}>{errors.product}</Text>
                        ) : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Quantity Available</Text>
                        <View style={[
                            styles.inputContainer,
                            errors.quantity ? styles.inputError : null
                        ]}>
                            <MaterialIcons name="storage" size={20} color="#666666" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter quantity"
                                placeholderTextColor="#666666"
                                value={quantity}
                                onChangeText={(text) => {
                                    setQuantity(text);
                                    if (errors.quantity) {
                                        setErrors({...errors, quantity: ''});
                                    }
                                }}
                                keyboardType="numeric"
                            />
                        </View>
                        {errors.quantity ? (
                            <Text style={styles.errorText}>{errors.quantity}</Text>
                        ) : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Price per Unit</Text>
                        <View style={[
                            styles.inputContainer,
                            errors.price ? styles.inputError : null
                        ]}>
                            <MaterialIcons name="attach-money" size={20} color="#666666" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter price"
                                placeholderTextColor="#666666"
                                value={price}
                                onChangeText={(text) => {
                                    setPrice(text);
                                    if (errors.price) {
                                        setErrors({...errors, price: ''});
                                    }
                                }}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        {errors.price ? (
                            <Text style={styles.errorText}>{errors.price}</Text>
                        ) : null}
                    </View>

                    <Pressable 
                        style={({pressed}) => [
                            styles.submitButton,
                            pressed && styles.buttonPressed,
                            isLoading && styles.buttonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#121212" />
                        ) : (
                            <>
                                <MaterialIcons name="add-circle-outline" size={24} color="#121212" />
                                <Text style={styles.submitButtonText}>Create Listing</Text>
                            </>
                        )}
                    </Pressable>
                </View>

                <View style={styles.infoSection}>
                    <MaterialIcons name="info-outline" size={20} color="#666666" />
                    <Text style={styles.infoText}>
                        Your listing will be available to organizations once created
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollContainer: {
        flex: 1,
        padding: 24,
    },
    header: {
        position: 'relative',
        marginBottom: 32,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
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
        marginTop: 16,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#00FF9D',
    },
    formContainer: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333333',
        paddingHorizontal: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        paddingVertical: 16,
    },
    inputError: {
        borderColor: '#FF6B6B',
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    submitButton: {
        backgroundColor: '#00FF9D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 16,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#121212',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginTop: 32,
        gap: 12,
    },
    infoText: {
        flex: 1,
        color: '#666666',
        fontSize: 14,
    },
});