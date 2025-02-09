import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet,Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';


interface loginResponse {
    status: string,
    type?: string,
    id?: number,
    message?: string
}

const LoginScreen = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const navigation: any = useNavigation();
    
    const storeData = async (value: string , type: string ) => {
        try {
                await AsyncStorage.multiSet([['id', value], ['type', type]]);
        }catch(e){
                alert('An error occurred during login');
        }
    }

const handleLogin = async () => {
        try {
                const encodedEmail: string = encodeURIComponent(email);
                const encodedPassword: string = encodeURIComponent(password);
                const response: Response = await fetch(
                        `${process.env.EXPO_PUBLIC_API_URL}/login?email=${encodedEmail}&password=${encodedPassword}`,
                        {
                                method: 'POST',
                                headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                },
                        }
                );
                const data: loginResponse = await response.json();
                if (data.status === 'success') {
                        if (data.id && data.type){
                                await storeData(data.id.toString(), data.type);
                                if (data.type === 'ORG'){
                                        navigation.navigate('OrgDashboard');
                                }
                                if (data.type === 'SELLER'){
                                        navigation.navigate('SellerDashboard');
                                }
                }
                } else {
                        alert(data.message);
                }
        } catch (error) {
                alert('An error occurred during login');
        }
};

return (
        <View style={styles.container}>
                  <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
            <View style={styles.content}>
                <MaterialIcons name="lock-outline" size={80} color="#00FF9D" style={styles.icon} />
                
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Login to your account</Text>
    
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={24} color="#666666" />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#666666"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
    
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="lock" size={24} color="#666666" />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#666666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
    
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
    
                    <Pressable 
                        style={({pressed}) => [
                            styles.loginButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleLogin}
                    >
                        <Text style={styles.loginButtonText}>Login</Text>
                    </Pressable>
    
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>
    
                    <Pressable 
                        style={({pressed}) => [
                            styles.createAccountButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={() => navigation.navigate('CreateAccount')}
                    >
                        <Text style={styles.createAccountButtonText}>Create New Account</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )};
    
const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: '#121212',
        },
        backButton: {
                        position: 'absolute',
                        top: 50,
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
                flex: 1,
                justifyContent: 'center',
                padding: 24,
        },
        icon: {
                alignSelf: 'center',
                marginBottom: 24,
        },
        title: {
                fontSize: 32,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 8,
                textAlign: 'center',
        },
        subtitle: {
                fontSize: 16,
                color: '#00FF9D',
                marginBottom: 32,
                textAlign: 'center',
        },
        form: {
                gap: 16,
        },
        inputContainer: {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1E1E1E',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#333333',
                paddingHorizontal: 16,
        },
        input: {
                flex: 1,
                color: '#FFFFFF',
                fontSize: 16,
                padding: 16,
                paddingLeft: 12,
        },
        forgotPassword: {
                color: '#00FF9D',
                textAlign: 'right',
                fontSize: 14,
        },
        loginButton: {
                backgroundColor: '#00FF9D',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 8,
        },
        buttonPressed: {
                opacity: 0.8,
                transform: [{ scale: 0.98 }],
        },
        loginButtonText: {
                color: '#121212',
                fontSize: 18,
                fontWeight: 'bold',
        },
        divider: {
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 24,
        },
        dividerLine: {
                flex: 1,
                height: 1,
                backgroundColor: '#333333',
        },
        dividerText: {
                color: '#666666',
                paddingHorizontal: 16,
                fontSize: 14,
        },
        createAccountButton: {
                backgroundColor: 'transparent',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#00FF9D',
        },
        createAccountButtonText: {
                color: '#00FF9D',
                fontSize: 16,
                fontWeight: '600',
        },
});

export default LoginScreen;