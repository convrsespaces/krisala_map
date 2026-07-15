import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { useSocketSync } from "./socket/socket";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [activeMapFilterIds, setActiveMapFilterIds] = useState([]);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState(null);
  const [showRadius, setShowRadius] = useState(false);
  const [label,setLabel] = useState(null);
  const [isSingleSelect, setIsSingleSelect] = useState(false);
  const [sattellite,setSattelite] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [isMasterplanOpen, setIsMasterplanOpen] = useState(false);
  const [masterplanRotation, setMasterplanRotation] = useState(null);
  const [masterplanTransform, setMasterplanTransform] = useState(null);
  const lastSyncedRef = useRef(null);
  // Order-stable snapshot so a received update and the locally rebuilt state
  // serialize identically — lets us skip echoing back what we just applied.
  const serializeCtx = (s) =>
    JSON.stringify([
      s.activeMapFilterIds,
      s.selectedLandmarkId,
      s.showRadius,
      s.label,
      s.isSingleSelect,
      s.sattellite,
      s.fullScreenMode,
      s.showOverlays,
      s.isMasterplanOpen,
      s.masterplanRotation,
      s.masterplanTransform,
    ]);

  const { emitSync } = useSocketSync({
    "context:update": (payload) => {
      if (!payload || typeof payload !== "object") return;

      if (payload.activeMapFilterIds !== undefined) {
        setActiveMapFilterIds(payload.activeMapFilterIds);
      }
      if (payload.selectedLandmarkId !== undefined) {
        setSelectedLandmarkId(payload.selectedLandmarkId);
      }
      if (payload.showRadius !== undefined) {
        setShowRadius(payload.showRadius);
      }
      if (payload.label !== undefined) {
        setLabel(payload.label);
      }
      if (payload.isSingleSelect !== undefined) {
        setIsSingleSelect(payload.isSingleSelect);
      }
      if (payload.sattellite !== undefined) {
        setSattelite(payload.sattellite);
      }
      if (payload.fullScreenMode !== undefined) {
        setFullScreenMode(payload.fullScreenMode);
      }
      if (payload.showOverlays !== undefined) {
        setShowOverlays(payload.showOverlays);
      }
      if (payload.isMasterplanOpen !== undefined) {
        setIsMasterplanOpen(payload.isMasterplanOpen);
      }
      if (payload.masterplanRotation !== undefined) {
        setMasterplanRotation(payload.masterplanRotation);
      }
      if (payload.masterplanTransform !== undefined) {
        setMasterplanTransform(payload.masterplanTransform);
      }

      // Remember exactly what we just applied so the emit effect below does not
      // bounce it straight back to the sender (prevents the on/off ricochet).
      lastSyncedRef.current = serializeCtx(payload);
    },
    // Master-plan open/close has its own first-class event (in addition to the
    // context:update snapshot) so it syncs deterministically instead of relying
    // on the echo-suppressed, multi-burst context snapshot (BUG-007).
    "masterplan:toggle": (payload) => {
      if (!payload || typeof payload !== "object") return;
      if (payload.open !== undefined) {
        setIsMasterplanOpen(!!payload.open);
      }
    },
  });

  useEffect(() => {
    const snapshot = {
      activeMapFilterIds,
      selectedLandmarkId,
      showRadius,
      label,
      isSingleSelect,
      sattellite,
      fullScreenMode,
      showOverlays,
      isMasterplanOpen,
      masterplanRotation,
      masterplanTransform,
    };
    const serialized = serializeCtx(snapshot);
    // Skip when local state already matches the last synced snapshot — this is
    // an echo of a received update, not a genuine local change.
    if (serialized === lastSyncedRef.current) return;
    lastSyncedRef.current = serialized;

    emitSync("context:update", snapshot);
  }, [
    activeMapFilterIds,
    selectedLandmarkId,
    showRadius,
    label,
    isSingleSelect,
    sattellite,
    fullScreenMode,
    showOverlays,
    isMasterplanOpen,
    masterplanRotation,
    masterplanTransform,
    emitSync,
  ]);

  // Open/close the master plan AND broadcast a dedicated masterplan:toggle event
  // so both devices stay in sync regardless of context:update timing (BUG-007).
  const syncMasterplanOpen = useCallback(
    (open) => {
      setIsMasterplanOpen(!!open);
      emitSync("masterplan:toggle", { open: !!open });
    },
    [emitSync]
  );

  // Expose a global the RN host can invoke to close the master plan (its native
  // Close button must return to the map, not exit the whole map to Home —
  // BUG-008). Closing here also broadcasts masterplan:toggle so the peer closes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__krisalaCloseMasterplan = () => syncMasterplanOpen(false);
    return () => {
      delete window.__krisalaCloseMasterplan;
    };
  }, [syncMasterplanOpen]);

  return (
    <AppContext.Provider
      value={{
        activeMapFilterIds,
        setActiveMapFilterIds,
        selectedLandmarkId,
        setSelectedLandmarkId,
        showRadius,
        setShowRadius,
        label,
        setLabel,
        isSingleSelect,
        setIsSingleSelect,
        sattellite,
        setSattelite,
        fullScreenMode,
        setFullScreenMode,
        showOverlays,
        setShowOverlays,
        isMasterplanOpen,
        setIsMasterplanOpen,
        syncMasterplanOpen,
        masterplanRotation,
        setMasterplanRotation,
        masterplanTransform,
        setMasterplanTransform,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
