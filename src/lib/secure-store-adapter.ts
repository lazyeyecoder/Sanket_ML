import * as SecureStore from "expo-secure-store";
import type { TokenStorage } from "@convex-dev/auth/react";

export const secureStorage: TokenStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};
