import { getAuth } from "firebase/auth";
import { app } from "./firebase";

/**
 * Firebase Auth instance
 * (Used later when you add admin / student / job seeker login)
 */
export const auth = getAuth(app);
