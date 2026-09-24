// Firebase project configuration derived from the uploaded google-services.json.
// Exposed on window so the public page can also work when index.html is opened directly.
window.firebaseConfig = {
  apiKey: "AIzaSyB3CywkjGgHrbWuz_0Y8itNVKEcV5aPdUY",
  authDomain: "alinasr-890e4.firebaseapp.com",
  databaseURL: "https://alinasr-890e4-default-rtdb.firebaseio.com",
  projectId: "alinasr-890e4",
  storageBucket: "alinasr-890e4.firebasestorage.app",
  messagingSenderId: "856869991035"
};

window.firebaseReady = Boolean(
  window.firebaseConfig.apiKey &&
  window.firebaseConfig.projectId &&
  window.firebaseConfig.databaseURL
);
