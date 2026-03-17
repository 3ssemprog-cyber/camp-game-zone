// Firebase Configuration - Camp Game Zone
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBtdqDQMiEnElUykFb2Tmoe_xB43kgf9O4",
  authDomain: "camp-game-zone-94940.firebaseapp.com",
  projectId: "camp-game-zone-94940",
  storageBucket: "camp-game-zone-94940.firebasestorage.app",
  messagingSenderId: "232147913506",
  appId: "1:232147913506:web:735c0fd763cb8ab0a7b37b",
  measurementId: "G-Z2RK0WGED7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Admin UID
const ADMIN_UID = "iJA776e48eQtWAhSREA3o1u9WJW2";

// Check if current user is admin
function isAdmin() {
  return auth.currentUser && auth.currentUser.uid === ADMIN_UID;
}

// Get current user data from Firestore
async function getCurrentUserData() {
  const user = auth.currentUser;
  if (!user) return null;
  if (user.uid === ADMIN_UID) {
    return { uid: user.uid, email: user.email, role: "أدمن", name: "Admin", permissions: {} };
  }
  try {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { uid: user.uid, ...docSnap.data() };
  } catch (e) {}
  return null;
}

// Check permission for a specific action
async function hasPermission(permKey) {
  const user = auth.currentUser;
  if (!user) return false;
  if (user.uid === ADMIN_UID) return true;
  const userData = await getCurrentUserData();
  if (!userData || !userData.permissions) return false;
  return userData.permissions[permKey] === true;
}

// Log transaction
async function logTransaction(action, detail, section) {
  try {
    const userData = await getCurrentUserData();
    await addDoc(collection(db, "transactions_log"), {
      action,
      detail,
      section,
      user: userData?.name || "غير معروف",
      role: userData?.role || "",
      date: new Date().toLocaleDateString("ar-EG"),
      timestamp: serverTimestamp(),
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    });
  } catch (e) { console.log("logTransaction error:", e); }
}

// Format number
function fmt(n) {
  return parseFloat(n || 0).toFixed(2) + " ج";
}

// Get today's date string
function todayStr() {
  return new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

// Get current month string
function monthStr() {
  return new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long" });
}

// Require auth - redirect to login if not authenticated
function requireAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    const userData = await getCurrentUserData();
    if (callback) callback(user, userData);
  });
}

export {
  app, db, auth,
  ADMIN_UID,
  isAdmin,
  getCurrentUserData,
  hasPermission,
  logTransaction,
  fmt,
  todayStr,
  monthStr,
  requireAuth,
  // Firestore functions
  doc, getDoc, setDoc, collection, addDoc, getDocs,
  updateDoc, deleteDoc, query, orderBy, where, serverTimestamp,
  // Auth functions
  signInWithEmailAndPassword, signOut, onAuthStateChanged
};
