import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SellerShipmentOrder() {
    const navigation: any = useNavigation();
    const [trackingId, setTrackingId] = useState<string>('');
    const [shipmentCompanyName, setShipmentCompanyName] = useState<string>('');
    const [shipmentCompanyContact, setShipmentCompanyContact] = useState<string>('');
    const [shipmentExpectedDate, setShipmentExpectedDate] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const route = useRoute();
    const {order_id} = route.params as {order_id: number};

    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setShipmentExpectedDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const updateShippingDetails = async () => {
        if (!trackingId || !shipmentCompanyName || !shipmentCompanyContact || !shipmentExpectedDate) {
            alert('Please fill all fields');
            return;
        }

        setIsLoading(true);
        try {
            const encodedOrderId = encodeURIComponent(order_id.toString());
            const encodedtrackingId = encodeURIComponent(trackingId);
            const encodedShipmentCompanyName = encodeURIComponent(shipmentCompanyName);
            const encodedShipmentCompanyContact = encodeURIComponent(shipmentCompanyContact);
            const encodedShipmentExpectedDate = encodeURIComponent(shipmentExpectedDate);

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/update_shipment_details?order_id=${encodedOrderId}&tracking_id=${encodedtrackingId}&shipment_company_name=${encodedShipmentCompanyName}&shipment_company_contact=${encodedShipmentCompanyContact}&shipment_expected_date=${encodedShipmentExpectedDate}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data = await response.json();
            if (data) {
                alert('Shipment details updated successfully');
                navigation.navigate('SellerDashboard');
            }
        } catch (error) {
            alert('An error occurred during updating shipment details');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Shipment Details</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.orderInfo}>
                    <MaterialIcons name="local-shipping" size={32} color="#00FF9D" />
                    <Text style={styles.orderTitle}>Order #{order_id.toString()}</Text>
                    <Text style={styles.orderSubtitle}>Update shipping information</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Tracking ID</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="qr-code" size={20} color="#666666" />
                            <TextInput
                                style={styles.input}
                                value={trackingId}
                                onChangeText={setTrackingId}
                                placeholder="Enter tracking ID"
                                placeholderTextColor="#666666"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Shipping Company</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="business" size={20} color="#666666" />
                            <TextInput
                                style={styles.input}
                                value={shipmentCompanyName}
                                onChangeText={setShipmentCompanyName}
                                placeholder="Enter company name"
                                placeholderTextColor="#666666"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Company Contact</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="phone" size={20} color="#666666" />
                            <TextInput
                                style={styles.input}
                                value={shipmentCompanyContact}
                                onChangeText={setShipmentCompanyContact}
                                placeholder="Enter contact number"
                                placeholderTextColor="#666666"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Expected Delivery Date</Text>
                        <Pressable 
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <MaterialIcons name="calendar-today" size={20} color="#666666" />
                            <Text style={styles.dateButtonText}>
                                {shipmentExpectedDate || 'Select date'}
                            </Text>
                        </Pressable>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={shipmentExpectedDate ? new Date(shipmentExpectedDate) : new Date()}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    <Pressable 
                        style={({pressed}) => [
                            styles.submitButton,
                            pressed && styles.buttonPressed,
                            isLoading && styles.buttonDisabled
                        ]}
                        onPress={updateShippingDetails}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#121212" />
                        ) : (
                            <>
                                <MaterialIcons name="check" size={24} color="#121212" />
                                <Text style={styles.submitButtonText}>Update Shipment</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    content: {
        padding: 24,
    },
    orderInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    orderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
    },
    orderSubtitle: {
        fontSize: 16,
        color: '#00FF9D',
        marginTop: 4,
    },
    form: {
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
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333333',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    dateButtonText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
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
        transform: [{scale: 0.98}],
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#121212',
        fontSize: 18,
        fontWeight: 'bold',
    },
});