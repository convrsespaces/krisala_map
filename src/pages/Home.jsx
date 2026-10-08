import "../App.css";
import "../Attributes.css";
import "animate.css";
import ActionBtns from "../components/ActionBtns";
import CollapsiblePanel from "../components/CollapsiblePanel";
import Compass from "../components/Compass";
import MapFilters from "../components/MapFilter";
import { project_location_mark } from "../data/marks";
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
import { pune_loco_icon } from "../components/Icons";
import Legends from "../components/atoms/Legends";
import HighwayLegend from "../components/atoms/HighwayLegend";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { MapSwitcher } from "../components/LeftSideButton";
import Logo, { MasterPlan } from "../components/Logo";
import { AppContext } from "../context";
import LabelSvg from "../data/LabelSvgs";
import LegendFilter from "../components/atoms/LabelLegends";
import { svg_defs } from "../data/homedata";
import { useSocketRoom } from "../socket/socket";
import MasterplanModal from "../components/MasterplanModal";

function Home() {
  useSocketRoom();
  const mapFilterIds = getMapFilterIds("/");
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const defaultRotation = -90;
  const setTransformRef = useRef(null);
  const suppressTransformEmitRef = useRef(false);
  const localTransformUpdateRef = useRef(false);
  const lastAppliedTransformRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const handletenkmClick = (route) => (e) => {
    e?.preventDefault(); // Optional chaining in case event isn't passed
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(`${route}${location.search || ""}`);
    }, 400);
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
    <Style
      className={`h-screen w-screen no-scrollbar selection:bg-none ${isTransitioning ? "page-transition" : ""} ${selectedLandmarkId ? "landmark-selected" : ""}`}
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
          // preserveAspectRatio="none"
          svg
          viewBox="0 0 1920 1080"
          fill="none"
          style={{ width: "100vw", height: "100vh" }}
        >
          {/* {blank_map} */}
          <image
            id="image0_1_2"
            height="100%"
            style={{ objectFit: "contain" }}
            xlinkHref={`/images/${!sattellite ? "35kmsat.webp" : "35kmmap.png"
              }`}
          />

          {/* <Roads /> */}
          {svg_defs}
          <Radius />
          {/* <rect
            id="Rectangle 35"
            width="92.0532"
            height="6.41402"
            transform="matrix(0.164755 -0.986337 0.986315 0.164854 1097.54 446.172)"
            fill="#D9D9D9"
          /> */}
          <Blackout />
          <ActiveMarksOnMap
            filterIdsToShow={mapFilterIds.filter(
              (filter) => filter !== "map-filter-landmarks"
            )}
          />

          <ActiveMarksOnMap
            filterIdsToShow={mapFilterIds.filter(
              (filter) => filter == "map-filter-landmarks"
            )}
          />

          {label && <LabelSvg label={label} />}
          {/* <Link className="masterplan">
               <MasterPlan toggleModal={()=>setIsModalOpen(true)}/>
              </Link> */}
          {/* <Link to="/tenkm" onClick={handletenkmClick("/tenkm")} className="logo-bounce">
            <Logo/>
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
            <Logo toggleModal={() => setIsMasterplanOpen(true)} />
          </Link>
        </svg>
      </Zoomable>
      <LocationInfo />

      <MasterplanModal defaultRotation={defaultRotation} />

      {/* <Legends /> */}
      <HighwayLegend />
      {label && <LegendFilter label={label} />}
      <div className="absolute bottom-1 left-[20px] text-[9px] text-gray-400 capitalize underline underline-offset-2">
        *Note: Map Not to scale
      </div>
      <Compass angle={0} />
      <CollapsiblePanel title="Map Filters">
        <MapFilters />
      </CollapsiblePanel>
      <NavigationButtons />
      <MapSwitcher sattellite={sattellite} setSattelite={setSattelite} />
      {/* <LeftSideButton /> */}
    </Style>
  );
}

const Style = styled.div`
  touch-action: manipulation;

  // /* Define the animation keyframes directly inside styled-components */
  // @keyframes bounce {
  //   0%, 100% {
  //     transform: translateY(0); /* Start and end at original position */
  //   }
  //   50% {
  //     transform: translateY(-10px); /* Move up slightly in the middle */
  //   }
  // }

  // /* Define the CSS class to apply the animation */
  // .logo-bounce {
  //   animation: bounce 2s infinite ease-in-out; /* Apply the 'bounce' animation */
  //   filter: "drop-shadow(0 0 4px rgba(0, 0, 0, 0.6))"
  // }

  /* Define zoom keyframes */
  @keyframes zoomInOut {
    0%,
    100% {
      transform: scale(1); /* normal size */
    }
    50% {
      transform: scale(1.1); /* zoom in 10% */
    }
  }

  /* Apply it with the same class you already have */
  .logo-bounce {
    animation: zoomInOut 2s infinite ease-in-out;
    /* drop-shadow filter doesn’t need quotes */
    // filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.6));
    // filter: drop-shadow(0 0 6px rgba(255,255,255,0.8));
    transform-origin: center center; /* <-- keep it centered */
    transform-box: fill-box; /* <-- use the SVG’s viewBox */
  }

  .masterplan {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.8));
    transform-origin: center center;
    transform-box: fill-box;
    transition: transform 0.3s ease-in-out;
  }
  .masterplan:hover {
    // transform: scale(1.2);
  }
  .logo-bounce:hover {
    transform: scale(1.1);
  }




  /* Keyframes for the animation */
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
  &.page-transition {
    animation: fadeOut 0.4s ease-out forwards;
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
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
  #home-page {
    #location-icon {
      fill: #d6b454;
      /* :hover {
        cursor: pointer;
        fill: white;
        transition: ease-in-out 100ms;
        stroke: #d6b454;
        stroke-width: 4px;

        path {
          fill: #d6b454;
          stroke-width: 0;
        }
      } */
    }
  }
`;

export default Home;
