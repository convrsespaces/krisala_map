import { io } from "socket.io-client";
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

const SocketBaseUrl = "https://api.floorselector.convrse.ai";
export const PROJECT_ID = "krisala";

let socket = null;
let isConnecting = false;
let listenersAttached = false;
let currentOnInventoryUpdated = null;
let currentRoomId = null;
let clientId = null;

const getClientId = () => {
  if (clientId) return clientId;
  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem("socketClientId");
    if (stored) {
      clientId = stored;
      return clientId;
    }
    const generated = `client_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem("socketClientId", generated);
    clientId = generated;
    return clientId;
  }
  clientId = `client_${Math.random().toString(36).slice(2, 10)}`;
  return clientId;
};

const ensureSocket = () => {
  if (!socket) {
    socket = io(SocketBaseUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      transports: ["websocket", "polling"],
      timeout: 30000,
      autoConnect: false,
      upgrade: true,
    });
  }
  return socket;
};

const attachCoreListeners = () => {
  if (!socket || listenersAttached) return;
  listenersAttached = true;

  socket.on("connect", () => {
    isConnecting = false;
    if (currentRoomId) {
      socket.emit("joinRoom", currentRoomId);
    }
  });

  socket.on("disconnect", () => {
    isConnecting = false;
  });

  socket.on("connect_error", (error) => {
    console.error("🔌 Socket connection error:", error);
    isConnecting = false;
  });

  socket.on("inventoryUpdate", async (data) => {
    if (!data) return;
    if (!currentOnInventoryUpdated) return;

    try {
      if (socket.inventoryUpdateTimeout) {
        clearTimeout(socket.inventoryUpdateTimeout);
      }
      socket.inventoryUpdateTimeout = setTimeout(async () => {
        await currentOnInventoryUpdated();
      }, 100);
    } catch (error) {
      console.error("❌ Error in inventory update callback:", error);
    }
  });

  socket.on("reconnect", () => {
    if (currentRoomId) {
      socket.emit("joinRoom", currentRoomId);
    }
  });
};

export const socketConnect = (onInventoryUpdated, roomId = null) => {
  try {
    if (isConnecting) return;

    ensureSocket();
    attachCoreListeners();

    if (!roomId && currentRoomId && socket && socket.connected) {
      socket.emit("leaveRoom", currentRoomId);
      currentRoomId = null;
    }

    if (socket.connected) {
      if (!roomId) {
        currentOnInventoryUpdated = onInventoryUpdated;
        return;
      }
      if (roomId !== currentRoomId) {
        if (currentRoomId) {
          socket.emit("leaveRoom", currentRoomId);
        }
        socket.emit("joinRoom", roomId);
        currentRoomId = roomId;
      }
      currentOnInventoryUpdated = onInventoryUpdated;
      return;
    }

    if (socket && !socket.connected && socket.disconnected === false) {
      socket.disconnect();
    }

    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    socket.auth = token ? { token } : undefined;

    isConnecting = true;
    currentOnInventoryUpdated = onInventoryUpdated;
    currentRoomId = roomId || null;

    socket.connect();
  } catch (e) {
    console.error("❌ Failed to setup socket:", e);
    isConnecting = false;
  }
};

export const socketChangeRoom = (newRoomId) => {
  if (!socket || !socket.connected) return;
  if (!newRoomId) {
    if (currentRoomId) {
      socket.emit("leaveRoom", currentRoomId);
    }
    currentRoomId = null;
    return;
  }
  if (newRoomId === currentRoomId) return;

  if (currentRoomId) {
    socket.emit("leaveRoom", currentRoomId);
  }

  socket.emit("joinRoom", newRoomId);
  currentRoomId = newRoomId;
};

export const socketDisconnect = () => {
  if (!socket) return;

  if (currentRoomId) {
    socket.emit("leaveRoom", currentRoomId);
  }

  if (socket.inventoryUpdateTimeout) {
    clearTimeout(socket.inventoryUpdateTimeout);
    socket.inventoryUpdateTimeout = null;
  }

  socket.disconnect();
  socket = null;
  listenersAttached = false;
  isConnecting = false;
  currentRoomId = null;
  currentOnInventoryUpdated = null;
};

export const getSocket = () => socket;
export const getCurrentRoomId = () => currentRoomId;
export const isSocketConnected = () => socket && socket.connected;

export const emitSyncEvent = (type, payload = {}) => {
  const activeSocket = ensureSocket();
  if (!activeSocket || !activeSocket.connected) return false;

  const roomId = currentRoomId;
  if (!roomId) return false;
  activeSocket.emit("sync_event", {
    type,
    payload,
    roomId,
    senderId: activeSocket.id,
    clientId: getClientId(),
    ts: Date.now(),
  });
  return true;
};

export const useSocketSync = (handlers = {}) => {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const activeSocket = ensureSocket();
    if (!activeSocket) return;

    const handleSyncEvent = (socketEvent) => {
      if (!socketEvent || !socketEvent.type) return;
      if (socketEvent.senderId && socketEvent.senderId === activeSocket.id) {
        return;
      }
      const handler = handlersRef.current[socketEvent.type];
      if (typeof handler === "function") {
        handler(socketEvent.payload, socketEvent);
      }
    };

    activeSocket.on("sync_event", handleSyncEvent);
    return () => {
      activeSocket.off("sync_event", handleSyncEvent);
    };
  }, []);

  return { emitSync: emitSyncEvent };
};

export const useSocketRoom = (onInventoryUpdated) => {
  const location = useLocation();
  const role = useMemo(
    () => new URLSearchParams(location.search).get("role"),
    [location.search]
  );

  useEffect(() => {
    socketConnect(onInventoryUpdated, role);
  }, [onInventoryUpdated, role]);

  useEffect(() => {
    socketChangeRoom(role);
  }, [role]);

  return { socket, role };
};
