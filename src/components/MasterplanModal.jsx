import { useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotateRight,
  faRotateLeft,
  faRotate,
  faXmark,
  faMap,
  faCube,
  faInfo,
} from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../context";
import { DeepZoomViewer } from "./DeepZoomViewer";

/**
 * MasterplanModal — the full-screen masterplan shared by the home and 10 km maps.
 *
 * Holds both views: the 3D township explorer it opens on, and the tiled 2D
 * plan. Each view is mounted the first time it is asked for, then kept alive
 * while the modal stays open so switching back and forth costs nothing. The
 * chosen mode lives in AppContext, so every synced screen follows along.
 */

const TILE_BASE_URL =
  "https://d1ovqzmursgzel.cloudfront.net/krisala-img/krisala-masterplan-plu/";
const THREE_D_URL = "https://d1orgriad8wx4q.cloudfront.net/";

// The home map opens the plan turned; the 10 km map opens it upright.
const MasterplanModal = ({ defaultRotation = -90 }) => {
  const {
    isMasterplanOpen,
    setIsMasterplanOpen,
    masterplanRotation,
    setMasterplanRotation,
    masterplanMode,
    setMasterplanMode,
  } = useContext(AppContext);

  const deepZoomRef = useRef(null);
  const [isTwoDMounted, setIsTwoDMounted] = useState(false);
  const [isThreeDMounted, setIsThreeDMounted] = useState(false);
  const [isThreeDLoading, setIsThreeDLoading] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  const isThreeD = masterplanMode === "3d";
  const rotation = masterplanRotation ?? defaultRotation;

  // Mount a view the first time it is shown, and drop both — the 3D model
  // included — once the masterplan is dismissed.
  useEffect(() => {
    if (!isMasterplanOpen) {
      setIsTwoDMounted(false);
      setIsThreeDMounted(false);
      setIsThreeDLoading(false);
      setIsDisclaimerOpen(false);
      return;
    }
    if (isThreeD && !isThreeDMounted) {
      setIsThreeDMounted(true);
      setIsThreeDLoading(true);
    }
    if (!isThreeD && !isTwoDMounted) {
      setIsTwoDMounted(true);
    }
  }, [isMasterplanOpen, isThreeD, isTwoDMounted, isThreeDMounted]);

  const closeMasterplan = () => {
    setIsMasterplanOpen(false);
    setMasterplanRotation(defaultRotation);
    setMasterplanMode("3d");
  };

  if (!isMasterplanOpen) return null;

  return (
    <Overlay className="modal" onClick={closeMasterplan}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className={`info-btn${isDisclaimerOpen ? " is-active" : ""}`}
          onClick={() => setIsDisclaimerOpen((open) => !open)}
          aria-expanded={isDisclaimerOpen}
          aria-controls="masterplan-disclaimer"
          title="Disclaimer"
        >
          <FontAwesomeIcon icon={faInfo} />
        </button>

        {isDisclaimerOpen && (
          <div className="disclaimer-panel" id="masterplan-disclaimer">
            <p>
              <strong>Disclaimer</strong> - The number of buildings areas,
              flats/units, amenities, specifications, floors, roads, open
              space, area of flats/units, elevation/s, etc., shall be revised
              at the sole discretion of the Promoter/Developer without any
              prior intimation to any person.
            </p>
          </div>
        )}

        <div className="image-container-wrapper">
          {isTwoDMounted && (
            <div className="masterplan-layer" aria-hidden={isThreeD}>
              <DeepZoomViewer
                ref={deepZoomRef}
                tileBaseUrl={TILE_BASE_URL}
                rotation={rotation}
                minZoomLevel={0.5}
                maxZoomLevel={20}
              />
            </div>
          )}

          {isThreeDMounted && (
            <div className="masterplan-layer" aria-hidden={!isThreeD}>
              <iframe
                className="masterplan-3d-frame"
                title="3D masterplan"
                src={THREE_D_URL}
                allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
                onLoad={() => setIsThreeDLoading(false)}
              />
              {isThreeDLoading && (
                <div className="masterplan-3d-loading">
                  <div className="masterplan-3d-spinner" />
                  <div>Loading 3D masterplan…</div>
                </div>
              )}
            </div>
          )}

          <div className="modal-controls">
            <div className="view-switch" role="group" aria-label="Masterplan view">
              <button
                className={`view-switch-btn${isThreeD ? "" : " is-active"}`}
                onClick={() => setMasterplanMode("2d")}
                aria-pressed={!isThreeD}
                title="2D Masterplan"
              >
                <FontAwesomeIcon icon={faMap} />
                <span>2D</span>
              </button>
              <button
                className={`view-switch-btn${isThreeD ? " is-active" : ""}`}
                onClick={() => setMasterplanMode("3d")}
                aria-pressed={isThreeD}
                title="3D Masterplan"
              >
                <FontAwesomeIcon icon={faCube} />
                <span>3D</span>
              </button>
            </div>

            {!isThreeD && (
              <>
                <span className="control-divider" aria-hidden="true" />
                <button
                  className="tool-btn"
                  onClick={() =>
                    setMasterplanRotation(
                      (prev) => (prev ?? defaultRotation) + 90
                    )
                  }
                  title="Rotate Right"
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                </button>
                <button
                  className="tool-btn"
                  onClick={() =>
                    setMasterplanRotation(
                      (prev) => (prev ?? defaultRotation) - 90
                    )
                  }
                  title="Rotate Left"
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </button>
                <button
                  className="tool-btn"
                  onClick={() => {
                    setMasterplanRotation(defaultRotation);
                    deepZoomRef.current?.resetView();
                  }}
                  title="Reset"
                >
                  <FontAwesomeIcon icon={faRotate} />
                </button>
              </>
            )}

            <span className="control-divider" aria-hidden="true" />
            <button className="tool-btn" onClick={closeMasterplan} title="Close">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

      </div>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-content {
    background: white;
    border: none;
    padding: 0;
    position: relative;
    display: block;
    width: 100vw;
    height: 100vh;
    box-shadow: none;
    overflow: hidden;
  }

  .image-container-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  /* Both views stay laid out at full size; the inactive one just fades away,
     so OpenSeadragon never has to re-measure a zero-sized container. */
  .masterplan-layer {
    position: absolute;
    inset: 0;
    transition: opacity 0.2s ease;
  }

  .masterplan-layer[aria-hidden="true"] {
    opacity: 0;
    pointer-events: none;
  }

  .masterplan-3d-frame {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }

  .masterplan-3d-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.92);
    color: #666;
    font-size: 14px;
    font-weight: 500;
  }

  .masterplan-3d-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e0e0e0;
    border-top: 3px solid #555;
    border-radius: 50%;
    animation: masterplan-spin 0.8s linear infinite;
  }

  @keyframes masterplan-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Frosted control bar: light glass over whichever view is behind it, with
     the deep township green reserved for the view you are currently in. */
  .modal-controls {
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1005;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    pointer-events: none;
    padding: 5px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(18px) saturate(1.1);
    -webkit-backdrop-filter: blur(18px) saturate(1.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-top-color: rgba(255, 255, 255, 0.55);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(14, 32, 26, 0.25);
  }

  .view-switch {
    display: flex;
    flex-direction: row;
    gap: 2px;
  }

  .view-switch-btn,
  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 11px;
    color: rgba(29, 53, 46, 0.78);
    cursor: pointer;
    pointer-events: auto;
    transition: background-color 0.16s ease, color 0.16s ease;
  }

  .view-switch-btn {
    gap: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
  }

  .view-switch-btn svg {
    font-size: 15px;
    opacity: 0.85;
  }

  .tool-btn {
    width: 36px;
    height: 36px;
    font-size: 15px;
  }

  .view-switch-btn:hover,
  .tool-btn:hover {
    background: rgba(255, 255, 255, 0.38);
    color: #1d352e;
  }

  .view-switch-btn.is-active,
  .view-switch-btn.is-active:hover {
    background: #234f43;
    color: #ffffff;
    font-weight: 600;
  }

  .view-switch-btn.is-active svg {
    opacity: 1;
  }

  .view-switch-btn:focus-visible,
  .tool-btn:focus-visible {
    outline: 2px solid #234f43;
    outline-offset: 2px;
  }

  .control-divider {
    width: 1px;
    align-self: stretch;
    margin: 4px 2px;
    background: rgba(29, 53, 46, 0.18);
  }

  @media (prefers-reduced-motion: reduce) {
    .view-switch-btn,
    .tool-btn {
      transition: none;
    }
  }

  /* Legal text stays out of the view until asked for, from the top corner. */
  .info-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1006;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: rgba(29, 53, 46, 0.78);
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(18px) saturate(1.1);
    -webkit-backdrop-filter: blur(18px) saturate(1.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-top-color: rgba(255, 255, 255, 0.55);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(14, 32, 26, 0.25);
    transition: background-color 0.16s ease, color 0.16s ease;
  }

  .info-btn:hover {
    background: rgba(255, 255, 255, 0.38);
    color: #1d352e;
  }

  .info-btn.is-active {
    background: #234f43;
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.25);
  }

  .info-btn:focus-visible {
    outline: 2px solid #234f43;
    outline-offset: 2px;
  }

  .disclaimer-panel {
    position: absolute;
    top: 66px;
    right: 20px;
    z-index: 1006;
    max-width: 340px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(18px) saturate(1.1);
    -webkit-backdrop-filter: blur(18px) saturate(1.1);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 14px;
    box-shadow: 0 12px 34px rgba(14, 32, 26, 0.28);
  }

  .disclaimer-panel p {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.6;
    color: #1d352e;
    text-align: left;
  }

  .disclaimer-panel strong {
    font-weight: 700;
    color: #234f43;
    letter-spacing: 0.01em;
  }
`;

export { MasterplanModal };
export default MasterplanModal;
