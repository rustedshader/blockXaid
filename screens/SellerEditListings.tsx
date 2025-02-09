import { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    Pressable, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Listing {
    id: number;
    product_name: string;
    price: number;
    quantity: number;
    seller_id: number;
}

export default function SellerEditListings() {
    const navigation = useNavigation();
    const route = useRoute();
    const { listingId } = route.params as { listingId: number };

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [listing, setListing] = useState<Listing | null>(null);
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');

    const getData = async() => {
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
        }
    }


    const updateListing = async () => {
        if (!productName.trim() || !price.trim() || !quantity.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (isNaN(Number(price)) || isNaN(Number(quantity))) {
            Alert.alert('Error', 'Price and quantity must be valid numbers');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/update_listing?seller_id=${userId}&item_id=${listingId}&product_name=${encodeURIComponent(productName)}&price=${price}&quantity=${quantity}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data = await response.json();
            if (data) {
                Alert.alert('Success', 'Listing updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update listing');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteListing = async () => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this listing? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const response = await fetch(
                                `${process.env.EXPO_PUBLIC_API_URL}/remove_listing?seller_id=${userId}&item_id=${listingId}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                }
                            );
                            const data = await response.json();
                            if (data) {
                                Alert.alert('Success', 'Listing deleted successfully', [
                                    { text: 'OK', onPress: () => navigation.goBack() }
                                ]);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete listing');
                        } finally {
                            setIsDeleting(false);
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
        }
    }, [userId]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00FF9D" />
                <Text style={styles.loadingText}>Loading listing details...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.header}>
                <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Edit Listing</Text>
                <Pressable 
                    style={styles.deleteButton}
                    onPress={deleteListing}
                    disabled={isDeleting}
                >
                    <MaterialIcons name="delete" size={24} color="#FF6B6B" />
                </Pressable>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Product Name</Text>
                    <TextInput
                        style={styles.input}
                        value={productName}
                        onChangeText={setProductName}
                        placeholder="Enter product name"
                        placeholderTextColor="#666666"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Price</Text>
                    <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        placeholder="Enter price"
                        placeholderTextColor="#666666"
                        keyboardType="decimal-pad"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                        style={styles.input}
                        value={quantity}
                        onChangeText={setQuantity}
                        placeholder="Enter quantity"
                        placeholderTextColor="#666666"
                        keyboardType="number-pad"
                    />
                </View>

                <Pressable 
                    style={({pressed}) => [
                        styles.saveButton,
                        pressed && styles.buttonPressed,
                        (isSaving || isDeleting) && styles.buttonDisabled
                    ]}
                    onPress={updateListing}
                    disabled={isSaving || isDeleting}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#121212" />
                    ) : (
                        <>
                            <MaterialIcons name="save" size={24} color="#121212" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
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
        backgroundColor: '#121212',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
    },
    deleteButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333333',
    },
    saveButton: {
        backgroundColor: '#00FF9D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
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
    saveButtonText: {
        color: '#121212',
        fontSize: 18,
        fontWeight: 'bold',
    },
});