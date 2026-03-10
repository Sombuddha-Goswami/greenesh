// ===== FIREBASE CONFIGURATION =====
// Your Greenesh Firebase project config

const firebaseConfig = {
    apiKey: "AIzaSyCxQQVMURec4JrOcFpMvWWOblOFaBODtCM",
    authDomain: "greenesh-c7a6d.firebaseapp.com",
    projectId: "greenesh-c7a6d",
    storageBucket: "greenesh-c7a6d.firebasestorage.app",
    messagingSenderId: "810471186993",
    appId: "1:810471186993:web:3e6cf0d106c06cff2d2b10",
    measurementId: "G-H6JMR5QJJ3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();
