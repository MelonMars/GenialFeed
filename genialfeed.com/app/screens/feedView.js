import { useState, React, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRoute } from "@react-navigation/native";
import { useNavigation } from '@react-navigation/native';
import { createStyles } from '../widgets/styles';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';

const FeedScreen = () => {
    const route = useRoute();
    const { feedData, userId } = route.params;
    const feeds = feedData.response.entries;
    const navigation = useNavigation();
    const { currentTheme } = useContext(ThemeContext);
    const [styles, setStyles] = useState(createStyles(currentTheme));
    
    useEffect(() => {
        setStyles(createStyles(currentTheme));
    }, [currentTheme]);

    const truncateText = (text, length = 100) => {
        if (text && text.length > length) {
            return text.substring(0, length) + '...';
        }
        return text;
    };

    const goToFeedPage = (item) => {
        console.log("Theme is currently: ", currentTheme);
        try {
            navigation.navigate('FeedPage', {
                description: item.description,
                title: item.title,
                link: item.link,
                userId: userId,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <View style={[styles.pageContainer, { flex: 1 }]}>
            <ScrollView>
                {feeds.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => goToFeedPage(item)}
                        style={styles.feedCard}
                    >
                        <View style={styles.feedHeader}>
                            <View style={styles.feedHeaderLeft}>
                                <View style={styles.feedTitleContainer}>
                                    <Text style={styles.feedTitle} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    {item.pubDate && (
                                        <Text style={styles.feedDate}>
                                            {new Date(item.pubDate).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </View>
                        
                        {item.description && (
                            <Text style={styles.feedPreview} numberOfLines={2}>
                                {truncateText(item.description.replace(/<[^>]*>/g, ''))}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default FeedScreen;