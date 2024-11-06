import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, getDoc, doc, updateDoc, setDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDkoQkl9adRsW67H_jT7bWpH9QDRU44wS4",
    authDomain: "linkaggregator-bb44b.firebaseapp.com",
    projectId: "linkaggregator-bb44b",
    storageBucket: "linkaggregator-bb44b.appspot.com",
    messagingSenderId: "99431625311",
    appId: "1:99431625311:web:bac65091e8c76f72faa1ea",
    measurementId: "G-6R2MPDR718"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app)

const linkContainer = document.getElementById("linkContainer");
const linkTemplate = document.getElementById("linkTemplate");
const loadingSpinner = document.getElementById('loadingSpinner');
const scrollDownBtn = document.getElementById("pageDownBtn");
const inputModal = document.getElementById("customPrompt");
scrollDownBtn.classList.add("hidden");
inputModal.classList.add("hidden");
console.log("Added class!")
let loading = false;
let currentFeed = "none";
let page = 1;

async function deleteFeed(feed, user) {
    console.log(feed);
    const dataSnap = await doc(db, 'userData', user.uid);
    await updateDoc(dataSnap, {
            [`feeds.${feed}`]: deleteField()
        });
}

async function renameFeed(feed, newName, user) {
    try {
        console.log(`Renaming feed ${feed} to ${newName}`);

        const dataSnap = await doc(db, 'userData', user.uid);
        const docData = await getDoc(dataSnap);

        if (docData.exists()) {
            const feedData = docData.data().feeds[feed];

            await updateDoc(dataSnap, {
                [`feeds.${feed}`]: deleteField()
            });
            await updateDoc(dataSnap, {
                [`feeds.${newName}`]: feedData
            });
            console.log(`Feed renamed from ${feed} to ${newName}`);
        } else {
            console.error('No such document!');
        }
    } catch (error) {
        console.error('Error renaming feed: ', error);
    }
}

function addFeedRightMenu(user) {
    const targets = document.querySelectorAll('.feedItem');
    const customMenu = document.getElementById('feedMenu');
    const feedDelete = document.getElementById("feedDelete");
    const feedRename = document.getElementById("feedRename");
    let currentTarget = null;

    targets.forEach(target => {
        target.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            currentTarget = e.currentTarget;

            let path = [];
            let el = currentTarget;

            while (el) {
                if (el.dataset.name) {
                    path.unshift(el.dataset.name);
                }
                el = el.parentElement.closest('.feedItem');
            }

            if (path.length > 0) {
                currentTarget = path.join('.');
            }

            customMenu.style.top = `${e.pageY}px`;
            customMenu.style.left = `${e.pageX}px`;
            customMenu.style.display = 'flex';
        });
    });

    document.addEventListener('click', function(e) {
        if (!customMenu.contains(e.target)) {
            customMenu.style.display = 'none';
        }
    });

    feedDelete.addEventListener('click', function() {
        if (currentTarget) {
            deleteFeed(currentTarget, user);
            customMenu.style.display = 'none';
        }
    });

    feedRename.addEventListener('click', function() {
        if (currentTarget) {
            const newName = prompt("Enter new name for the feed:");
            if (newName) {
                renameFeed(currentTarget, newName, user);
                customMenu.style.display = 'none';
            }
        }
    });
}

function openPost(link, title) {
    window.open(link, title, "width=600, height=400, scrollbars=yes")
}

async function feedClick(feed, feedDB) {
    try {
        console.log(feedDB);
        const data = feedDB[feed];
        console.log(data)
        for (let i=0;i<data.entries.length;i++) {
            const clone = document.importNode(linkTemplate.content, true);
            const titleElem = clone.querySelector('.Title');
            const linkElem = clone.querySelector(".titleLink");
            titleElem.textContent = data.entries[i].title;
            linkElem.href = "#";
            linkElem.onclick = function () {
                openPost(data.entries[i].link, titleElem.textContent = data.entries[i].title);
                return false;
            }
            linkContainer.appendChild(clone)
            console.log("Added Elem!");
        }
        console.log("Finished adding!");
    } catch (e) {
        console.error(e)
    } finally {
        loading = false;
        loadingSpinner.style.display = 'none';
    }
    scrollDownBtn.classList.remove('hidden');
}

async function folderClick(feeds, feedDB) {
    try {
        console.log(feedDB);
        console.log(feeds);

        for (let feed of feeds) {
            const data = feedDB[feed];
            console.log(data);

            for (let i = 0; i < data.entries.length; i++) {
                const clone = document.importNode(linkTemplate.content, true);
                const titleElem = clone.querySelector('.Title');
                const linkElem = clone.querySelector(".titleLink");
                titleElem.textContent = data.entries[i].title;
                linkElem.href = data.entries[i].link;
                linkContainer.appendChild(clone);
                console.log("Added Elem!");
            }
        }

        console.log("Finished adding all feeds!");
    } catch (e) {
        console.error(e);
    } finally {
        loading = false;
        loadingSpinner.style.display = 'none';
    }
    scrollDownBtn.classList.remove('hidden');
}

function renderFeedsAndFolders(feeds, feedList, feedDB) {
    feedList.innerHTML = '';

    for (const key in feeds) {
        const items = feeds[key];
        const isFolder = items[0].type === 'folder';

        if (isFolder) {
            const folderItem = document.createElement('li');
            folderItem.classList.add("feedItem");
            folderItem.textContent = key;
            folderItem.setAttribute('data-type', 'folder');
            folderItem.setAttribute('draggable', 'true');
            folderItem.setAttribute('data-name', key);
            folderItem.style.cursor = 'pointer';

            const arrow = document.createElement('span');
            arrow.classList.add('arrow');
            arrow.textContent = '►';  // Use ► for closed state
            arrow.style.cursor = 'pointer';
            arrow.style.marginRight = '5px';

            folderItem.prepend(arrow);

            const subList = document.createElement('ul');
            subList.setAttribute('data-folder', key);
            subList.style.display = 'none';

            for (const subKey in items[0].feeds) {
                const feedItem = document.createElement('li');
                feedItem.textContent = subKey;
                feedItem.setAttribute('data-type', 'feed');
                feedItem.setAttribute('draggable', 'true');
                feedItem.setAttribute('data-name', subKey);

                subList.appendChild(feedItem);
            }

            folderItem.appendChild(subList);
            feedList.appendChild(folderItem);

            arrow.addEventListener('click', function(e) {
                e.stopPropagation();
                if (subList.style.display === 'none') {
                    subList.style.display = 'block';
                    arrow.textContent = '▼';  // Use ▼ for open state
                } else {
                    subList.style.display = 'none';
                    arrow.textContent = '►';
                }
            });

            folderItem.addEventListener('click', function() {
                let subLis = subList.querySelectorAll("li");
                let feedNames = [];
                for (let li of subLis) {
                    feedNames.push(li.getAttribute('data-name'));
                }
                console.log("Folder click:", feedNames);
                folderClick(feedNames, feedDB);
            });
        } else {
            const feedItem = document.createElement('li');
            feedItem.classList.add("feedItem");
            feedItem.addEventListener('click', function() {
                feedClick(key, feedDB);
            });
            if (feedDB[key] === "FEEDBROKE") {
                feedItem.style.backgroundColor = 'red';
            }
            feedItem.textContent = key;
            feedItem.setAttribute('data-type', 'feed');
            feedItem.setAttribute('draggable', 'true');
            feedItem.setAttribute('data-name', key);

            feedList.appendChild(feedItem);
        }
    }
}

function collapseListButton(feeds, feedList) {
    document.getElementById('listToggleBtn').addEventListener('click', function () {
        const listItems = document.querySelectorAll('#feedList li');
        console.log(listItems);
        const isCollapsed = listItems[3].classList.contains('hidden');
        console.log(isCollapsed);
        listItems.forEach((item, index) => {
            if (index >= 3) {
                item.classList.toggle('hidden', !isCollapsed);
            }
        });

        this.textContent = isCollapsed ? 'Collapse List!' : 'Expand List';
        renderFeedsAndFolders(feeds, feedList)
    });
}

function flattenFeeds(obj) {
    const result = {};

    function traverse(current, parentKey = '') {
        for (const key in current) {
            if (current.hasOwnProperty(key)) {
                if (Array.isArray(current[key])) {
                    current[key].forEach(item => {
                        if (item.type === 'folder' && item.feeds) {
                            traverse(item.feeds, parentKey);
                        } else {
                            if (!result[parentKey + key]) {
                                result[parentKey + key] = [];
                            }
                            result[parentKey + key].push(item);
                        }
                    });
                } else {
                    traverse(current[key], key + '.');
                }
            }
        }
    }
    traverse(obj);
    return result;
}

async function createFeedDB(feedList, feeds) {
    let feedData = {};
    feeds = flattenFeeds(feeds);
    console.log("feeds: ", feeds);
    for (let feed of Object.keys(feeds)) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/feed/?feed=${feeds[feed][0]["feed"]}&page=1`);
            let fdata = await response.json();
            feedData[feed] = fdata.response;
            console.log(`feedData ${feed}: `,feedData[feed])
        } catch (e) {
            alert("Unable to fetch (in createFeedDB)")
        }
    }

    console.log("feedData: ", feedData);
    return feedData;
}

let feedData = {}
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const listSpinner = document.getElementById('feedListSpinner');
            listSpinner.style.display = 'block';
            const dataSnapshot = await getDoc(doc(db, 'userData', user.uid));
            const data = dataSnapshot.data();
            let feeds = []
            try {
                feeds = data.feeds;
                if (!feeds || feeds.length === 0) {
                    const feedList = document.getElementById('feedList');
                    feedList.innerHTML = '<p>No feeds found</p>';

                    listSpinner.style.display = 'none';
                    return;
                }
                console.log(feeds)
            } catch (e) {
                const feedList = document.getElementById('feedList');
                feedList.innerHTML = '<p>No feeds found</p>';

                listSpinner.style.display = 'none';
                return;
            }
            const feedList = document.getElementById('feedList');

            feedData = await createFeedDB(feedList, feeds)
            listSpinner.style.display = 'none';
            console.log("feedDB: ",feedData);
            renderFeedsAndFolders(feeds, feedList, feedData);
            addFeedRightMenu(user);
            collapseListButton(feeds, feedList);
            let draggedItem = null;

            document.addEventListener('dragstart', function(event) {
                draggedItem = event.target;
                event.target.style.opacity = 0.5;
            });

            document.addEventListener('dragend', function(event) {
                event.target.style.opacity = '';
            });

            document.addEventListener('dragover', function(event) {
                event.preventDefault();
            });

            document.addEventListener('dragenter', function(event) {
                if (event.target.nodeName === 'LI' && event.target.getAttribute('data-type') === 'folder') {
                    event.target.style.background = 'lightblue';
                } else if (event.target.id === 'feedList') {
                    event.target.style.background = 'lightgreen';
                }
            });

            document.addEventListener('dragleave', function(event) {
                if (event.target.nodeName === 'LI' && event.target.getAttribute('data-type') === 'folder') {
                    event.target.style.background = '';
                } else if (event.target.id === 'feedList') {
                    event.target.style.background = '';
                }
            });

            document.addEventListener('drop', function(event) {
                event.preventDefault();
                if (event.target.nodeName === 'LI' && event.target.getAttribute('data-type') === 'folder') {
                    event.target.style.background = '';
                    const folderName = event.target.getAttribute('data-name');
                    const feedName = draggedItem.getAttribute('data-name');

                    console.log(`Dropped ${feedName} into ${folderName}`);

                    moveFeedToFolder(user.uid, feedName, folderName).then(() => {
                        const subList = event.target.querySelector('ul');
                        subList.appendChild(draggedItem);
                        console.log(`Successfully moved ${feedName} into ${folderName}`);
                    }).catch((error) => {
                        console.error('Error moving feed:', error);
                    });
                } else if (event.target.id === 'feedList') {
                    event.target.style.background = '';
                    const feedName = draggedItem.getAttribute('data-name');

                    console.log(`Dropped ${feedName} into root container`);

                    moveFeedToRoot(user.uid, feedName).then(() => {
                        const rootContainer = document.getElementById('feedList');
                        rootContainer.appendChild(draggedItem);
                        console.log(`Successfully moved ${feedName} into root container`);
                    }).catch((error) => {
                        console.error('Error moving feed to root:', error);
                    });
                }
            });

            async function moveFeedToFolder(userId, feedName, folderName) {
                console.log(`Moving feed ${feedName} to folder ${folderName}`);

                const userRef = doc(db, 'userData', userId);
                const userSnapshot = await getDoc(userRef);
                const userData = userSnapshot.data();
                console.log('Current user data:', userData);
                if (userData.feeds[feedName]) {
                    const feedData = userData.feeds[feedName];
                    console.log('Feed data to move:', feedData);
                    delete userData.feeds[feedName];
                    console.log('User data after deletion:', userData);
                    const folder = userData.feeds[folderName][0];
                    if (!folder.feeds) {
                        folder.feeds = {};
                    }
                    folder.feeds[feedName] = feedData;
                    console.log('User data after adding to folder:', userData);
                    await setDoc(userRef, userData);
                    console.log('Firestore updated successfully');
                } else {
                    console.log(`Feed ${feedName} does not exist in the root`);
                }
            }

            async function moveFeedToRoot(userId, feedName) {
                console.log(`Moving feed ${feedName} to root`);

                const userRef = doc(db, 'userData', userId);
                const userSnapshot = await getDoc(userRef);
                const userData = userSnapshot.data();
                console.log('Current user data:', userData);

                // Find the folder containing the feed
                let feedData = null;
                for (let folderName in userData.feeds) {
                    const folder = userData.feeds[folderName][0];
                    if (folder.feeds && folder.feeds[feedName]) {
                        feedData = folder.feeds[feedName];
                        delete folder.feeds[feedName];
                        console.log(`Feed ${feedName} found and removed from folder ${folderName}`);
                        break;
                    }
                }

                if (feedData) {
                    userData.feeds[feedName] = feedData;
                    console.log('User data after moving to root:', userData);
                    await setDoc(userRef, userData);
                    console.log('Firestore updated successfully');
                } else {
                    console.log(`Feed ${feedName} not found in any folder`);
                }
            }



        } catch (e) {
            console.error(e);
        }
    } else {
        window.location.href = "auth.html";
    }
});

document.addEventListener('DOMContentLoaded', (event) => {
    const widget = document.getElementById("feedAddWidget");
    let ignoreClick = false;

    document.addEventListener('click', function(event) {
        if (widget.classList.contains('show') && !widget.contains(event.target) && event.target.id !== 'feedAddWidget' && !ignoreClick) {
            widget.classList.remove('show');
        }
        ignoreClick = false;
    });

    document.getElementById('addContentBtn').addEventListener('click', function() {
        console.log("Feed adding");
        widget.classList.toggle("show");
        ignoreClick = true;
    });
});


async function addFeed() {
    const closeButton = document.getElementById("closeCustomPrompt");

    function getInput(prompt) {
        return new Promise((resolve, reject) => {
            inputModal.classList.remove('hidden');
            document.getElementById("promptInputLabel").innerText = prompt;

            function handleInput() {
                const inputValue = document.getElementById("promptInput").value;
                document.getElementById("promptInputSubmit").removeEventListener('click', handleInput);
                closeButton.removeEventListener('click', handleClose);
                inputModal.classList.add('hidden');
                resolve(inputValue);
            }

            function handleClose() {
                document.getElementById("promptInputSubmit").removeEventListener('click', handleInput);
                closeButton.removeEventListener('click', handleClose);
                inputModal.classList.add('hidden');
                reject(new Error("Modal closed"));
            }

            document.getElementById("promptInputSubmit").addEventListener('click', handleInput);
            closeButton.addEventListener('click', handleClose);
        });
    }

    try {
        const feedTitle = await getInput("Enter feed name:");
        const feedUrl = await getInput("Enter feed url:");
        inputModal.classList.add('hidden');

        loadingSpinner.style.display = 'block'
        console.log("http://127.0.0.1:8000/checkFeed/?feedUrl=" + feedUrl);
        const response = await fetch("http://127.0.0.1:8000/checkFeed/?feedUrl=" + feedUrl);
        const feed = await response.json();
        console.log(feedUrl);
        if (feed.response === "BOZO") {
            alert("INVALID FEED URL");
        } else {
            const validFeedUrl = feed.response;
            const dataSnapshot = await getDoc(doc(db, 'userData', auth.currentUser.uid));
            const updates = {};
            updates[`feeds.${feedTitle}`] = [{feed: validFeedUrl, type: "feed"}];
            await updateDoc(dataSnapshot.ref, updates);
            const data = dataSnapshot.data();
            const feeds = data.feeds;
            console.log(feeds);
            const feedList = document.getElementById('feedList');

            renderFeedsAndFolders(feeds, feedList, feedData);
        }
        loadingSpinner.style.display = 'none';
    } catch (e) {
        console.log(e);
    }
}

async function addFolder() {
    const folderTitle = prompt("Enter a folder title");

    const dataSnapshot = await getDoc(doc(db, 'userData', auth.currentUser.uid));
    const updates = {};
    updates[`feeds.${folderTitle}`] = [{ feeds: {}, type: "folder" }];
    await updateDoc(dataSnapshot.ref, updates);
    const data = dataSnapshot.data();
    const feeds = data.feeds;
    console.log(feeds)
    const feedList = document.getElementById('feedList');

    renderFeedsAndFolders(feeds, feedList);
}

function scrollDown() {
    page++;
    const feed = document.querySelector('.feedItem[data-type="feed"]').getAttribute('data-name');
    console.log(feed);
    feedClick(currentFeed, page, true);
}

window.addFeed = addFeed;
window.addFolder = addFolder;
window.scrollDown = scrollDown;

linkContainer.addEventListener('scroll', function () {
    if (linkContainer.scrollTop + linkContainer.clientHeight >= linkContainer.scrollHeight + 2 && !loading) {
        console.log("SCROLLED DOWN, EXPANDING!");
        page++;
        const feed = document.querySelector('.feedItem[data-type="feed"]').getAttribute('data-name');
        console.log(feed);
        feedClick(currentFeed, page, true);
    }
});