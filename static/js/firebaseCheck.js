import { getDatabase, ref, onValue } from "firebase/database";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR-PROJECT.firebaseio.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "SENDER-ID",
  appId: "APP-ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const connectedRef = ref(db, ".info/connected");

onValue(connectedRef, (snapshot) => {
  const isConnected = snapshot.val();
  if (isConnected === true) {
    console.log("✅ Firebase is connected");
  } else {
    console.log("❌ Firebase is disconnected");
  }
});
