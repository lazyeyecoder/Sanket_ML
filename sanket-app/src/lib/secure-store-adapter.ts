import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { TokenStorage } from "@convex-dev/auth/react";

// expo-secure-store has no web implementation, so fall back to
// localStorage there (Convex Auth's TokenStorage interface is designed
// to be satisfied directly by localStorage/sessionStorage).
export const secureStorage: TokenStorage =
  Platform.OS === "web"
    ? {
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
        removeItem: (key) => window.localStorage.removeItem(key),
      }
    : {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      };
