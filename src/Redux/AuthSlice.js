import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// NOTE: Assuming 'get' is a globally available function (e.g., imported Axios or similar)

// Function to load initial state and determine authentication status
const loadInitialAuthState = () => {
  const token = localStorage.getItem("token");
  let user = null;

  // Try to parse user data from localStorage if token exists
  if (token) {
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      console.error("Could not parse user data from local storage:", e);
      // Clear invalid data if parsing fails
      localStorage.removeItem("user");
    }
  }

  return {
    // 1. CRITICAL: Derive isAuthenticated from the presence of a token and user object
    isAuthenticated: !!token && !!user,
    token: token || null,
    // 2. CRITICAL: Start loading as true ONLY if we have a token to verify
    loading: !!token,
    error: null,
    user: user,
  };
};

export const updateUser = createAsyncThunk(
  "updateUser",
  async (_, { getState }) => {
    try {
      // NOTE: This assumes 'get' is imported and configured (e.g., Axios instance)
      const request = await get("/api/auth/checkuser");
      const response = request.data;
      return response; // Should return the verified user object
    } catch (error) {
      // On rejection (e.g., token invalid), clear everything and throw
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw error;
    }
  }
);

const AuthSlice = createSlice({
  name: "authslice",
  initialState: loadInitialAuthState(),
  reducers: {
    // 1. FIX: Updated reducer for Login Success
    SetUser: (state, action) => {
      const { user, token } = action.payload;

      // CRITICAL: Set all necessary state variables and persistence
      state.user = user;
      state.token = token;
      state.isAuthenticated = true; // FIX: Ensure this flag is set
      state.loading = false;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); // Save user object
    },

    // 2. Updated Logout reducer
    Logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.token = null;
      state.isAuthenticated = false; // FIX: Ensure this flag is cleared

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    // 3. Updated for non-tokenized initial load
    setLoadingComplete: (state) => {
      // Used when no token is found, so we are immediately done checking
      state.loading = false;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateUser.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(updateUser.fulfilled, (state, action) => {
      // 4. FIX: Ensure all flags are correctly updated on success
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true; // FIX: Token is valid, so user is authenticated
      state.error = null;
      // Note: token is already in state from initial load

      // OPTIONAL: Update user data in storage if backend provided the latest version
      localStorage.setItem("user", JSON.stringify(action.payload));

      console.log("User updated/fetched successfully:", state.user);
    });

    builder.addCase(updateUser.rejected, (state, action) => {
      // 5. FIX: Ensure all flags and data are cleared on failure
      state.loading = false;
      state.error = action.error.message;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false; // FIX: Clear authentication status

      // Local storage cleanup is handled in the thunk itself.
    });
  },
});

export const { SetUser, Logout, setLoadingComplete } = AuthSlice.actions;
export default AuthSlice.reducer;
