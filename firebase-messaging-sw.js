importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Paste your firebaseConfig here
firebase.initializeApp({
  apiKey: "AIzaSyD_VU2rmgNCbBKet0tvdVOQvFmyEYBoKPQ",
  authDomain: "penzen-prj.firebaseapp.com",
  projectId: "penzen-prj",
  storageBucket: "penzen-prj.firebasestorage.app",
  messagingSenderId: "961311504951",
  appId: "1:961311504951:android:afb790734f0dd45ba91db2"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // You can add a logo here later
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});