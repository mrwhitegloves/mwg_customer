// store/slices/userSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  loading: false,
  error: null,
};

export const updateFcmToken = createAsyncThunk(
  'user/updateFcmToken',
  async (fcmToken, { rejectWithValue }) => {
    try {
      await api.patch('/auth/update-fcm', { fcmToken });
      return fcmToken;
    } catch (error) {
      return rejectWithValue('Failed to update FCM token');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'user/updateLocation',
  async (location, { rejectWithValue }) => {
    try {
      await api.patch('/auth/update-location', { location });
      return location;
    } catch (error) {
      return rejectWithValue('Failed to update location');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateFcmToken.fulfilled, () => {})
      .addCase(updateLocation.fulfilled, () => {});
  },
});

export const { resetError } = userSlice.actions;
export default userSlice.reducer;