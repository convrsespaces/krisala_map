import React, { useContext, useEffect, useRef, useState } from "react";
import "../App.css";
import "../Attributes.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "animate.css";
import ActionBtns from "../components/ActionBtns";
import CollapsiblePanel from "../components/CollapsiblePanel";
import Compass from "../components/Compass";
import MapFilters from "../components/MapFilter";
import { project_location_mark, svg_defs } from "../data/marks";
import { getMapFilterIds } from "../data/filters";
import ActiveMarksOnMap from "../components/ActiveMarksOnMap";
import LocationInfo from "../components/LocationInfo";
import Zoomable from "../components/Zoomable";
import styled from "styled-components";
import Blackout from "../components/Blackout";
import Radius from "../components/Radius";
import { blank_map } from "../data/svgs";
import Hotspots from "../components/Hotspots";
import Roads from "../components/Roads";
import NavigationButtons from "../components/NavigationButtons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { tenkm_locotion_icon } from "../components/Icons";
import Legends from "../components/atoms/Legends";
import HighwayLegend from "../components/atoms/HighwayLegend";
import ActiveRoute from "../components/ActiveRoute";
import Logo10km, { MasterPlan } from "../components/Logo10km";
import { AppContext } from "../context";
import LabelSvg from "../data/LabelSvgs";
import LegendFilter from "../components/atoms/LabelLegends";
import { MapSwitcher10Km } from "../components/LeftSideButton";
import { DeepZoomViewer } from "../components/DeepZoomViewer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotateRight,
  faRotateLeft,
  faRotate,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useSocketRoom } from "../socket/socket";
import MarkWithTippy from "../components/MarkWithTippy";
// import { mark_tenkm_highway } from "../data/mark"; // Commented out for now - will use later

function TenKm() {
  useSocketRoom();
  // Call getMapFilterIds with the current route
  const mapFilterIds = getMapFilterIds("/tenkm");
  const {
    label,
    setLabel,
    sattellite,
    setSattelite,
    isMasterplanOpen,
    setIsMasterplanOpen,
    masterplanRotation,
    setMasterplanRotation,
    masterplanTransform,
    setMasterplanTransform,
    selectedLandmarkId,
  } = useContext(AppContext);

  const [show3DView, setShow3DView] = useState(false); // State for toggling
  const deepZoomRef = useRef(null);
  const defaultRotation = 0;
  const rotation = masterplanRotation ?? defaultRotation;
  const setTransformRef = useRef(null);
  const suppressTransformEmitRef = useRef(false);
  const localTransformUpdateRef = useRef(false);
  const lastAppliedTransformRef = useRef(null);

  const toggleView = () => {
    setShow3DView(!show3DView); // Toggle the state
  };
  const navigate = useNavigate();
  const location = useLocation();
  const navigateTo3DView = () => {
    navigate(`/3d-view${location.search || ""}`);
  };

  useEffect(() => {
    if (!isMasterplanOpen) return;
    if (masterplanRotation == null) {
      setMasterplanRotation(defaultRotation);
    }
    if (!masterplanTransform) {
      setMasterplanTransform({ scale: 1, positionX: 0, positionY: 0 });
    }
  }, [
    isMasterplanOpen,
    masterplanRotation,
    masterplanTransform,
    setMasterplanRotation,
    setMasterplanTransform,
  ]);

  useEffect(() => {
    if (!isMasterplanOpen) return;
    if (!masterplanTransform) return;
    if (!setTransformRef.current) return;

    if (localTransformUpdateRef.current) {
      localTransformUpdateRef.current = false;
      return;
    }

    const last = lastAppliedTransformRef.current;
    if (
      last &&
      last.scale === masterplanTransform.scale &&
      last.positionX === masterplanTransform.positionX &&
      last.positionY === masterplanTransform.positionY
    ) {
      return;
    }

    suppressTransformEmitRef.current = true;
    lastAppliedTransformRef.current = masterplanTransform;
    setTransformRef.current(
      masterplanTransform.positionX,
      masterplanTransform.positionY,
      masterplanTransform.scale,
      0
    );
  }, [isMasterplanOpen, masterplanTransform]);

  const handleTransformed = (_ctx, state) => {
    if (suppressTransformEmitRef.current) {
      suppressTransformEmitRef.current = false;
      return;
    }
    localTransformUpdateRef.current = true;
    setMasterplanTransform({
      scale: state.scale,
      positionX: state.positionX,
      positionY: state.positionY,
    });
  };

  return (
    <>
      {
        <Style
          className={`h-screen w-screen overflow-hidden no-scrollbar selection:bg-none ${selectedLandmarkId ? "landmark-selected" : ""
            }`}
          id="app"
        >
          <div className="bg-[rgba(255,255,255)] absolute right-2 top-2 z-10 w-fit h-fit rounded-xl p-2">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              className="w-[180px] h-auto"
            />
          </div>

          <Zoomable>
            <svg
              preserveAspectRatio="xMidYMid slice"
              viewBox="0 0 1920 1080"
              fill="none"
              style={{ width: "100vw", height: "100vh" }}
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
            >
              {/* {blank_map} */}
              <image
                id="image0_1_2"
                height="100%"
                style={{ objectFit: "contain" }}
                xlinkHref={`/images/${!sattellite ? "tensat.webp" : "10kmmap.png"
                  }`}
              />
              {/* <Roads /> */}

              {svg_defs}

              <Radius />
              
              {/* Highway paths must be rendered before Blackout to appear under the overlay */}
              {/* Commented out for now - will use later
              <g className="overlay-can-hide marks highway">
                <MarkWithTippy>
                  {mark_tenkm_highway}
                </MarkWithTippy>
              </g>
              */}

              <Blackout />
              <ActiveMarksOnMap
                filterIdsToShow={mapFilterIds.filter(
                  (filter) => filter !== "map-filter-landmarks"
                )}
              />

              <ActiveMarksOnMap
                filterIdsToShow={mapFilterIds.filter(
                  (filter) => filter === "map-filter-landmarks"
                )}
              />

              {label && <LabelSvg label={label} />}
              {/* <Link className="masterplan">
                <MasterPlan toggleModal={()=>setIsModalOpen(true)}/>
              </Link> */}
              <Link
                className="logo-bounce"
                id="logoTrigger"
                to={`${location.pathname}${location.search || ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMasterplanOpen(true);
                }}
              >
                <Logo10km toggleModal={() => setIsMasterplanOpen(true)} />
              </Link>
            </svg>
          </Zoomable>
          <LocationInfo />
          {/* <ActionBtns /> */}
          <div className="absolute bottom-1 left-[20px] text-[9px] text-gray-400 capitalize underline underline-offset-2">
            *Note: Map Not to scale
          </div>
          <Compass angle={0} />
          <CollapsiblePanel title="Map Filters">
            <MapFilters />
          </CollapsiblePanel>

          {isMasterplanOpen && (
            <div
              className="modal"
              style={{ display: "flex" }} // Add this to override the default 'none'
              onClick={() => {
                setIsMasterplanOpen(false);
                setMasterplanRotation(defaultRotation); // Reset rotation when closing
              }}
            >
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span
                  className="close-btn1"
                  onClick={() => {
                    setIsMasterplanOpen(false);
                    setMasterplanRotation(defaultRotation); // Reset rotation when closing
                  }}
                >
                  &times;
                </span>
                <div className="image-container-wrapper">
                <DeepZoomViewer
                    ref={deepZoomRef}
                    rotation={rotation}
                    minZoomLevel={0.5}
                    maxZoomLevel={20}
                    onZoomChange={(zoom) => console.log('Zoom level:', zoom)}
                    onReady={(viewer) => console.log('[MasterPlan] DeepZoom viewer ready')}
                  />
                  <div className="modal-controls">
                          <button
                            className="modal-control-btn"
                            onClick={() => setMasterplanRotation((prev) => (prev ?? defaultRotation) + 90)}
                            title="Rotate Right"
                          >
                            <FontAwesomeIcon icon={faRotateRight} />
                          </button>
                          <button
                            className="modal-control-btn"
                            onClick={() => setMasterplanRotation((prev) => (prev ?? defaultRotation) - 90)}
                            title="Rotate Left"
                          >
                            <FontAwesomeIcon icon={faRotateLeft} />
                          </button>
                          <button
                            className="modal-control-btn"
                            onClick={() => {
                              setMasterplanRotation(defaultRotation);
                              deepZoomRef.current?.resetView();
                            }}
                            title="Reset"
                          >
                            <FontAwesomeIcon icon={faRotate} />
                          </button>
                          <button
                            className="modal-control-btn"
                            onClick={() => {
                              setIsMasterplanOpen(false);
                              setMasterplanRotation(defaultRotation);
                            }}
                            title="Close"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
</div>
                </div>
                <div className="disclaimer-overlay">
                  <p>
                    Disclaimer - The number of buildings areas, flats/units,
                    amenities, specifications, floors, roads, open space, area
                    of flats/units, elevation/s, etc., shall be revised at the
                    sole discretion of the Promoter/Developer without any
                    prior intimation to any person.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* <Legends /> */}
          <HighwayLegend />
          <MapSwitcher10Km
            sattellite={sattellite}
            setSattelite={setSattelite}
          />
          {label && <LegendFilter label={label} />}
          <NavigationButtons />
        </Style>
      }
    </>
  );
}

const Style = styled.div`
  touch-action: manipulation;
  /* Define zoom keyframes */
  @keyframes zoomInOut {
    0%,
    100% {
      transform: scale(1); /* normal size */
    }
    50% {
      transform: scale(1.14); /* zoom in 10% */
    }
  }

  /* Apply it with the same class you already have */
  .logo-bounce {
    animation: zoomInOut 2s infinite ease-in-out;
    // filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.6));
    // filter: drop-shadow(0 0 6px rgba(255,255,255,0.8));
    transform-origin: center center; /* <-- keep it centered */
    transform-box: fill-box; /* <-- use the SVG’s viewBox */
  }

  .masterplan {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9));
    transform-origin: center center;
    transform-box: fill-box;
    transition: transform 0.3s ease-in-out;
  }
  .masterplan:hover {
    // transform: scale(1.1);
  }
  .logo-bounce:hover {
    transform: scale(1.1);
  }

  /* Modal styles */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    z-index: 1000;
    display: none; /* Default hidden */
    align-items: center;
    justify-content: center;
  }

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

  /* Keyframes for the modal entry animation */
  @keyframes evolveIn {
    0% {
      opacity: 0;
      transform: scale(0.1); /* Starts very small */
      filter: blur(20px); /* Starts very blurry */
    }
    70% {
      filter: blur(2px); /* Becomes less blurry faster */
    }
    100% {
      opacity: 1;
      transform: scale(1); /* Ends at full size */
      filter: blur(0); /* Ends clear */
    }
  }

  .close-btn1 {
    position: absolute;
    top: 20px;
    right: 20px;
    height: 40px;
    width: 40px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.3s ease;
    z-index: 1004;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .close-btn1:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }

  .modal-image {
    user-select: none;
    -webkit-user-drag: none;
  }

  .modal-controls {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1005;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    pointer-events: none;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border-radius: 12px;
  }

  .modal-control-btn {
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    border: 1px solid white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #ffffff;
    font-size: 16px;
    transition: all 0.2s ease;
    pointer-events: auto;
  }

  .modal-control-btn:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.05);
  }

  .modal-control-btn:active {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(0.95);
  }

  .disclaimer-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    padding: 12px 20px;
    z-index: 1002;
  }

  .disclaimer-overlay p {
    margin: 0;
    font-size: 10px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    text-align: left;
  }

  .zoom-control {
    position: absolute;
    left: 50%;
    tranform: translateX(-50%);
    bottom: 1rem;
    z-index: 8;
    display: flex;
    /* flex-direction: column; */
    gap: 1rem;
  }

  .zoom-btn {
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    border-radius: 8px;
    display: inline-block;
    border: none;
    box-shadow: var(--button_shadow);
    border-radius: var(--radius);
    font-size: 22px;
    display: grid;
    place-items: center;
    text-align: center;
    pointer-events: auto;
    cursor: pointer;
    color: #ffffff;
    transition: ease-in-out 100ms;
    line-height: 2rem;
    padding-bottom: 0.2rem;

    :hover {
      /* background: rgb(6, 63, 101); */
      border: 2px solid white;
    }
    :active {
      background: #836262;
    }
  }

  .zoom-btn-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .svg-wrapper {
    height: 100vh;
    width: 100vw;
    cursor: default;
  }
`;

export default TenKm;
