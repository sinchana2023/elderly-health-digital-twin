/**
 * Local stub for patient medication helpers (originally Firestore).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'medassist_medications';

export async function addMedication(userId, medication) {
  const all = await getPatientMedications(userId);
  const next = [...all, { ...medication, id: `med-${Date.now()}`, userId }];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next[next.length - 1];
}

export async function getPatientMedications(_userId) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
