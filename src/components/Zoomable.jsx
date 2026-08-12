import React from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  useTransformEffect,
} from "react-zoom-pan-pinch";
import { minus_icon, plus_icon } from "../data/svgs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
} from "@fortawesome/free-solid-svg-icons";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute z-50 right-3 bottom-16 p-2 rounded-md flex gap-2 zoom-controls overlay-can-hide">
      <button
        className="w-10 h-10 rounded-md text-white text-2xl backdrop-blur-sm flex items-center justify-center bg-[#575756]"
        onClick={() => zoomIn()}
        style={{ backgroundColor: "rgb(0,0,0,0.6)", border: "1px solid white" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(0,0,0,0.5)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(0,0,0,0.6)")
        }
      >
        <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
      </button>
      <button
        className="w-10 h-10 rounded-md text-white text-2xl backdrop-blur-sm flex items-center justify-center bg-[#575756]"
        style={{ backgroundColor: "rgb(0,0,0,0.6)", border: "1px solid white" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(0,0,0,0.5)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(0,0,0,,0.6)")
        }
        onClick={() => zoomOut()}
      >
        <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
      </button>
      {/*  <button
        className="w-10 h-10 rounded-md text-white bg-[rgba(0,0,0,0.4)] backdrop-blur-sm grid place-items-center"
        onClick={() => resetTransform()}
      >
        R
      </button>*/}
    </div>
  );
};

function Zoomable({ children }) {
  return (
    <TransformWrapper
      initialScale={1}
      maxScale={3}
      panning={{ disabled: true }}
    >
      {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
        <>
          {/* <Controls /> */}
          <TransformComponent
            wrapperStyle={{ width: "100vw", height: "100vh" }}
          >
            {children}
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  );
}

export default Zoomable;
