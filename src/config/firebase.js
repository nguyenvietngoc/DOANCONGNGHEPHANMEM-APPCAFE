import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Thay thế bằng cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyBE5uFmboMZBkUKJVFklBskwk9eW_s7ZYg",
  authDomain: "appcafe-ad534.firebaseapp.com",
  databaseURL: "https://appcafe-ad534-default-rtdb.firebaseio.com",
  projectId: "appcafe-ad534",
  storageBucket: "appcafe-ad534.appspot.com",
  messagingSenderId: "750017469011",
  appId: "1:750017469011:web:e56ae9f065b4090c0f04a6",
  measurementId: "G-F8ZD07PR6P"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Auth với AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Khởi tạo Realtime Database
const db = getDatabase(app);

export { app, auth, db };
