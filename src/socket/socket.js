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

// ---- Local TCP / mDNS bridge (via React Native WebView) ----
// When the map runs inside the RN app's WebView it ALSO syncs over the app's
// local TCP-over-Wi-Fi transport. socket.io stays fully active; every sync_event
// carries a unique `id` and is applied exactly once regardless of which
// transport (cloud socket or local TCP) delivers it first.
const IS_RN_WEBVIEW =
  typeof window !== "undefined" && !!window.ReactNativeWebView;

let syncSeq = 0;
const syncSubscribers = new Set(); // handlersRef objects registered by useSocketSync

// Cross-transport de-dupe: an event arriving on both socket.io and the bridge
// must apply only once. Bounded LRU of recently seen event ids.
const SEEN_LIMIT = 500;
const seenIds = new Set();
const seenOrder = [];
const markSeen = (id) => {
  if (!id) return false; // events without an id (older clients) are never deduped
  if (seenIds.has(id)) return true;
  seenIds.add(id);
  seenOrder.push(id);
  if (seenOrder.length > SEEN_LIMIT) {
    seenIds.delete(seenOrder.shift());
  }
  return false;
};

// Single entry point for incoming sync events from either transport: skips our
// own events, de-dupes across transports, then fans out to every registered
// handler map (each component only reacts to its own event types).
const processIncoming = (evt) => {
  if (!evt || !evt.type) return;
  if (evt.clientId && evt.clientId === getClientId()) return;
  if (evt.senderId && socket && evt.senderId === socket.id) return;
  if (markSeen(evt.id)) return;
  syncSubscribers.forEach((handlersRef) => {
    const handler = handlersRef.current && handlersRef.current[evt.type];
    if (typeof handler === "function") {
      handler(evt.payload, evt);
    }
  });
};

let bridgeAttached = false;
const onBridgeMessage = (nativeEvent) => {
  try {
    const raw = nativeEvent && nativeEvent.data;
    if (typeof raw !== "string") return;
    const msg = JSON.parse(raw);
    if (!msg || !msg.__krisalaSync || msg.dir !== "in") return;
    processIncoming(msg.event);
  } catch (e) {
    // ignore non-JSON / unrelated window messages
  }
};
const initBridge = () => {
  if (bridgeAttached || typeof window === "undefined") return;
  bridgeAttached = true;
  // Primary inbound path: the RN app injects a direct call to this global via
  // WebView.injectJavaScript. Reliable on Android, unlike postMessage → 'message'
  // events which the RN app used to rely on.
  window.__krisalaReceiveLocalSync = (evt) => {
    try {
      processIncoming(evt);
    } catch (e) {
      // ignore malformed injected payloads
    }
  };
  // Fallback inbound path (iOS / other): RN Android delivers injected messages on
  // `document`, iOS/others on `window`.
  window.addEventListener("message", onBridgeMessage);
  if (typeof document !== "undefined") {
    document.addEventListener("message", onBridgeMessage);
  }
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

  // Centralized sync_event listener → shared dispatch (also fed by the RN bridge).
  // Re-attaches to a fresh socket after reconnect because listenersAttached is
  // reset in socketDisconnect.
  socket.on("sync_event", processIncoming);
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
  const roomId = currentRoomId;

  const activeSocket = ensureSocket();
  const evt = {
    id: `${getClientId()}:${++syncSeq}`,
    type,
    payload,
    roomId: roomId || undefined,
    senderId: activeSocket ? activeSocket.id : undefined,
    clientId: getClientId(),
    ts: Date.now(),
  };

  // Local TCP path — hand the event to the RN app, which relays it over the LAN.
  // Independent of socket.io room membership: mDNS/code pairing has no `role`
  // (so no room), yet the LAN bridge must still sync. Works even when the cloud
  // socket is momentarily disconnected.
  if (IS_RN_WEBVIEW) {
    try {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ __krisalaSync: true, dir: "out", event: evt })
      );
    } catch (e) {
      console.error("❌ Failed to post sync to RN bridge:", e);
    }
  }

  // Cloud socket.io path — only when we actually have a room + live connection.
  if (roomId && activeSocket && activeSocket.connected) {
    activeSocket.emit("sync_event", evt);
  }

  return true;
};

export const useSocketSync = (handlers = {}) => {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    ensureSocket();
    attachCoreListeners(); // idempotent; installs the shared sync_event listener
    initBridge(); // idempotent; installs the RN WebView (local TCP) listener

    // Register this component's handler map. Both the socket.io listener and the
    // RN bridge feed processIncoming, which fans out to every registered map.
    syncSubscribers.add(handlersRef);
    return () => {
      syncSubscribers.delete(handlersRef);
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
