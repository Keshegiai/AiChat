import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    Button,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Text,
} from 'react-native';
import axios from 'axios';
import { GEMINI_API_KEY } from '@env';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
        <Text style={item.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
            {item.text}
        </Text>
    </View>
);

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const flatListRef = useRef<FlatList<Message>>(null);

    const handleSend = async () => {
        if (input.trim().length === 0 || loading) return;

        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const history = updatedMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            }));
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
            const response = await axios.post(
                API_URL,
                {
                    contents: history,
                }
            );

            const botMessageText = response.data.candidates?.[0]?.content?.parts?.[0]?.text.trim() || "Не удалось получить ответ.";
            const botMessage: Message = { id: Date.now() + 1, text: botMessageText, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Ошибка Gemini API:', error.response?.data?.error || error.message);
            const errorMessage: Message = { id: Date.now() + 1, text: 'Произошла ошибка. Проверьте консоль.', sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Спросите что-нибудь..."
                    editable={!loading}
                />
                <Button title={loading ? '...' : 'Отправить'} onPress={handleSend} disabled={loading} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    messageList: {
        flex: 1,
        padding: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        backgroundColor: '#ffffff',
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    messageContainer: {
        padding: 12,
        borderRadius: 18,
        marginBottom: 10,
        maxWidth: '80%',
    },
    userMessage: {
        backgroundColor: '#007bff',
        alignSelf: 'flex-end',
    },
    botMessage: {
        backgroundColor: '#e9e9eb',
        alignSelf: 'flex-start',
    },
    userMessageText: {
        fontSize: 16,
        color: 'white'
    },
    botMessageText: {
        fontSize: 16,
        color: 'black',
    },
    loader: {
        marginVertical: 10,
    },
});

