import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Button,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Image,
} from 'react-native';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import {deleteField, doc, getDoc, updateDoc} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { themes } from '../widgets/themes';
import { createStyles } from '../widgets/styles';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
    const [userId, setUserId] = useState(null);
    const [addItemVisible, setAddItemVisible] = useState(false);
    const [addItemPosition, setAddItemPosition] = useState({ top: 0, left: 0 });
    const [inputVisible, setInputVisible] = useState(false);
    const [inputPrompt, setInputPrompt] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const addButtonRef = useRef(null);
    const [inputResolver, setInputResolver] = useState(null);
    const [feeds, setFeeds] = useState([]);
    const [folders, setFolders] = useState([]);
    const [dataFeeds, setDataFeeds] = useState([]);
    const navigation = useNavigation();
    const [currentTheme, setCurrentTheme] = useState(themes["dark"]);
    const [styles, setStyles] = useState(createStyles(currentTheme));
    const [selectedFeed, setSelectedFeed] = useState(null);
    const [folderModalVisible, setFolderModalVisible] = useState(false);
    const [draggables, setDraggables] = useState([]);
    const [receptacles, setReceptacles] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({});

    const toggleFolderExpansion = (id) => {
        setExpandedFolders((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    useEffect(() => {
        const user = auth.currentUser;
        if (user) setUserId(user.uid);
    }, []);

    useEffect(() => {
        if (userId === null) return;
        fetchFeedsAndFolders();
    }, [userId]);

    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleAddItem = () => {
        addButtonRef.current.measure((fx, fy, width, height, px, py) => {
            setAddItemPosition({ top: py + height, left: px });
        });
        setAddItemVisible(true);
    };

    const handleCloseAddItem = () => {
        setAddItemVisible(false);
    };

    const handleCloseInput = () => {
        setInputVisible(false);
        setLoading(false);
    };

    const showInputModal = (prompt) => {
        setAddItemVisible(false);
        setInputPrompt(prompt);
        setInputVisible(true);

        return new Promise((resolve) => {
            setInputResolver(() => resolve);
        });
    };

    const handleInputSubmit = () => {
        if (inputResolver) {
            inputResolver(inputValue);
            setInputValue('');
            setInputVisible(false);
        }
    };

    const FolderItem = ({ folder, toggleFolderExpansion, expandedFolders, dataFeeds, renderDraggables, currentTheme, styles }) => {
        const folderFeeds = Object.keys(dataFeeds[folder].feeds || {});
        console.log(`Folder: ${folder}`, folderFeeds, dataFeeds[folder].feeds);
        return (
            <View style={styles.folderContainer}>
            <TouchableOpacity
                style={styles.folderHeader}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                toggleFolderExpansion(folder);
                }}
            >
                <Text style={{color: currentTheme.text}}>{folder}</Text>
                <Text style={{color: currentTheme.text}}>{expandedFolders[folder] ? '-' : '+'}</Text>
            </TouchableOpacity>
            {expandedFolders[folder] && (
                <View style={styles.folder}>
                {renderDraggables(folderFeeds, folder)}
                </View>
            )}
            </View>
        );
    };

    const fetchFeedsAndFolders = async () => {
        setLoading(true);
        try {
            const dataSnapshot = await getDoc(doc(db, 'userData', userId));
            if (dataSnapshot.exists()) {
                const feedsData = dataSnapshot.data().feeds || {};
                setDataFeeds(feedsData);

                const feedItems = Object.keys(feedsData).filter(key =>
                    Array.isArray(feedsData[key]) && feedsData[key][0]?.type === 'feed' && feedsData[key][0]?.feed !== null
                );
                const folderItems = Object.keys(feedsData).filter(key =>
                    typeof feedsData[key] === 'object' && 'feeds' in feedsData[key]
                );

                setFeeds(feedItems.sort());
                setFolders(folderItems);
            } else {
                setDataFeeds([]);
                setFeeds([]);
                setFolders([]);
            }
        } catch (error) {
            console.error("Error fetching feeds: ", error);
        } finally {
            setLoading(false);
        }
    };

    const addFeed = async () => {
        setLoading(true);
        try {
            let feedTitle = await showInputModal("Enter feed name:");
            feedTitle = feedTitle.replace(/[^a-zA-Z0-9 ]/g, '');
            let feedUrl = await showInputModal("Enter feed url:");
            feedUrl = feedUrl.replace(" ", "");
            const requUrl = "https://api.genialfeed.com:8000/checkFeed/?feedUrl=" + feedUrl;
            console.log("Sending request to:", requUrl);
            const response = await fetch(requUrl, {
                method: 'GET',
                headers: {
                    'accept': 'application/json'
                }
            });
            const feed = await response.json();

            if (feed.response === "BOZO") {
                const response = await fetch("https://api.genialfeed.com:8000/makeFeed/?feedUrl=" + feedUrl + "&userId=" + userId);
                const feed2 = await response.json();
                if (feed2.response === "BOZO") {
                    alert("INVALID FEED URL");
                } else if (feed2.response === "TOKENS") {
                    alert("Not enough tokens to add feed!");
                } else {
                    const validFeedUrl = feed.response;
                    const dataSnapshot = await getDoc(doc(db, 'userData', userId));
                    const updates = {};
                    updates[`feeds.${feedTitle}`] = [{ feed: validFeedUrl, type: "feed"}];
                    await updateDoc(dataSnapshot.ref, updates);
                    await fetchFeedsAndFolders();
                }
            } else {
                const validFeedUrl = feed.response;
                const dataSnapshot = await getDoc(doc(db, 'userData', userId));
                const updates = {};
                updates[`feeds.${feedTitle}`] = [{ feed: validFeedUrl, type: "feed"}];
                await updateDoc(dataSnapshot.ref, updates);
                await fetchFeedsAndFolders();
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (e) {
            console.log(e.name, e.message);
            alert("Unable to add feed! Check your network connection and try again!");
        }
        setLoading(false);
    };

    const addFolder = async () => {
        setLoading(true);
        try {
            const folderName = await showInputModal("Enter folder name:");
            const dataSnapshot = await getDoc(doc(db, 'userData', userId));
            const updates = {};
            updates[`feeds.${folderName}`] = {feeds: {}};
            await updateDoc(dataSnapshot.ref, updates);
            await fetchFeedsAndFolders();
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    }

    const fetchFeed = async (url) => {
        try {
            const response = await fetch("https://api.genialfeed.com:8000/feed?feed=" + url);
            const feedData = await response.json();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            navigation.navigate('Feed', {feedData, currentTheme, userId});
        } catch (e) {
            alert("Unable to fetch (in fetchFeed): " + e);
        }
    }

    const handleMoveFeedToFolder = async (feedPath, folder) => {
        const feedName = feedPath.split('.').pop();
        if (folder === 'delete') {
            try {
                const dataSnapshot = await getDoc(doc(db, 'userData', userId));
                const updates = {};
                updates[`feeds.${feedPath}`] = deleteField();
                await updateDoc(dataSnapshot.ref, updates);
                await fetchFeedsAndFolders();
                alert(`Deleted ${feedName}`);
            } catch (error) {
                console.error("Error deleting feed: ", error);
            }
        } else if (folder === 'main') {
            try {
                const dataSnapshot = await getDoc(doc(db, 'userData', userId));
                const feedPathParts = feedPath.split('.');
                let feedData = dataSnapshot.data().feeds;
                feedPathParts.forEach(part => {
                    feedData = feedData[part];
                });
                console.log("feed data:", dataSnapshot.data().feeds["Folder2"]["feeds"]["Test"]);
                console.log("Feed path:", feedPath);
                if (feedData) {
                    const updates = {};
                    updates[`feeds.${feedName}`] = feedData;
                    updates[`feeds.${feedPath}`] = deleteField();
                    await updateDoc(dataSnapshot.ref, updates);
                    await fetchFeedsAndFolders();
                    alert(`Moved ${feedName} to main`);
                } else {
                    console.error("Feed data is undefined, cannot move feed to main.");
                }
            } catch (error) {
                console.error("Error moving feed to main: ", error);
            }
        } else {
            try {
                const dataSnapshot = await getDoc(doc(db, 'userData', userId));
                const feedData = dataSnapshot.data().feeds[feedPath];
                const updates = {};
                updates[`feeds.${folder}.feeds.${feedName}`] = feedData;
                updates[`feeds.${feedPath}`] = deleteField();
                await updateDoc(dataSnapshot.ref, updates);
                await fetchFeedsAndFolders();
                alert(`Moved ${feedName} to ${folder}`);
            } catch (error) {
                console.error("Error moving feed to folder: ", error);
            }
        }
    };

    const FeedItem = ({ item, folder }) => {
        const [favicon, setFavicon] = useState(null);
        const feedPath = folder ? `${folder}.feeds.${item}` : item;

        useEffect(() => {
            const fetchFavicon = async () => {
                try {
                    const feedUrl = folder ? dataFeeds[folder].feeds[item][0].feed : dataFeeds[item][0].feed;
                    const response = await fetch(`https://api.genialfeed.com:8000/getFavicon/?url=${feedUrl}`);
                    const respJson = await response.json();
                    if (respJson["favicon_url"] !== null) {
                        setFavicon(respJson["favicon_url"]);
                    } else {
                        setFavicon(null);
                    }
                    console.log("Favicon:", favicon);
                } catch (error) {
                    setFavicon(null);
                }
            };
            fetchFavicon();
        }, [item, folder]);

        return (
            <TouchableOpacity
                onLongPress={() => {
                    setSelectedFeed(feedPath);
                    setFolderModalVisible(true);
                }}
                onPress={async () => {
                    const feedUrl = folder ? dataFeeds[folder].feeds[item][0].feed : dataFeeds[item][0].feed;
                    await fetchFeed(feedUrl);
                }}
                style={styles.draggable}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={favicon ? { uri: favicon } : require('../assets/no-favicon.png')}
                        style={{ width: 16, height: 16, marginRight: 8 }}
                    />
                    <Text style={{ color: currentTheme.text }}>{item}</Text>
                </View>
            </TouchableOpacity>
        );
    };

        const renderFeedItem = ({ item, index }) => {
        return (<FeedItem item={item} />);
    };

    const renderDraggables = (items, folder = null) => {
        return items.filter(item => item !== null).map((item, index) => (
            <FeedItem key={index} item={item} folder={folder} />
        ));
    };

    useEffect(() => {
        setDraggables(feeds.map(feed => feed));
        setReceptacles(folders.map((folder, index) => ({ id: folder, items: [] })));
    }, [feeds, folders]);

    const toggleDark = () => {
        const newTheme = currentTheme === themes["dark"] ? themes["light"] : themes["dark"];
        setCurrentTheme(newTheme);
        setStyles(createStyles(newTheme));
    }

    useEffect(() => {
        setStyles(createStyles(currentTheme));
    }, [currentTheme]);

    return (
        <View style={[styles.pageContainer, { flex: 1 }]}>
            <View style={{ alignSelf: 'flex-start' }}>
                <TouchableOpacity onPress={toggleDark} style={styles.themeButton}>
                    <Image
                        source={require('../assets/light-mode.png')}
                        style={[styles.icon, { tintColor: currentTheme === themes["dark"] ? '#FFFFFF' : '#000000' }]}
                    />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={{color: currentTheme.text}}>Welcome to GenialFeed!</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={{color: currentTheme.text}}>Logout</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddItem} ref={addButtonRef}>
                    <Text style={{color: currentTheme.text}}>+</Text>
                </TouchableOpacity>

                <View style={styles.draggablesContainer}>
                    {renderDraggables(feeds)}
                </View>

                <View style={styles.receptaclesContainer}>
                    {folders.map((folder) => (
                        <FolderItem
                            key={folder}
                            folder={folder}
                            toggleFolderExpansion={toggleFolderExpansion}
                            expandedFolders={expandedFolders}
                            feeds={feeds}
                            dataFeeds={dataFeeds}
                            renderDraggables={renderDraggables}
                            currentTheme={currentTheme}
                            styles={styles}
                        />
                    ))}
                </View>
            </ScrollView>

            <Modal
                visible={addItemVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseAddItem}
            >
                <TouchableWithoutFeedback onPress={handleCloseAddItem}>
                    <View style={styles.modalBackdrop}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modal, addItemPosition]}>
                                <Text style={styles.normalText}>Choose an option:</Text>
                                <TouchableOpacity onPress={addFeed}>
                                    <Text style={styles.normalText}>Add Feed</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={addFolder}>
                                    <Text style={styles.normalText}>Add Folder</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={inputVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseInput}
            >
                <TouchableWithoutFeedback onPress={handleCloseInput}>
                    <View style={styles.modalBackground}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.normalText}>
                                    {inputPrompt}
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={inputPrompt}
                                    value={inputValue}
                                    onChangeText={setInputValue}
                                    onSubmitEditing={handleInputSubmit}
                                    autoCapitalize='none'
                                />
                                <Button title="Submit" onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    handleInputSubmit();
                                }} />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

    <Modal
        visible={folderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFolderModalVisible(false)}
    >
        <TouchableWithoutFeedback onPress={() => setFolderModalVisible(false)}>
            <View style={styles.modalBackground}>
                <TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                        <Text style={styles.normalText}>Move {selectedFeed} to:</Text>
                        {folders.concat(['delete', 'main']).map((folder) => (
                            <TouchableOpacity
                                key={folder}
                                onPress={() => {
                                    handleMoveFeedToFolder(selectedFeed, folder);
                                    setFolderModalVisible(false);
                                }}
                            >
                                <Text style={styles.normalText}>{folder}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
            {loading && <ActivityIndicator size="large" color="#0000ff" />}
        </View>
    );
}