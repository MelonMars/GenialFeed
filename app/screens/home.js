import React, {memo, useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Button,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Image,
} from 'react-native';
import {auth, db} from '../firebase';
import {signOut} from 'firebase/auth';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {DraxProvider, DraxView} from 'react-native-drax';
import {themes} from '../widgets/themes';
import {createStyles} from '../widgets/styles';

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
    const [draggables, setDraggables] = useState(feeds.map(feed => feed));
    const [receptacles, setReceptacles] = useState(folders.map((folder, index) => ({ id: index + 1, items: [] })));
    const [draggingItem, setDraggingItem] = useState(null);
    const [expandedFolders, setExpandedFolders] = React.useState({});
    const [currentTheme, setCurrentTheme] = useState(themes["dark"]);
    const [styles, setStyles] = useState(createStyles(currentTheme));

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

    const fetchFeedsAndFolders = async () => {
        setLoading(true);
        try {
            console.log("Getting data snap");
            console.log("DB:", db);
            console.log("User ID:", userId);
            const dataSnapshot = await getDoc(doc(db, 'userData', userId));
            console.log("Got Data Snap!");
            const feedsData = dataSnapshot.exists() ? dataSnapshot.data().feeds : {};
            setDataFeeds(feedsData);

            console.log("Feed Data", feedsData);
            const feedItems = Object.keys(feedsData).filter(key =>
                Array.isArray(feedsData[key]) && feedsData[key][0]?.type === 'feed'
            );
            const folderItems = Object.keys(feedsData).filter(key =>
                typeof feedsData[key] === 'object' && 'feeds' in feedsData[key]
            );

            setFeeds(feedItems.sort());
            setFolders(folderItems);
        } catch (error) {
            console.error("Error fetching feeds: ", error);
        } finally {
            setLoading(false);
            console.log("Folders:", folders);
            console.log("Feeds:", feeds);
        }
    };


    const addFeed = async () => {
        setLoading(true);
        try {
            const feedTitle = await showInputModal("Enter feed name:");
            let feedUrl = await showInputModal("Enter feed url:");
            feedUrl = feedUrl.replace(" ", "");

            const response = await fetch("http://192.168.56.1:8000/checkFeed/?feedUrl=" + feedUrl);
            const feed = await response.json();

            if (feed.response === "BOZO") {
                const response = await fetch("http://192.168.56.1:8000/makeFeed/?feedUrl=" + feedUrl);
                const feed2 = await response.json();
                if (feed2.response === "BOZO") {
                    alert("INVALID FEED URL");
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
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    const addFolder = async () => {
        setLoading(true);
        try {
            const folderName = await showInputModal("Enter folder name:");
            const dataSnapshot = await getDoc(doc(db, 'userData', userId));
            const updates = {};
            updates[`feeds.${folderName}`] = [{ feeds: {}, type: "folder" }];
            await updateDoc(dataSnapshot.ref, updates);
            await fetchFeedsAndFolders();
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    }

    const fetchFeed = async (url) => {
        try {
            const response = await fetch("http://192.168.56.1:8000/feed?feed=" + url);
            console.log(url)
            const feedData = await response.json();
            navigation.navigate('Feed', {feedData, currentTheme});
            console.log(feedData);
        } catch (e) {
            alert("Unable to fetch (in fetchFeed): " + e);
        }
    }

    const handleDrop = async (draggedItem, folder) => {
        console.log("Got drop!");
        try {
            const dataSnapshot = await getDoc(doc(db, 'userData', userId));
            const updates = {};

            console.log("Data Feed:", dataFeeds, "Folder:", folder, "Data feed folder:", dataFeeds[folder]);
            if (dataFeeds[folder]["feeds"]) {
                console.log("Dragged Snap:",dataSnapshot.data().feeds[draggedItem][0]);
                console.log("Data Snap:",dataSnapshot);
                updates[`feeds.${folder}.feeds.${draggedItem}`] = dataSnapshot.data().feeds[draggedItem][0];
                await updateDoc(dataSnapshot.ref, updates);
                await fetchFeedsAndFolders();
                alert(`Moved ${draggedItem} to ${folder}`);

                setDraggables(prevDraggables => prevDraggables.filter(item => item !== draggedItem));

                setReceptacles(prevReceptacles =>
                    prevReceptacles.map(receptacle => {
                        if (receptacle.id === folder) {
                            return { ...receptacle, items: [...receptacle.items, draggedItem] };
                        }
                        return receptacle;
                    })
                );
            }
        } catch (error) {
            console.error("Error moving feed to folder: ", error);
        }
    };

    useEffect(() => {
        const uniqueDraggables = Array.from(new Set(draggables));

        if (uniqueDraggables.length !== draggables.length ||
            !uniqueDraggables.every((item, index) => item === draggables[index])) {
            setDraggables(uniqueDraggables);
        }
    }, [draggables]);


    const handleDragEnd = (payload) => {
        if (!receptacles.some(receptacle => receptacle.items.includes(payload))) {
            setDraggables((prevDraggables) => [...prevDraggables, payload]);
        }
    };

    const handleDeleteItem = async (item) => {
        console.log("Deleting item:", item);
    };

    const FolderItem = ({ folder, toggleFolderExpansion, expandedFolders }) => {
        return (
            <View style={styles.folderContainer}>
                <TouchableOpacity
                    style={styles.folderHeader}
                    onPress={() => toggleFolderExpansion(folder)}
                >
                    <Text style={{color: currentTheme.text}}>{folder}</Text>
                    <Text style={{color: currentTheme.text}}>{expandedFolders[folder] ? '-' : '+'}</Text>
                </TouchableOpacity>
                {expandedFolders[folder] && (
                    <View style={styles.folder}>
                        {expandedFolders[folder] && (
                        <View style={styles.folder}>
                            {renderDraggables(feeds.filter(feed => dataFeeds[folder].feeds[feed]))}
                        </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const FeedItem = memo(({ item, handleDeleteItem, handleDragEnd }) => {
            const [swipeOffset, setSwipeOffset] = useState(0);
            const [favicon, setFavicon] = useState(null);
            useEffect(() => {
                const fetchFavicon = async () => {
                    try {
                        const response = await fetch(`https://www.google.com/s2/favicons?domain=${dataFeeds[item][0].feed}`);
                        if (response.ok) {
                            setFavicon(response.url);
                        } else {
                            setFavicon(null);
                        }
                    } catch (error) {
                        setFavicon(null);
                    }
                };
                fetchFavicon();
            }, [item]);

            const panResponder = PanResponder.create({
                onMoveShouldSetPanResponder: (evt, gestureState) => {
                    return Math.abs(gestureState.dx) > 10; // Reduce the threshold for starting the pan responder
                },
                onPanResponderMove: (evt, gestureState) => {
                    setSwipeOffset(gestureState.dx); // Allow full movement without limiting to -100
                },
                onPanResponderRelease: (evt, gestureState) => {
                    if (gestureState.dx < -50) {
                        handleDeleteItem(item);
                    } else {
                        setSwipeOffset(0);
                    }
                },
            });

            return (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.deleteContainer, { opacity: swipeOffset < -50 ? 1 : 0 }]}>
                        <Text style={styles.deleteText}>Delete</Text>
                    </View>
                    <DraxView
                        longPressDelay={250}
                        key={item}
                        style={[styles.draggable, { transform: [{ translateX: swipeOffset }] }]}
                        onDragEnd={() => {
                            console.log("Item dragged:", item.dragged);
                            handleDragEnd(item);
                        }}
                        payload={item}
                        onDragStart={() => (item.dragged = false)}
                        onDragOver={event => {
                            if (event.dragTranslation.x || event.dragTranslation.y) {
                                item.dragged = true;
                            }
                        }}
                        {...panResponder.panHandlers}
                    >
                        <TouchableOpacity
                            onPress={async () => {
                                console.log("Pressed:", dataFeeds[item][0].feed);
                                await fetchFeed(dataFeeds[item][0].feed);
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
                    </DraxView>
                </View>
            );
        });

    const renderFeedItem = ({ item, index }) => {
        return (<FeedItem item={item} handleDeleteItem={handleDeleteItem} handleDragEnd={handleDragEnd} />);
    };

    const renderDraggables = (items) => {
        return items.map((item, index) => (
            renderFeedItem({ item, index })
        ));
    };

    useEffect(() => {
        setDraggables(feeds.map(feed => feed));
        setReceptacles(folders.map((folder, index) => ({ id: folder, items: [] })));
    }, [feeds, folders]);

    const toggleDark = () => {
        if (currentTheme === themes["dark"]) {
            setCurrentTheme(themes["light"]);
        } else {
            setCurrentTheme(themes["dark"]);
        }
        setStyles(createStyles(currentTheme));
        console.log("Set theme to: ", currentTheme);
    }

    useEffect(() => {
        setStyles(createStyles(currentTheme));
    }, [currentTheme]);

    return (
        <GestureHandlerRootView style={[styles.pageContainer, { flex: 1 }]}>
            <DraxProvider>
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
                        {renderDraggables(draggables)}
                    </View>

                    <View style={styles.receptaclesContainer}>
                        {receptacles.map((receptacle) => (
                            <DraxView
                                key={receptacle.id}
                                style={styles.receptacle}
                                onReceiveDragDrop={({ dragged: { payload } }) => {
                                    console.log(`Item "${payload}" dropped into Receptacle ${receptacle.id}`);
                                    handleDrop(payload, receptacle.id);
                                }}
                            >
                                <FolderItem
                                    folder={receptacle.id}
                                    toggleFolderExpansion={toggleFolderExpansion}
                                    expandedFolders={expandedFolders}
                                />
                            </DraxView>
                        ))}
                    </View>
                </ScrollView>
            </DraxProvider>

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
                                <Text>Choose an option:</Text>
                                <TouchableOpacity onPress={addFeed}>
                                    <Text>Add Feed</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={addFolder}>
                                    <Text>Add Folder</Text>
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
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>
                        <Text>
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
                        <Button title="Submit" onPress={handleInputSubmit} />
                    </View>
                </View>
            </Modal>

            {loading && <ActivityIndicator size="large" color="#0000ff" />}
        </GestureHandlerRootView>
    );
}
