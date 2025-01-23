import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Linking,
    Alert,
    Dimensions,
    ScrollView,
    Button,
    ActivityIndicator,
    Modal,
    StyleSheet,
    Image,
} from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import * as WebBrowser from 'expo-web-browser';
import RenderHtml from 'react-native-render-html';

export default function FeedPage({ route }) {
    const { description, title, link, styles } = route.params;
    const { width } = Dimensions.get('window');
    const [isReaderMode, setIsReaderMode] = useState(false);
    const [readerContent, setReaderContent] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const sleep = async (timeout) => {
        return new Promise(resolve => setTimeout(resolve, timeout));
    };

    const openLink = async () => {
        try {
            if (await InAppBrowser.isAvailable()) {
                const result = await InAppBrowser.open(link, {
                    dismissButtonStyle: 'cancel',
                    preferredBarTintColor: '#453AA4',
                    preferredControlTintColor: 'white',
                    readerMode: false,
                    animated: true,
                    modalPresentationStyle: 'fullScreen',
                    modalTransitionStyle: 'coverVertical',
                    modalEnabled: true,
                    enableBarCollapsing: false,
                    showTitle: true,
                    toolbarColor: '#6200EE',
                    secondaryToolbarColor: 'black',
                    navigationBarColor: 'black',
                    navigationBarDividerColor: 'white',
                    enableUrlBarHiding: true,
                    enableDefaultShare: true,
                    forceCloseOnRedirection: false,
                    animations: {
                        startEnter: 'slide_in_right',
                        startExit: 'slide_out_left',
                        endEnter: 'slide_in_left',
                        endExit: 'slide_out_right'
                    },
                    headers: {
                        'my-custom-header': 'my custom header value'
                    }
                });
                await sleep(800);
                Alert.alert(JSON.stringify(result));
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
            const response = await fetch('https://api.genialfeed.com:8000/getSummary/?link=' + link);
            const summData = await response.json();
            if (summData.result === "ERROR") {
                setSummary("Couldn't make summary!");
            } else {
                console.log(summData);
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

    return (
        <View style={[styles.pageContainer, { flex: 1 }]} >
            <TouchableOpacity onPress={openLink}>
                <Text style={styles.feedTitle}>{title}</Text>
            </TouchableOpacity>
            <ScrollView>
                {isReaderMode ? (
                    readerContent ? (
                        <RenderHtml
                            contentWidth={width}
                            source={{ html: readerContent }}
                            renderers={{
                                img: ({ TDefaultRenderer, ...props }) => (
                                    <Image
                                        source={{ uri: props.src }}
                                        style={{ width: props.width || 200, height: props.height || 200 }}
                                    />
                                ),
                            }}
                            baseStyle={styles.normalText}
                        />
                    ) : (
                        <ActivityIndicator size="large" color="#0000ff" />
                    )
                ) : (
    description.startsWith('<') ? (
        <RenderHtml
            contentWidth={width}
            source={{ html: description }}
            style={styles.normalText}
            renderers={{
                img: ({ TDefaultRenderer, ...props }) => (
                    <Image
                        source={{ uri: props.src }}
                        style={{ width: props.width || 200, height: props.height || 200 }}
                    />
                ),
            }}
            baseStyle={styles.normalText}
            />
        ) : (
            <Text style={styles.normalText}>{description.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))}</Text>
        )
    )}
            </ScrollView>
            <View style={{ position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row' }}>
                <TouchableOpacity onPress={toggleReaderMode} style={{ flex: 1, padding: 10, backgroundColor: styles.primLight, borderRadius: 4, borderWidth: 2, alignItems: 'center' }}>
                    <Image source={ require('../assets/readermode.png') } style={{ width: 24, height: 24 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={makeSummary} style={{ flex: 1, padding: 10, backgroundColor: styles.primLight, borderRadius: 4, borderWidth: 2, alignItems: 'center' }}>
                    <Image source={ require('../assets/summary.png') } style={{ width: 24, height: 24 }} />
                </TouchableOpacity>
            </View>
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : (
                            <Text style={styles.normalText}>{summary}</Text>
                        )}
                        <Button title="Close" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 5,
        alignItems: 'center',
    },
});