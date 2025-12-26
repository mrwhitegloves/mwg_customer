import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';
// import socket from '../../services/socket';

const initialState = {
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
};

// ✅ Create Booking
export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const response = await api.post('/bookings', {
        ...bookingData,
        customerId: state.user.user?._id,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create booking'
      );
    }
  }
);

// ✅ Get Bookings
export const getBookings = createAsyncThunk(
  'bookings/fetch',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const response = await api.get(`/bookings/customer/${state.user.user?._id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bookings'
      );
    }
  }
);

// ✅ Cancel Booking
export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, {
        status: 'cancelled',
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel booking'
      );
    }
  }
);

// ✅ Create Payment Intent
export const createPaymentIntent = createAsyncThunk(
  'bookings/createPayment',
  async ({ bookingId, amount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/create-intent', {
        bookingId,
        amount,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create payment intent'
      );
    }
  }
);

// ✅ Slice
const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearCurrentBooking(state) {
      state.currentBooking = null;
    },
    updateBookingStatus(state, action) {
      const updatedBooking = action.payload;
      const index = state.bookings.findIndex((b) => b._id === updatedBooking._id);
      if (index > -1) {
        state.bookings[index] = updatedBooking;
      }
      if (state.currentBooking?._id === updatedBooking._id) {
        state.currentBooking = updatedBooking;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings.push(action.payload);
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Booking creation failed';
      })

      // Get Bookings
      .addCase(getBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(getBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load bookings';
      })

      // Cancel Booking
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map((b) =>
          b._id === action.payload._id ? action.payload : b
        );
        if (state.currentBooking?._id === action.payload._id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel booking';
      })

      // Payment Intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create payment';
      });
  },
});

export const { clearCurrentBooking, updateBookingStatus } = bookingSlice.actions;
export default bookingSlice.reducer;

// ✅ Selectors
export const selectBookings = (state) => state.bookings.bookings;
export const selectBookingLoading = (state) => state.bookings.loading;
export const selectBookingError = (state) => state.bookings.error;

// ✅ Socket.io listener
// export const setupSocketListeners = (dispatch) => {
//   socket.on('booking:updated', (booking) => {
//     dispatch(updateBookingStatus(booking));
//   });
// };
