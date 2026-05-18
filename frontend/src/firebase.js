// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Thay thế bằng cấu hình Firebase của bạn từ Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyA3SwXlWHaeqW0HjVsoD8adcAx2g8CjbJM",
  authDomain: "coffee-manager-72ecb.firebaseapp.com",
  projectId: "coffee-manager-72ecb",
  storageBucket: "coffee-manager-72ecb.firebasestorage.app",
  messagingSenderId: "139282941271",
  appId: "1:139282941271:web:d1071673980ccc2a76aa12",
  measurementId: "G-6TB13R1277"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = 'vi'; // Thiết lập ngôn ngữ tiếng Việt cho SMS


