import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "https://vet.gatoescondido.com";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const jwt = await SecureStore.getItemAsync("vet_portal_jwt");
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});
