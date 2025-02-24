import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { createStyles } from '../widgets/styles';
import { themes } from '../widgets/themes';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function SettingsScreen() {
    const { currentTheme, toggleTheme } = useContext(ThemeContext);
    const styles = createStyles(currentTheme);
    const isDarkMode = currentTheme === themes.dark;

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <View style={[styles.pageContainer, { flex: 1 }]}>
            <View style={styles.container}>
                <View style={styles.themeContainer}>
                    <Text style={{ color: currentTheme.text, fontSize: 18, fontWeight: 'bold', }}>Dark Mode:        </Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleTheme}
                        value={isDarkMode}
                    />
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}