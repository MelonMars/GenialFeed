import React, {useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import {auth,db} from "../firebase";
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function LoginScreen({navigation}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        if (email && password) {
            try {
                await signInWithEmailAndPassword(
                    auth, email, password
                );
            } catch (e) {
                console.log("handleSubmit error: ", e.message);
                Alert.alert("Wrong username or password! Or possibly you used something else to log in with?")
            }
        }
    }

    return(<View style={styles.container}>
        <TextInput
            value={email}
            onChangeText={value => setEmail(value)}
            placeholder='Enter email'
            autoCapitalize='none'
            placeholderTextColor='#aaa'
            style={styles.input}
        />
        <TextInput
            value={password}
            onChangeText={value => setPassword(value)}
            placeholder='Enter password'
            autoCapitalize='none'
            secureTextEntry={true}
            placeholderTextColor='#aaa'
            style={styles.input}
        />
        <TouchableOpacity onPress={handleSubmit}>
            <Text>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text>Go to Signup</Text>
        </TouchableOpacity>
    </View>)
}

export function SignupScreen({navigation}) {
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
                            name: user.displayName || email.split('@')[0], // Fallback if displayName is null
                            feeds: []
                        });
                    } catch (e) {
                        console.log("Error creating document", e);
                    }
                } else {
                    console.log("User already exists, just logging in again!");
                }

                console.log("Signed up as: ", user);
            } catch (e) {
                console.log("handleSubmit error: ", e.message);
            }
        }
    };

    return(
        <View style={styles.container}>
            <TextInput
                value={email}
                onChangeText={value => setEmail(value)}
                placeholder='Enter email'
                autoCapitalize='none'
                placeholderTextColor='#aaa'
                style={styles.input}
            />
            <TextInput
                value={password}
                onChangeText={value => setPassword(value)}
                placeholder='Enter password'
                autoCapitalize='none'
                secureTextEntry={true}
                placeholderTextColor='#aaa'
                style={styles.input}
            />
            <TouchableOpacity onPress={handleSubmit}>
                <Text>Sign up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text>Go to Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        width: '80%',
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        textAlign: 'center',
    },
});