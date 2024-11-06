import {useState, React} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {useRoute} from "@react-navigation/native";
import { useNavigation } from '@react-navigation/native';
import { createStyles } from '../widgets/styles';

const FeedScreen = () => {
    const route = useRoute();
    const { feedData, currentTheme } = route.params;
    console.log(feedData);
    console.log(feedData.response);
    const feeds = feedData.response.entries;
    const navigation = useNavigation();
    const [styles, setStyles] = useState(createStyles(currentTheme));

    return (
        <View style={[styles.pageContainer, { flex: 1 }]}>
            <ScrollView>
                {feeds.map((item, index) => {
                    console.log('Item params:', item);

                    return (
                        <View key={index}>
                            <TouchableOpacity onPress={() => navigation.navigate('FeedPage', {
                                description: item.description,
                                title: item.title,
                                link: item.link,
                                styles: styles,
                                })}
                            style={styles.feedView}>
                                    <Text style={styles.feedText}>{item.title}</Text>
                                </TouchableOpacity>
                            </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

export default FeedScreen;