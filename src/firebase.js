import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBBFN9ZzMn-wnAz1-2DDBHk5QjS-J7VfY8",
  authDomain: "dpeveningsnacksandsweets.firebaseapp.com",
  projectId: "dpeveningsnacksandsweets",
  storageBucket: "dpeveningsnacksandsweets.firebasestorage.app",
  messagingSenderId: "673045354360",
  appId: "1:673045354360:web:b1dfe691ea24064b901a8d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);