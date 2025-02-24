import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from 'firebase/firestore';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        padding: 20,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    title: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 32,
    },
    input: {
        width: '100%',
        backgroundColor: '#262626',
        color: '#ffffff',
        padding: 12,
        marginBottom: 12,
        borderRadius: 6,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#363636',
    },
    button: {
        width: '100%',
        backgroundColor: '#0095f6',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 16,
        padding: 8,
    },
    linkText: {
        color: '#0095f6',
        fontSize: 14,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#363636',
    },
    dividerText: {
        color: '#8e8e8e',
        paddingHorizontal: 10,
        fontSize: 12,
    },
});

export function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        if (email && password) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (e) {
                console.log("handleSubmit error: ", e.message);
                Alert.alert(
                    "Login Failed",
                    "Invalid email or password. Please try again.",
                    [{ text: "OK" }]
                );
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.contentContainer}
            >
                <Text style={styles.title}>GenialFeed</Text>
                
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#8e8e8e"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    style={styles.input}
                />
                
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#8e8e8e"
                    autoCapitalize="none"
                    secureTextEntry={true}
                    style={styles.input}
                />

                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                    style={styles.linkButton} 
                    onPress={() => navigation.navigate('Signup')}
                >
                    <Text style={styles.linkText}>Create new account</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

export function SignupScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        if (email && password) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userID = user.uid;

                const docRef = doc(db, "userData", userID);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    try {
                        await setDoc(docRef, {
                            name: user.displayName || email.split('@')[0],
                            feeds: []
                        });
                    } catch (e) {
                        console.log("Error creating document", e);
                    }
                }
            } catch (e) {
                console.log("handleSubmit error: ", e.message);
                Alert.alert(
                    "Signup Failed",
                    "Please check your information and try again.",
                    [{ text: "OK" }]
                );
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.contentContainer}
            >
                <Text style={styles.title}>Create Account</Text>

                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#8e8e8e"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    style={styles.input}
                />
                
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#8e8e8e"
                    autoCapitalize="none"
                    secureTextEntry={true}
                    style={styles.input}
                />

                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                    style={styles.linkButton} 
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.linkText}>Already have an account?</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}