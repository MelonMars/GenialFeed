import React, { useEffect, useState, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Linking,
    Alert,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Modal,
    Image,
} from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import * as WebBrowser from 'expo-web-browser';
import RenderHtml from 'react-native-render-html';
import { createStyles } from '../widgets/styles';
import { ThemeContext } from '../context/ThemeContext';
import { Share } from 'react-native';
import {markEntryRead, markEntryFavorited, isPostFavorited, getStoredFeeds, isPostRead} from '../context/feeds';

export default function FeedPage({ route }) {
    const { description, title, link, userId, feedName } = route.params;
    const { width } = Dimensions.get('window');
    const [isReaderMode, setIsReaderMode] = useState(false);
    const [readerContent, setReaderContent] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const { currentTheme } = useContext(ThemeContext);
    const [styles, setStyles] = useState(createStyles(currentTheme));
    const [isFavorited, setIsFavorited] = useState(false);
    const [isRead, setIsRead] = useState(false);

    useEffect(() => {
        setStyles(createStyles(currentTheme));
    }, [currentTheme]);

    useEffect(() => {
        markEntryRead(link, true);
    }, [userId, link]);
    
    const sleep = async (timeout) => {
        return new Promise(resolve => setTimeout(resolve, timeout));
    };

    const openLink = async () => {
        try {
            if (await InAppBrowser.isAvailable()) {
                const result = await InAppBrowser.open(link, {
                    dismissButtonStyle: 'cancel',
                    preferredBarTintColor: styles.primary,
                    preferredControlTintColor: styles.text,
                    readerMode: false,
                    animated: true,
                    modalPresentationStyle: 'fullScreen',
                    modalTransitionStyle: 'coverVertical',
                    modalEnabled: true,
                    enableBarCollapsing: false,
                    showTitle: true,
                    toolbarColor: styles.primary,
                    secondaryToolbarColor: styles.primDark,
                    navigationBarColor: styles.primary,
                    navigationBarDividerColor: styles.border,
                    enableUrlBarHiding: true,
                    enableDefaultShare: true,
                    forceCloseOnRedirection: false,
                });
                await sleep(800);
            } else Linking.openURL(link);
        } catch (error) {
            console.error(error);
            WebBrowser.openBrowserAsync(link, { showTitle: true });
        }
    };

    const makeSummary = async () => {
        setLoading(true);
        setModalVisible(true);
        try {
            const response = await fetch('https://api.genialfeed.com:8000/getSummary/?link=' + link + "&userId=" + userId);
            const summData = await response.json();
            if (summData.result === "ERROR") {
                setSummary("Couldn't make summary!");
            } else if (summData.result === "TOKENS") {
                setSummary("Not enough tokens to make summary!");
            } else {
                setSummary(summData.result);
            }
        } catch (error) {
            setSummary("Couldn't make summary!");
        } finally {
            setLoading(false);
        }
    };

    const toggleReaderMode = async () => {
        setIsReaderMode(!isReaderMode);
        if (!isReaderMode && !readerContent) {
            setLoading(true);
            try {
                const response = await fetch('https://api.genialfeed.com:8000/cleanPage/?link=' + link);
                const data = await response.json();
                setReaderContent(data.result);
            } catch (error) {
                console.error("Error fetching reader content:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const sharePost = async () => {
        const message = "Hey! Check out this cool article: " + title + " - " + link;
        try {
            await Share.share({
                message: message
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
        }

    useEffect(() => {
        const fetchStatus = async () => {
            const favorited = await isPostFavorited(feedName, link);

            const read = await isPostRead(feedName, link);
            setIsFavorited(favorited);
            setIsRead(read);
        };
        fetchStatus();
    }, [feedName, link]);

        
    const toggleFavorite = async () => {
        await markEntryFavorited(link, !isFavorited);
        setIsFavorited(!isFavorited);
    };

    const toggleRead = async () => {
        await markEntryRead(feedName, link, !isRead);
        setIsRead(!isRead);
    };

    return (
        <View style={[styles.pageContainer, { flex: 1 }]}>
            <View style={styles.articleHeader}>
                <TouchableOpacity onPress={openLink} style={styles.titleContainer}>
                    <Text style={styles.articleTitle}>{title}</Text>
                    <Text style={styles.linkText}>{link}</Text>
                </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.contentContainer}>
                {isReaderMode ? (
                    readerContent ? (
                        <RenderHtml
                            contentWidth={width}
                            source={{ html: readerContent }}
                            renderers={{
                                img: ({ TDefaultRenderer, ...props }) => (
                                    <Image
                                        source={{ uri: props.src }}
                                        style={[styles.articleImage, { width: width - 32, height: width * 0.6 }]}
                                    />
                                ),
                            }}
                            baseStyle={styles.articleText}
                            tagsStyles={{
                                a: {color: "#e3e3e3"},
                            }}
                        />
                    ) : (
                        <ActivityIndicator size="large" color={styles.accent} />
                    )
                ) : (
                    description.startsWith('<') ? (
                        <RenderHtml
                            contentWidth={width}
                            source={{ html: description }}
                            renderers={{
                                img: ({ TDefaultRenderer, ...props }) => (
                                    <Image
                                        source={{ uri: props.src }}
                                        style={[styles.articleImage, { width: width - 32, height: width * 0.6 }]}
                                    />
                                ),
                            }}
                            baseStyle={styles.articleText}
                        />
                    ) : (
                        <Text style={styles.articleText}>
                            {description.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))}
                        </Text>
                    )
                )}
            </ScrollView>

            <View style={styles.bottomToolbar}>
                <TouchableOpacity 
                    onPress={toggleReaderMode} 
                    style={[styles.toolbarButton, isReaderMode && styles.toolbarButtonActive]}
                >
                    <Image 
                        source={require('../assets/readermode.png')} 
                        style={[styles.toolbarIcon, isReaderMode && styles.toolbarIconActive]} 
                    />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={makeSummary} 
                    style={styles.toolbarButton}
                >
                    <Image 
                        source={require('../assets/summary.png')} 
                        style={styles.toolbarIcon} 
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={sharePost}
                    style={styles.toolbarButton}
                >
                    <Image
                        source={require('../assets/share.png')} 
                        style={styles.toolbarIcon}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFavorite} style={styles.toolbarButton}>
                    <Image 
                        source={isFavorited ? require('../assets/favorited.png') : require('../assets/favorite.png')} 
                        style={[styles.toolbarIcon, isFavorited && styles.toolbarIconActive]}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleRead} style={styles.toolbarButton}>
                    <Text style={[styles.iconText, { color: isRead ? "blue" : "gray" }]}>●</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Summary</Text>
                            <TouchableOpacity 
                                onPress={() => setModalVisible(false)}
                                style={styles.modalCloseButton}
                            >
                                <Text style={styles.modalCloseText}>×</Text>
                            </TouchableOpacity>
                        </View>
                        {loading ? (
                            <ActivityIndicator size="large" color={styles.accent} />
                        ) : (
                            <Text style={styles.modalText}>{summary}</Text>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}