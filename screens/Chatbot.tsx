import React, { useState, useRef, useEffect } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    Pressable, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

interface ChatMessage {
    isUser: boolean;
    text: string;
}

export default function ChatbotScreen() {
    const navigation: any = useNavigation();
    const scrollViewRef = useRef<ScrollView>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { isUser: false, text: "Hello! I'm your AI assistant. How can I help you today?" }
    ]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = { isUser: true, text: inputText.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInputText("");
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/chatbot`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    chat: JSON.stringify([inputText.trim()]),
                },
                body: JSON.stringify([inputText.trim()]),
            });

            const data = await response.json();
            
            if (data.status === "success") {
                setMessages(prev => [...prev, { isUser: false, text: data.message }]);
            } else {
                setMessages(prev => [...prev, { isUser: false, text: "Sorry, I encountered an error. Please try again." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { isUser: false, text: "Sorry, I couldn't process your request. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            <View style={styles.header}>
                <Pressable 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>AI Assistant</Text>
                <MaterialIcons name="smart-toy" size={24} color="#00FF9D" />
            </View>

            <ScrollView 
                ref={scrollViewRef}
                style={styles.chatContainer}
                contentContainerStyle={{ paddingBottom: keyboardHeight }}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((message, index) => (
                    <View 
                        key={index} 
                        style={[
                            styles.messageContainer,
                            message.isUser ? styles.userMessage : styles.aiMessage
                        ]}
                    >
                        {!message.isUser && (
                            <View style={styles.aiAvatar}>
                                <MaterialIcons name="smart-toy" size={20} color="#00FF9D" />
                            </View>
                        )}
                        <View style={[
                            styles.messageBubble,
                            message.isUser ? styles.userBubble : styles.aiBubble
                        ]}>
                            <Text style={[
                                styles.messageText,
                                message.isUser && styles.userMessageText
                            ]}>
                                {message.text}
                            </Text>
                        </View>
                    </View>
                ))}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#00FF9D" />
                        <Text style={styles.loadingText}>AI is thinking...</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your message..."
                    placeholderTextColor="#666666"
                    multiline
                />
                <Pressable 
                    style={({pressed}) => [
                        styles.sendButton,
                        pressed && styles.buttonPressed,
                        !inputText.trim() && styles.buttonDisabled
                    ]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || isLoading}
                >
                    <MaterialIcons name="send" size={24} color="#121212" />
                </Pressable>
            </View>
        </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    chatContainer: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    userMessage: {
        justifyContent: 'flex-end',
    },
    aiMessage: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: '#00FF9D',
        borderTopRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    userMessageText: {
        color: '#121212',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: {
        color: '#00FF9D',
        marginLeft: 8,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#1E1E1E',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#333333',
    },
    input: {
        flex: 1,
        backgroundColor: '#2A2A2A',
        borderRadius: 20,
        padding: 12,
        paddingTop: 12,
        color: '#FFFFFF',
        fontSize: 16,
        marginRight: 12,
        maxHeight: 150,
        minHeight: 48,
    },
    sendButton: {
        backgroundColor: '#00FF9D',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{scale: 0.95}],
    },
    buttonDisabled: {
        backgroundColor: '#333333',
    },
});