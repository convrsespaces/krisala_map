import { createContext, useEffect, useRef, useState } from "react";
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
  const suppressEmitRef = useRef(false);

  const { emitSync } = useSocketSync({
    "context:update": (payload) => {
      if (!payload || typeof payload !== "object") return;
      suppressEmitRef.current = true;

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

      setTimeout(() => {
        suppressEmitRef.current = false;
      }, 0);
    },
  });

  useEffect(() => {
    if (suppressEmitRef.current) return;

    emitSync("context:update", {
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
    });
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
