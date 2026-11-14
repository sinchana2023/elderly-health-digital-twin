import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

const DEMO_USER_KEY = 'medassist_demo_user';

const defaultDemoProfile = {
  uid: 'demo-user',
  email: 'demo@medassist.local',
  fullName: 'Demo Elder',
  age: 72,
  phone: '+1-555-0100',
  emergencyContact: 'Caregiver — +1-555-0199',
  createdAt: new Date().toISOString(),
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DEMO_USER_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
        }
      } catch (e) {
        console.warn('Failed to restore demo session', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (profile) => {
    await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    await AsyncStorage.setItem('userToken', profile.uid);
    await AsyncStorage.setItem('userData', JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const signup = async (email, password, userData = {}) => {
    const profile = {
      ...defaultDemoProfile,
      ...userData,
      uid: `demo-${Date.now()}`,
      email: email || defaultDemoProfile.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return persist(profile);
  };

  const login = async (email, password) => {
    if (!email || !password) {
      throw Object.assign(new Error('Email and password required'), {
        code: 'auth/invalid-email',
      });
    }
    const profile = {
      ...defaultDemoProfile,
      email,
      updatedAt: new Date().toISOString(),
    };
    return persist(profile);
  };

  const loginAsDemo = async () => {
    return persist({ ...defaultDemoProfile, updatedAt: new Date().toISOString() });
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([DEMO_USER_KEY, 'userToken', 'userData']);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        loginAsDemo,
        logout,
        isDemo: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
