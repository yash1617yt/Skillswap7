import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDK5_E7N4RXnm6aN3nUnUVFPPtFZb-o6t4",
  authDomain: "skillswap-e8f2b.firebaseapp.com",
  projectId: "skillswap-e8f2b",
  storageBucket: "skillswap-e8f2b.firebasestorage.app",
  messagingSenderId: "543175620219",
  appId: "1:543175620219:web:e3e961e21256b7773554de",
  measurementId: "G-97HT964MKK"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
