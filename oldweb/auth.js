import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged,signOut,createUserWithEmailAndPassword,signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js"
import { collection, addDoc, getFirestore, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"

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
const db = getFirestore(app);

auth.languageCode = 'en';

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Logged in");
        const loggedOutButtons = document.querySelectorAll('.loggedOut');
        loggedOutButtons.forEach(loggedOutButton => {
            loggedOutButton.style.display = "none";
        })
        const loggedInButtons = document.querySelectorAll('.loggedIn');
        loggedInButtons.forEach(loggedInButton => {
            loggedInButton.style.display = "block";
        })
        const logoutButton = document.getElementById('logout');
        logoutButton.addEventListener('click', e => {
            auth.signOut()
            console.log('Logged out');
        });
    } else {
        const loggedOutButtons = document.querySelectorAll('.loggedOut');
        loggedOutButtons.forEach(loggedOutButton => {
            loggedOutButton.style.display = "block";
        })
        const loggedInButtons = document.querySelectorAll('.loggedIn');
        loggedInButtons.forEach(loggedInButton => {
            loggedInButton.style.display = "none";
        })
        const googleProvider = new GoogleAuthProvider();

        const googleLogin = document.getElementById('google-login-btn');
        googleLogin.addEventListener('click', function(){
            signInWithPopup(auth, googleProvider)
                .then(async (result) => {
                    const user = result.user;
                    const userId = user.uid;

                    const docRef = doc(db, "userData", userId);
                    const docSnap = await getDoc(docRef);

                    if (!docSnap.exists()) {
                        try {
                            await setDoc(docRef, {
                                name: user.displayName,
                                feeds: []
                            })
                        } catch (e) {
                            console.log("Error creating document", e)
                        }
                    } else {
                        console.log("User already exists, just logging in again!");
                    }
                }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorMessage);
            });

        })

        let isSignUpMode = true;
        const signUpForm = document.getElementById("emailPasswordLogin");

        function emailPasswordSignup(e) {
            e.preventDefault();
            const email = document.getElementById("emailInput").value;
            const password = document.getElementById("passwordInput").value;
            if (isSignUpMode) {
                createUserWithEmailAndPassword(auth, email, password)
                    .then(async (userCredential) => {
                        const user = userCredential.user;
                        const userID = user.uid;

                        const docRef = doc(db, "userData", userID);
                        const docSnap = await getDoc(docRef);

                        if (!docSnap.exists()) {
                            try {
                                await setDoc(docRef, {
                                    name: user.displayName,
                                    feeds: []
                                })
                            } catch (e) {
                                console.log("Error creating document", e)
                            }
                        } else {
                            console.log("User already exists, just logging in again!");
                        }
                        console.log("Signed up as: ", user);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            } else {
                signInWithEmailAndPassword(auth, email, password)
                    .then(async (userCredential) => {
                        const user = userCredential.user;
                        const userID = user.uid;

                        const docRef = doc(db, "userData", userID);
                        console.log("Got docref, getting docsnap");
                        const docSnap = await getDoc(docRef);

                        if (!docSnap.exists()) {
                            console.log("Need to make new user");
                            try {
                                await setDoc(docRef, {
                                    name: user.displayName,
                                    feeds: []
                                })
                            } catch (e) {
                                console.log("Error creating document", e)
                            }
                        } else {
                            console.log("User already exists, just logging in again!");
                        }
                        console.log("Signed up as: ", user);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }
        }

        const toggleUpInEmail = document.getElementById("toggleUpInEmail");

        function changeSignUpSignIn() {
            isSignUpMode = !isSignUpMode;
            if (isSignUpMode) {
                toggleUpInEmail.textContent = "I already have an account!"
                signUpForm.querySelector('button[type="submit"]').textContent = "Sign up!";
            } else {
                toggleUpInEmail.textContent = "I need an account!"
                signUpForm.querySelector('button[type="submit"]').textContent = "Sign in!";
            }
        }

        signUpForm.addEventListener("submit", emailPasswordSignup);
        toggleUpInEmail.addEventListener("click", changeSignUpSignIn);
    }
});

const colorToggle = document.getElementById("colorToggle");

function toggleColor() {
    const toggleElem = document.getElementById("colorToggle");
    const isLightMode = document.body.classList.toggle('light-mode');

    for (let element of document.getElementsByTagName('*')) {
        if (isLightMode) {
            element.classList.add('light-mode');
        } else {
            element.classList.remove('light-mode');
        }
    }

    localStorage.setItem('lightMode', isLightMode ? 'enabled' : 'disabled');

    toggleElem.innerText = isLightMode ? "🌑" : "☀️";
}

document.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('lightMode');
    if (savedMode === 'enabled') {
        document.body.classList.add('light-mode');
        document.getElementById("colorToggle").innerText = "🌛";
    } else {
        document.body.classList.remove('light-mode');
        document.getElementById("colorToggle").innerText = "☀️";
    }
});

colorToggle.addEventListener('click', toggleColor);
if (localStorage.getItem('lightMode') === 'enabled') {
    document.body.classList.add('light-mode');
}