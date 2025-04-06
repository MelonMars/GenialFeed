import { useState, React, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRoute, useNavigation } from "@react-navigation/native";
import { createStyles } from '../widgets/styles';
import { ThemeContext } from '../context/ThemeContext';
import { getStoredFeeds, getFavoritedEntries, getAllReadEntries, getAllUnreadEntries, markEntryFavorited, markEntryRead } from '../context/feeds';

const FeedScreen = () => {
    const route = useRoute();
    const { userId, feedName } = route.params;
    const navigation = useNavigation();
    const { currentTheme } = useContext(ThemeContext);

    const [feeds, setFeeds] = useState([]);
    const [allFeeds, setAllFeeds] = useState([]); // Store all feeds for filtering
    const [styles, setStyles] = useState(createStyles(currentTheme));
    const [readItems, setReadItems] = useState({});
    const [favoritedItems, setFavoritedItems] = useState({});
    const [showOnlyUnread, setShowOnlyUnread] = useState(false); // Toggle state

    useEffect(() => {
        navigation.setOptions({ title: feedName });
    }, [navigation, feedName]);

    useEffect(() => {
        setStyles(createStyles(currentTheme));
    }, [currentTheme]);

    useEffect(() => {
        loadReadAndFavoriteStatus();
    }, [feedName]);

    useEffect(() => {
        const fetchFeeds = async () => {
            try {
                if (feedName === "Unread") {
                    const unreadEntries = await getAllUnreadEntries();
                    setAllFeeds(unreadEntries);
                    setFeeds(unreadEntries);
                }
                else if (feedName === "Favorited") {
                    const favoritedEntries = await getFavoritedEntries();
                    setAllFeeds(favoritedEntries);
                    setFeeds(favoritedEntries);
                } else {
                    const retrievedFeeds = await getStoredFeeds();
                    const feedItems = retrievedFeeds[feedName] || [];
                    setAllFeeds(feedItems);
                    setFeeds(feedItems);
                }
            } catch (error) {
                console.error("Error fetching feeds:", error);
            }
            await loadReadAndFavoriteStatus();
        };
        
        fetchFeeds();
    }, [feedName]);

    // Filter feeds when toggle changes or when read status changes
    useEffect(() => {
        filterFeeds();
    }, [showOnlyUnread, readItems, allFeeds]);

    const filterFeeds = () => {
        if (showOnlyUnread) {
            setFeeds(allFeeds.filter(item => !readItems[item.link]));
        } else {
            setFeeds(allFeeds);
        }
    };

    const loadReadAndFavoriteStatus = async () => {
        try {
            const readStatus = await getAllReadEntries();
            const favoriteStatus = await getFavoritedEntries();
            
            setReadItems(readStatus.reduce((acc, item) => ({ ...acc, [item.link]: true }), {}));
            setFavoritedItems(favoriteStatus.reduce((acc, item) => ({ ...acc, [item.link]: true }), {}));
        } catch (error) {
            console.error("Error loading read/favorite status:", error);
        }
    };

    const toggleReadStatus = async (item) => {
        const updatedReadItems = { ...readItems, [item.link]: !readItems[item.link] };
        setReadItems(updatedReadItems);
        await markEntryRead(item.link, !readItems[item.link]);
    };

    const toggleFavoriteStatus = async (item) => {
        const updatedFavoritedItems = { ...favoritedItems, [item.link]: !favoritedItems[item.link] };
        setFavoritedItems(updatedFavoritedItems);
        await markEntryFavorited(item.link, !favoritedItems[item.link]);
    };

    const truncateText = (text, length = 100) => {
        return text && text.length > length ? text.substring(0, length) + '...' : text;
    };

    const goToFeedPage = (item) => {
        navigation.navigate('FeedPage', {
            description: item.description,
            title: item.title,
            link: item.link,
            userId: userId,
            feedName: feedName
        });
        toggleReadStatus(item);
    };

    return (
        <View style={[styles.pageContainer, { flex: 1 }]}>
            <ScrollView style={{ flex: 1 }}>
                {feeds.length > 0 ? (
                    feeds.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => goToFeedPage(item)}
                            style={[styles.feedCard, { flexDirection: 'row', alignItems: 'center' }]}
                        >
                            <View style={{ marginRight: 10 }}>
                                <Text style={{
                                    fontSize: 14,
                                    color: readItems[item.link] ? 'gray' : 'blue',
                                    borderWidth: 1,
                                    borderColor: readItems[item.link] ? 'gray' : 'blue',
                                    borderRadius: 5,
                                    width: 10,
                                    height: 10,
                                    textAlign: 'center',
                                    lineHeight: 10
                                }}>
                                    {readItems[item.link] ? '○' : '●'}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.feedTitle} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                {item.published && (
                                    <Text style={styles.feedDate}>
                                        {new Date(item.published).toLocaleDateString()}
                                    </Text>
                                )}
                                {item.description && (
                                    <Text style={styles.feedPreview} numberOfLines={2}>
                                        {truncateText(item.description.replace(/<[^>]*>/g, ''))}
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity onPress={() => toggleFavoriteStatus(item)}>
                                <Text style={{ fontSize: 18, color: favoritedItems[item.link] ? 'gold' : 'gray' }}>
                                    {favoritedItems[item.link] ? '★' : '☆'}
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={styles.feedTitle}>
                            {showOnlyUnread ? "No unread items" : "No items to display"}
                        </Text>
                    </View>
                )}
            </ScrollView>
            
            <View style={[styles.toggleContainer || {
                borderTopWidth: 1,
                borderTopColor: '#eee',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                height: 10,
                backgroundColor: currentTheme === 'dark' ? '#222' : '#fff'
            }]}>
                <Text style={[styles.toggleText || { marginRight: 10, color: currentTheme === 'dark' ? '#fff' : '#000' }]}>
                    Show All
                </Text>
                <Switch
                    value={showOnlyUnread}
                    onValueChange={setShowOnlyUnread}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={showOnlyUnread ? "#f5dd4b" : "#f4f3f4"}
                />
                <Text style={[styles.toggleText || { marginLeft: 10, color: currentTheme === 'dark' ? '#fff' : '#000' }]}>
                    Unread Only
                </Text>
            </View>
        </View>
    );
};

export default FeedScreen;