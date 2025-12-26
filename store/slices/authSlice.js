// store/slices/authSlice.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// ────── GET /user/me ──────
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/user/me');
      return res.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch user');
    }
  }
);

// ────── PATCH /user/me ──────
export const updateProfileAsync = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.patch('/user/me', data);
      return res.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Update failed');
    }
  }
);

// ────── POST /user/logout ──────
export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      return;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      AsyncStorage.setItem('authToken', action.payload.token);
    },
    loadToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ────── FETCH ME ──────
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.token = null;
        state.isAuthenticated = false;
        // AsyncStorage.removeItem('authToken');
      })

      // ────── UPDATE PROFILE ──────
      .addCase(updateProfileAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfileAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────── LOGOUT ──────
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        AsyncStorage.removeItem('authToken');
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  loginSuccess,
  loadToken,
  setLoading,
  setError,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;