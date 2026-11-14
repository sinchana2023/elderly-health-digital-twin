/**
 * Demo stub — original Firebase project is not required for the web demo.
 * Auth and Firestore are replaced by local mock services.
 */

console.log('[MedAssist] Running in local mock mode (no Firebase credentials needed)');

export const db = null;
export const auth = {
  currentUser: null,
  onAuthStateChanged(callback) {
    callback(null);
    return () => {};
  },
};

export default null;
