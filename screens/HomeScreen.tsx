import { useNavigation } from "@react-navigation/native";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
    const navigation: any = useNavigation();
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <MaterialIcons name="lock" size={80} color="#00FF9D" style={styles.icon} />
                <Text style={styles.title}>Welcome to BlockXAid</Text>
                <Text style={styles.subtitle}>Secure Decentralized.</Text>
                
                <View style={styles.buttonContainer}>
                    <Pressable 
                        style={({pressed}) => [
                            styles.button,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={() => navigation.navigate('LoginScreen')}
                    >
                        <MaterialIcons name="login" size={24} color="#121212" />
                        <Text style={styles.buttonText}>Login</Text>
                    </Pressable>

                    <Pressable 
                        style={({pressed}) => [
                            styles.button,
                            styles.secondaryButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={() => navigation.navigate('CreateAccount')}
                    >
                        <MaterialIcons name="person-add" size={24} color="#121212" />
                        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Create Account</Text>
                    </Pressable>
                </View>

                <Text style={styles.footerText}>
                    Made with ❤️ at UPES
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    icon: {
        marginBottom: 24,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: '#00FF9D',
        marginBottom: 48,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#00FF9D',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        elevation: 4,
        shadowColor: '#00FF9D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#00FF9D',
    },
    buttonText: {
        color: '#121212',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    secondaryButtonText: {
        color: '#00FF9D',
    },
    footerText: {
        color: '#666666',
        fontSize: 14,
        textAlign: 'center',
        position: 'absolute',
        bottom: 40,
    }
});