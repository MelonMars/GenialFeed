import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/home';
import { LoginScreen, SignupScreen } from './screens/auth';
import useAuth from "./hooks/useAuth";
import FeedScreen from './screens/feedView';
import FeedPage from "./screens/feedScreen";
import {TouchableOpacity, Image} from "react-native";

const Stack = createStackNavigator();

export default function App() {
    const { user } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={({ navigation }) => ({ headerTitleAlign: 'center', headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image source={require('./assets/back-arrow.png')} style={{ width: 24, height: 24, marginLeft: 10 }} />
                </TouchableOpacity>
            ) })}>

            {user ? (
                    <Stack.Screen name="Home" component={HomeScreen}/>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen}/>
                        <Stack.Screen name="Signup" component={SignupScreen}/>
                    </>
                )}
                <Stack.Screen name="Feed" component={FeedScreen}/>
                <Stack.Screen name="FeedPage" component={FeedPage}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
}
