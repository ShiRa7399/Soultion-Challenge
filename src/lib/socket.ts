import { io } from 'socket.io-client';

// In development, the socket server is on the same port as the client
const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});
