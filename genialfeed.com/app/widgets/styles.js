import { StyleSheet } from 'react-native';

export const createStyles = (theme) => {
    if (!theme || typeof theme !== 'object' || theme === null) {
        throw new TypeError('Invalid theme object');
    } else {
        console.log("Theme is:", JSON.stringify(theme));
    }

    return StyleSheet.create({
        folderItem: {
            padding: 10,
            backgroundColor: theme.primLight,
            marginVertical: 5,
            borderRadius: 5,
        },
        modalBackdrop: {
            flex: 1,
            backgroundColor: theme.modalOverlay,
        },
        modal: {
            position: 'absolute',
            width: 150,
            padding: 10,
            backgroundColor: theme.primLight,
            borderRadius: 5,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        },
        inputModal: {
            padding: 20,
            backgroundColor: theme.primLight,
            borderRadius: 5,
            alignItems: 'center',
        },
        input: {
            borderWidth: 1,
            borderColor: theme.text,
            padding: 5,
            width: 200,
            marginVertical: 10,
            color: theme.text,
        },
        modalBackground: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        modalContent: {
            width: 300,
            padding: 20,
            backgroundColor: theme.primary,
            borderRadius: 5,
        },
        folder: {
            padding: 10,
            backgroundColor: theme.primLight,
            borderRadius: 5,
            marginVertical: 5,
        },
        container: {
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 20,
        },
        hidden: {
            opacity: 0,
        },
        folderContainer: {
            width: '60%',
            marginVertical: 5,
        },
        folderHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.primLight,
            padding: 10,
            borderRadius: 5,
        },
        draggablesContainer: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            width: '100%',
        },
        draggable: {
            width: '60%',
            height: 50,
            backgroundColor: theme.primary,
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingHorizontal: 10,
            color: theme.text,
            textAlign: 'center',
            borderRadius: 10,
        },
        receptaclesContainer: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
            width: '100%',
        },
        receptacle: {
            width: '60%',
            height: 'auto',
            backgroundColor: theme.primDark,
            justifyContent: 'center',
            alignItems: 'flex-start',
            textAlign: 'center',
            marginVertical: 5,
            padding: 10,
        },
        receptacleItem: {
            color: theme.text,
            fontSize: 14,
            marginVertical: 2,
        },
        deleteContainer: {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 100,
            backgroundColor: 'red',
            justifyContent: 'center',
            alignItems: 'center',
        },
        deleteText: {
            color: theme.text,
        },
        themeButton: {
            padding: 10,
            borderRadius: 5,
            width: 50,
            alignSelf: 'flex-start',
            marginHorizontal: 10,
            
        },
        feedView: {
            backgroundColor: theme.primLight,
            borderColor: theme.primDark,
            borderWidth: 2,
            padding: 10,
        },
        feedText: {
            textAlign: 'center',
            alignContent: 'center',
        },
        icon: {
            width: 24,
            height: 24
        },
        pageContainer: {
            backgroundColor: theme.background,
            color: theme.text,
        },
        normalText: {
            color: theme.text,
            textAlign: 'center',
            alignContent: 'center',
        },
        feedTitle: {
            backgroundColor: theme.primLight,
            padding: 10,
            marginVertical: 5,
            borderRadius: 5,
            color: theme.text,
            textAlign: 'center',
            alignContent: 'center',
            fontSize: 18,
        },
        feedIcon: {
            backgroundColor: theme.primLight,
            padding: 10,
            borderRadius: 4,
            borderWidth: 2,
        },
    });
};