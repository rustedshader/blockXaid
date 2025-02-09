import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from "react-native";
import '@walletconnect/react-native-compat';
import { createAppKit, defaultConfig, AppKit, AppKitButton, useAppKitAccount } from '@reown/appkit-ethers-react-native'
import { MaterialIcons } from "@expo/vector-icons";

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

interface createAccountResponse{
    status: string
}

export default function CreateAccount() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [type, setType] = useState<string>('ORG');
    const [name, setName] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [pancardNumber, setPancardNumber] = useState<string>('');
    const navigation: any = useNavigation();

    const {isConnected, address, chainId} = useAppKitAccount();
    
    const handleCreateAccount = async () => {
        try {
            if (!address) {
                alert('Please connect your wallet first');
                return;
            }

            const encodedEmail = encodeURIComponent(email);
            const encodedPassword = encodeURIComponent(password);
            const encodedName = encodeURIComponent(name);
            const encodedPhone = encodeURIComponent(phone);
            const encodedType = encodeURIComponent(type);
            const encodedWallet = encodeURIComponent(address || '');
            const encodedPancardNumber = encodeURIComponent(pancardNumber);

            const response: Response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/create_user?name=${encodedName}&password=${encodedPassword}&email=${encodedEmail}&mobile_number=${encodedPhone}&type=${encodedType}&wallet_address=${encodedWallet}&pancard_number=${encodedPancardNumber}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const data: createAccountResponse = await response.json();
            if (data.status === 'success') {
                alert('Account Created successfully');
                navigation.navigate('LoginScreen');
            } else {
                alert('An error occurred during account creation');
            }
        } catch (error) {
            alert('An error occurred during login');
        }
    };

    return (
        <ScrollView style={styles.container}> 
        <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
            
            <View style={styles.content}>
           
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join BlockXAid Network</Text>
                
                <View style={styles.form}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Name"
                        placeholderTextColor="#666666"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput 
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#666666"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput 
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#666666"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <TextInput 
                        style={styles.input}
                        placeholder="Phone"
                        placeholderTextColor="#666666"
                        value={phone}
                        onChangeText={setPhone}
                    />
                    <TextInput 
                        style={styles.input}
                        placeholder="Pancard Number"
                        placeholderTextColor="#666666"
                        value={pancardNumber}
                        onChangeText={setPancardNumber}
                    />

                    <View style={styles.typeSelector}>
                        <Pressable 
                            style={[styles.typeButton, type === 'ORG' && styles.selectedType]} 
                            onPress={() => setType('ORG')}
                        >
                            <Text style={[styles.typeText, type === 'ORG' && styles.selectedTypeText]}>
                                Organization
                            </Text>
                        </Pressable>
                        
                        <Pressable 
                            style={[styles.typeButton, type === 'SELLER' && styles.selectedType]} 
                            onPress={() => setType('SELLER')}
                        >
                            <Text style={[styles.typeText, type === 'SELLER' && styles.selectedTypeText]}>
                                Seller
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.walletSection}>
                        <AppKit />
                        <AppKitButton balance="show" />
                        {isConnected ? <Text style={styles.connectedStatus}>Connected</Text> : <Text style={styles.connectedStatus}>Not Connected</Text>}
                        {address ? <Text style={styles.connectedStatus}>Address: {address} </Text> : <Text style={styles.connectedStatus}>Address: Not Connected</Text>}
                    </View>

                    <Pressable 
                        style={({pressed}) => [
                            styles.submitButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleCreateAccount}
                    >
                        <Text style={styles.submitButtonText}>Create Account</Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1, // Changed from flex: 1 to flexGrow: 1
        backgroundColor: '#121212',
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 20, 
        padding: 10,
        width: 44, 
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.1)',
        zIndex: 1,
    },
    content: {
        padding: 24,
        top: 20,
        paddingBottom: 100, // Added padding at bottom for scrolling space
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#00FF9D',
        marginBottom: 32,
    },
    form: {
        gap: 16,
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
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 8,
    },
    typeButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333333',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
    },
    selectedType: {
        backgroundColor: '#00FF9D',
        borderColor: '#00FF9D',
    },
    typeText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    selectedTypeText: {
        color: '#121212',
    },
    walletSection: {
        marginVertical: 16,
        padding: 16,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333333',
    },
    walletAddress: {
        marginTop: 8,
        fontSize: 14,
        color: '#00FF9D',
        textAlign: 'center',
    },
    connectedStatus: {
        color: '#00FF9D',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#00FF9D',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    submitButtonText: {
        color: '#121212',
        fontSize: 18,
        fontWeight: 'bold',
    },
});