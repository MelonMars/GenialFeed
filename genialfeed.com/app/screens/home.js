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
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';

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
    const { currentTheme } = useContext(ThemeContext);
    const [styles, setStyles] = useState(createStyles(currentTheme));
    const [selectedFeed, setSelectedFeed] = useState(null);
    const [folderModalVisible, setFolderModalVisible] = useState(false);
    const [draggables, setDraggables] = useState([]);
    const [receptacles, setReceptacles] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [modalInputValue, setModalInputValue] = useState(null);
    const [modalPrompt, setModalPrompt] = useState(null);
    const [currentAction, setCurrentAction] = useState(null);
    const [feedBeingAdded, setFeedBeingAdded] = useState(null);
    const [feedBeingAddedURL, setFeedBeingAddedURL] = useState(null);
    const [faviconCache, setFaviconCache] = useState({});
    const [isDragging, setIsDragging] = useState(false);
  

    const handleSubmitAction = async () => {
        setLoading(true);
        try {
            if (currentAction === 'addFeed') {
                // This whole thing is fugazi 
                if (!feedBeingAdded) {
                    console.log("Got modalInputValue:", modalInputValue);
                    let feedTitle = modalInputValue.replace(/[^a-zA-Z0-9 ]/g, '');
                    console.log("Feed title:", feedTitle);
                    setFeedBeingAdded(feedTitle);
                    let feedUrl = await showPrompt("Enter feed URL:");
                } else {
                const feedTitle = feedBeingAdded;
                let feedUrl = modalInputValue;
                console.log("Feed URL:", feedUrl);
                console.log("Feed title:", feedTitle);
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
                console.log("Feed response:", feed);
                setActionModalVisible(false);
                if (feed.response === "BOZO") {
                    console.log("Feed is bozo, trying to make it now");
                    const makeFeedResponse = await fetch("https://api.genialfeed.com:8000/makeFeed/?feedUrl=" + feedUrl + "&userId=" + userId);
                    const newFeed = await makeFeedResponse.json();
                    if (newFeed.response === "BOZO") {
                        alert("INVALID FEED URL");
                    } else {
                        console.log("Feed is not bozo, adding it now");
                        const validFeedUrl = newFeed.response;
                        console.log("Valid feed URL:", validFeedUrl);
                        const updates = {};
                        updates[`feeds.${feedTitle}`] = [{ feed: validFeedUrl, type: "feed" }];
                        await updateDoc(doc(db, 'userData', userId), updates);
                        await fetchFeedsAndFolders();
                        console.log("Done!")
                    }
                } else {
                    console.log("Feed is not bozo, adding it now");
                    const validFeedUrl = feed.response;
                    const dataSnapshot = await getDoc(doc(db, 'userData', userId));
                    const updates = {};
                    updates[`feeds.${feedTitle}`] = [{ feed: validFeedUrl, type: "feed" }];
                    await updateDoc(dataSnapshot.ref, updates);
                    await fetchFeedsAndFolders();
                }
            }
            } else if (currentAction === 'addFolder') {
                const folderName = modalInputValue;
                const updates = {};
                updates[`feeds.${folderName}`] = { feeds: {} };
                await updateDoc(doc(db, 'userData', userId), updates);
                await fetchFeedsAndFolders();
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while performing the action.");
        } finally {
            setFeedBeingAdded(null);
            setActionModalVisible(false);
            setLoading(false);
        }
    };

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

    // const handleAddItem = () => {
    //     addButtonRef.current.measure((fx, fy, width, height, px, py) => {
    //         setAddItemPosition({ top: py + height, left: px });
    //     });
    //     setAddItemVisible(true);
    // };
    const handleAddItem = async () => {
        setActionModalVisible(true);
        setModalPrompt('Choose an option:');
    };

    const showPrompt = (prompt) => {
        setModalPrompt(prompt);
        setActionModalVisible(true);
        return new Promise(resolve => {
            const submit = () => {
                resolve(modalInputValue);
                setActionModalVisible(false);
            };
            setModalInputValue('');
        });
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
                    style={[styles.folderHeader, { flexDirection: 'row', justifyContent: 'space-between', width: '100%' }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        toggleFolderExpansion(folder);
                    }}
                >
                    <Text style={{ color: currentTheme.text }}>{folder}</Text>
                    <Text style={{ color: currentTheme.text }}>{expandedFolders[folder] ? '-' : '+'}</Text>
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
        const [isLoading, setIsLoading] = useState(false);
        const feedPath = folder ? `${folder}.feeds.${item}` : item;
        const feedUrl = folder ? dataFeeds[folder].feeds[item][0].feed : dataFeeds[item][0].feed;
        const cacheKey = `favicon_${feedUrl}`;

        useEffect(() => {
            const fetchFavicon = async () => {
                if (isLoading) return;
                
                if (faviconCache[cacheKey]) return;

                try {
                    setIsLoading(true);
                    const response = await fetch(`https://api.genialfeed.com:8000/getFavicon/?url=${feedUrl}`);
                    const respJson = await response.json();
                    
                    setFaviconCache(prevCache => ({
                        ...prevCache,
                        [cacheKey]: respJson["favicon_url"]
                    }));
                } catch (error) {
                    setFaviconCache(prevCache => ({
                        ...prevCache,
                        [cacheKey]: null
                    }));
                    console.error("Error fetching favicon:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            if (!faviconCache[cacheKey] && !isLoading) {
                fetchFavicon();
            }
        }, [feedUrl, cacheKey, isLoading]);

        return (
            <TouchableOpacity
                onLongPress={() => {
                    setSelectedFeed(feedPath);
                    setFolderModalVisible(true);
                }}
                onPress={async () => {
                    await fetchFeed(feedUrl);
                }}
                style={styles.draggable}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={faviconCache[cacheKey] ? { uri: faviconCache[cacheKey] } : require('../assets/no-favicon.png')}
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

    useEffect(() => {
        setStyles(createStyles(currentTheme));
    }, [currentTheme]);

    return (
        <View style={[styles.pageContainer, { flex: 1 }]}>
            <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.addButtonContainer}>
            <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddItem}
                ref={addButtonRef}
            >
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
        </View>

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
                visible={actionModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setActionModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setActionModalVisible(false)}>
                    <View style={styles.modalBackground}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { marginBottom: 40 }]}>
                                <Text style={styles.normalText}>{modalPrompt}</Text>
                                {modalPrompt === 'Choose an option:' ? (
                                    <>
                                        <Button title="Add Feed" onPress={() => {
                                            setCurrentAction('addFeed');
                                            setModalPrompt('Enter feed name:');
                                        }} />
                                        <Button title="Add Folder" onPress={() => {
                                            setCurrentAction('addFolder');
                                            setModalPrompt('Enter folder name:');
                                        }} />
                                    </>
                                ) : (
                                    <>
                                        <TextInput
                                            style={styles.input}
                                            placeholder={modalPrompt}
                                            value={modalInputValue}
                                            onChangeText={setModalInputValue}
                                        />

                                        <Button title="Submit" onPress={async () => {
                                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            handleSubmitAction();
                                        }} />
                                    </>
                                )}
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
                    <View style={[styles.modalContent, { marginBottom: 40 }]}>
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