import { useState, React } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRoute } from "@react-navigation/native";
import { useNavigation } from '@react-navigation/native';
import { createStyles } from '../widgets/styles';

const FeedScreen = () => {
    const route = useRoute();
    const { feedData, currentTheme, userId } = route.params;
    const feeds = feedData.response.entries;
    const navigation = useNavigation();
    const [styles, setStyles] = useState(createStyles(currentTheme));

    const truncateText = (text, length = 100) => {
        if (text && text.length > length) {
            return text.substring(0, length) + '...';
        }
        return text;
    };

    return (
        <View style={[styles.pageContainer, { flex: 1 }]}>
            <ScrollView>
                {feeds.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => navigation.navigate('FeedPage', {
                            description: item.description,
                            title: item.title,
                            link: item.link,
                            userId: userId,
                            styles: styles,
                        })}
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