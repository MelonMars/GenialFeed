import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/home';
import { LoginScreen, SignupScreen } from './screens/auth';
import useAuth from "./hooks/useAuth";
import FeedScreen from './screens/feedView';
import FeedPage from "./screens/feedScreen";
import SettingsScreen from './screens/settings';
import { TouchableOpacity, Image } from "react-native";
import { themes } from './widgets/themes';
import { ThemeContext } from './context/ThemeContext';

const Stack = createStackNavigator();

export default function App() {
    const { user } = useAuth();
    const [currentTheme, setCurrentTheme] = useState(themes.dark);

    const toggleTheme = () => {
        setCurrentTheme(prevTheme => 
            prevTheme === themes.dark ? themes.light : themes.dark
        );
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, toggleTheme }}>
            <NavigationContainer>
                <Stack.Navigator screenOptions={navigationConfig(currentTheme).screenOptions}>
                    {user ? (
                        <>
                            <Stack.Screen name="Home" component={HomeScreen}/>
                            <Stack.Screen name="Settings" component={SettingsScreen}/>
                        </>
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
        </ThemeContext.Provider>
    );
}

export const navigationConfig = (theme) => ({
    screenOptions: ({ navigation }) => ({
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: theme.primary,
        shadowColor: 'transparent',
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      },
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 16,
        color: theme.text,
      },
      headerShadowVisible: false,
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{
            padding: 8,
            marginLeft: 8,
            borderRadius: 8,
          }}
        >
          <Image 
            source={require('./assets/back-arrow.png')} 
            style={{ 
              width: 24, 
              height: 24,
              tintColor: theme.text,
            }} 
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{
                padding: 8,
                marginRight: 8,
                borderRadius: 8,
            }}
        >
            <Image
                source={require('./assets/gear.png')}
                style={{
                    width: 24,
                    height: 24,
                    tintColor: theme.text,
                }}
            />
        </TouchableOpacity>
      )
    })
  });
  