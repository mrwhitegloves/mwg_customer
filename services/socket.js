// services/socket.js (Customer App)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = async () => {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    return null;
  }

  socket = io(process.env.EXPO_PUBLIC_SOCKET_URL, {
    auth: { access_token: token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 3000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('Customer Socket Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.log('Customer Socket Error:', err.message);
  });

  socket.on('disconnect', () => {
    console.log('Customer Socket Disconnected');
  });

  // Listen to booking events
  socket.on('bookingAccepted', (data) => {
    console.log('Booking Accepted:', data);
    // Trigger your UI update here
  });

  socket.on('bookingStatusUpdate', (data) => {
    console.log('Status Update:', data);
  });

  socket.on('bookingExpired', () => {
    console.log('Booking Expired');
  });

  return socket;
};

export const joinBookingRoom = (bookingId) => {
  socket?.emit('joinBooking', bookingId);
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};