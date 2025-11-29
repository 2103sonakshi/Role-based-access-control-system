import axios from "axios";

// --- CRITICAL FIX: Changed baseURL from Render URL to Local Backend URL ---
const instance = axios.create({
  baseURL: "http://localhost:5000/api", // NOTE: Added '/api' here for cleaner component usage
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This is essential for sending cookies
});
// --------------------------------------------------------------------------

export const get = (url, params) => instance.get(url, { params });
export const post = (url, data) => instance.post(url, data);
export const put = (url, data) => instance.put(url, data);
export const deleteUser = (url) => instance.delete(url);

// --- FIX: ADDING TOKEN INJECTION LOGIC ---
instance.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("token");

    // Check if the token exists and if the URL is not for login/signup (which don't need a token)
    if (
      token &&
      !config.url.includes("/auth/login") &&
      !config.url.includes("/auth/signup")
    ) {
      // Standard practice: Inject the token into the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);
// ------------------------------------------

instance.interceptors.response.use(
  function (response) {
    // console.log("interceptor response" , response)
    return response;
  },
  function (error) {
    console.log("interceptor error", error);
    // If the error is 401 Unauthorized, you could optionally redirect to login here
    if (error.response && error.response.status === 401) {
      // Example: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
