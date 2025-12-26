// store/slices/serviceSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

// ────── 1. FETCH ALL SERVICES (unchanged) ──────
export const fetchServices = createAsyncThunk(
  'services/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/services/allServicesByVehicle');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load services');
    }
  }
);

// ────── 2. NEW: FETCH SINGLE SERVICE BY ID ──────
export const fetchServiceById = createAsyncThunk(
  'services/fetchById',
  async (serviceId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/service/${serviceId}`);
      return res.data.service; // backend returns { service }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Service not found');
    }
  }
);

// ────── SLICE ──────
const serviceSlice = createSlice({
  name: 'services',
  initialState: {
    // List
    services: [],
    loading: false,
    error: null,

    // Detail
    currentService: null,
    loadingDetail: false,
    errorDetail: null,
  },
  reducers: {
    // Optional: clear current service
    clearCurrentService: (state) => {
      state.currentService = null;
      state.errorDetail = null;
    },
  },
  extraReducers: (builder) => {
    // ────── LIST ──────
    builder
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ────── DETAIL ──────
    builder
      .addCase(fetchServiceById.pending, (state) => {
        state.loadingDetail = true;
        state.errorDetail = null;
        state.currentService = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.currentService = action.payload;
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.loadingDetail = false;
        state.errorDetail = action.payload;
      });
  },
});

// ────── EXPORT REDUCER ──────
export default serviceSlice.reducer;

// ────── EXPORT ACTIONS ──────
export const { clearCurrentService } = serviceSlice.actions;

// ────── SELECTORS ──────
export const selectServices = (state) => state.services.services;
export const selectServicesLoading = (state) => state.services.loading;

// Detail selectors
export const selectCurrentService = (state) => state.services.currentService;
export const selectServiceDetailLoading = (state) => state.services.loadingDetail;
export const selectServiceDetailError = (state) => state.services.errorDetail;