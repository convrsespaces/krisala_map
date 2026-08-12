import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import tippy, { sticky } from "tippy.js";
import "tippy.js/animations/shift-toward.css";
import { useBlackout, useLandmark } from "../hooks";
import { useSocketSync } from "../socket/socket";
import {
  tippyLocationInfoForMark,
  tippyLocationInfoForData,
  tippyLocationInfo,
  tippyLocationInfoMark,
} from "./TippyLocationInfo";
import ActiveRoute from "./ActiveRoute";

let activeMarkId = null;
let suppressEmit = false;

const getElementById = (id) => {
  if (typeof document === "undefined") return null;
  return document.getElementById(id);
};

const hideMarkTippy = (id) => {
  if (!id) return;
  const el = getElementById(id);
  if (el && el._tippy) {
    el._tippy.hide();
  }
};

const showMarkTippy = (id) => {
  if (!id) return;
  const el = getElementById(id);
  if (el && el._tippy) {
    el._tippy.show();
  }
};

const applyRemoteTippyState = (id, open) => {
  suppressEmit = true;
  if (open) {
    if (activeMarkId && activeMarkId !== id) {
      hideMarkTippy(activeMarkId);
    }
    showMarkTippy(id);
    activeMarkId = id;
  } else {
    hideMarkTippy(id);
    if (activeMarkId === id) {
      activeMarkId = null;
    }
  }
  setTimeout(() => {
    suppressEmit = false;
  }, 0);
};

function MarkWithTippy({ children, bgColor = "#ffffffdd" }) {
  const ref = useRef(null);
  const { selectedLandmarkId, setSelectedLandmarkId } = useLandmark();
  const Routepath = window.location;
  const istenkm = Routepath.pathname === "/tenkm";

  const { blackout } = useBlackout();
  const { emitSync } = useSocketSync({
    "mark:tippy": (payload) => {
      if (!payload || !payload.id) return;
      applyRemoteTippyState(payload.id, !!payload.open);
    },
  });

  const calculateTextWidth = (text, className) => {
    const tempElement = document.createElement("div");
    tempElement.style.position = "absolute";
    tempElement.style.visibility = "hidden";
    tempElement.style.whiteSpace = "nowrap";
    tempElement.style.fontSize = "14px"; // Base font size for calculation
    // Apply relevant classes for accurate width calculation
    tempElement.className = className;
    tempElement.innerText = text;
    document.body.appendChild(tempElement);
    const width = tempElement.offsetWidth;
    document.body.removeChild(tempElement);
    return width;
  };

  useEffect(() => {
    if (!ref.current) return;
    const instances = [];
    // Support both direct children (e.g. mark_highway) and nested elements (e.g. mark_tenkm_highway inside SVG)
    const interactiveElements = ref.current.querySelectorAll('[id^="__"]');
    for (let i = 0; i < interactiveElements.length; i++) {
      if (interactiveElements[i]._tippy) {
        interactiveElements[i]._tippy.destroy();
      }
    }

    if (blackout) return;

    const elementsToProcess = Array.from(ref.current.querySelectorAll('[id^="__"]'));
    for (let i = 0; i < elementsToProcess.length; i++) {
      const ele = elementsToProcess[i];
      
      // Check if this is a highway element
      let isHighwayElement = ele.id.startsWith("__highway ");
      
      // Highways should have lower z-index to appear under blackout overlay
      // Other elements should have high z-index to appear above blackout
      ele.style.zIndex = isHighwayElement ? "0" : "999999";
      ele.style.cursor = "pointer";
      
      // Only apply istenkm transform if element is NOT inside an SVG with viewBox
      // (SVG with viewBox handles its own coordinate system, e.g. mark_tenkm_highway)
      const isInsideSVGWithViewBox = ele.closest('svg[viewBox]') !== null;
      if(istenkm && !isInsideSVGWithViewBox){
        ele.style.transform = "scale(0.7)";
        ele.style.transformBox = "fill-box";
        ele.style.transformOrigin = "center";
      }
      // ele.addEventListener("click", () => {
      //   // Reset transform styles for all children
      //   for (let j = 0; j < ref.current.children.length; j++) {
      //     ref.current.children[j].style.transform = "scale(0.7)";
      //     ref.current.children[j].style.transformBox = "fil-box";
      //     ref.current.children[j].style.transformOrigin = "center";
      //   }
      // });
      // const tippyText = ele.dataset.tippyContentText || "mark";
      let className = ele.id.substr(2, ele.id.indexOf(" ") - 1);
      let isHighway = ele.id.startsWith("__highway ");
      if (isHighway) {
        // Keep className as "highway" for CSS class
        className = "highway";
      }
      // let TextStyle = ele.id.startsWith("__hospital ")
      //   ? "color: black;"
      //   : "color:white;";
      let FillStyle = ele.id.startsWith("__hospital ") ? "white" : "white";
      let TextStyle = { color: "white" };
      let tippyText =
        ele.id
          .replace("__mall ", "")
          .replace("__hospital ", "")
          .replace("__temple ", "")
          .replace("__hotel ", "")
          .replace("__residential", "")
          .replace("__railwaystation", "")
          .replace("__busstand", "")
          .replace("__religiousplaces", "")
          .replace("__parks", "")
          .replace("__landmarkk", "")
          .replace("__metrostation ", "")
          .replace("__airport", "")
          .replace("__highway ", "")
          .replace("__road", "")
          .replace("__entertainment", "")
          .replace("__itpark", "")
          .replace("__school ", "") || null;

      let distance_time = tippyText.split("_d_").at(-1);
      let distance = distance_time?.split("_")[0];
      let time = distance_time?.split("_")[1];

      tippyText = tippyText.split("_")[0];
      // Trim whitespace instead of removing last character
      tippyText = tippyText.trim();

      if (tippyText == "metro") {
        tippyText = null;
      }

      if (tippyText) {
        // const textWidth = calculateTextWidth(tippyText, className);
        // For highways, use hover/touch/click, for others use click only
        const triggerType = isHighway ? "mouseenter focus click" : "click";
        const hideOnClick = true; // Hide tooltip on click for all elements including highways
        
        // For highways, track mouse position to position tooltip at cursor
        let mouseX = 0;
        let mouseY = 0;
        let tippyInstance = null;
        
        if (isHighway) {
          const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            // Update tooltip position dynamically if it's visible
            if (tippyInstance && tippyInstance.state.isVisible) {
              tippyInstance.setProps({
                getReferenceClientRect: () => ({
                  width: 0,
                  height: 0,
                  top: mouseY,
                  left: mouseX,
                  right: mouseX,
                  bottom: mouseY,
                }),
              });
            }
          };
          
          ele.addEventListener("mousemove", handleMouseMove);
          // Store handler for cleanup
          ele._highwayMouseMoveHandler = handleMouseMove;
        }
        
        const instance = tippy(ele, {
          content: `
           <div class="${className} tippy-mark m-0 capitalize overlay-can-hide items-start justify-start" id="${
            ele.id
          }" style="max-width: 300px; white-space: normal;" >

           <div class="flex items-start justify-start"><p class="m-0 p-0">${tippyText}</p></div>
            ${!isHighway ? `<div >
             ${tippyLocationInfoForData(distance, time, TextStyle, FillStyle)}
             </div>` : ''}
           </div>
          `,
          animation: "shift-toward",
          placement: isHighway ? "top" : `${
            [].some((str) =>
              tippyText.includes(str)
            )
            ?"bottom"
            :"top" 
          }`,

          allowHTML: true,
          arrow: false,
          followCursor: false,
          getReferenceClientRect: isHighway 
            ? () => ({
                width: 0,
                height: 0,
                top: mouseY || 0,
                left: mouseX || 0,
                right: mouseX || 0,
                bottom: mouseY || 0,
              })
            : null,
          interactive: true,
          offset: isHighway ? [0, 10] : [0, 0],
          trigger: triggerType,
          sticky: isHighway ? false : true,
          plugins: isHighway ? [] : [sticky],
          zIndex: 5,
          showOnCreate: false, // Ensure it does not show on create
          hideOnClick: hideOnClick,
          onTrigger: isHighway 
            ? (instance, event) => {
                // Capture mouse position when tooltip is triggered
                if (event && event.clientX !== undefined) {
                  mouseX = event.clientX;
                  mouseY = event.clientY;
                }
              }
            : undefined,
          onShow: (instance) => {
            if (isHighway) {
              tippyInstance = instance;
            }
            if (suppressEmit) return;
            if (activeMarkId && activeMarkId !== ele.id) {
              hideMarkTippy(activeMarkId);
            }
            activeMarkId = ele.id;
            emitSync("mark:tippy", { id: ele.id, open: true });
          },
          onHide: () => {
            if (isHighway) {
              tippyInstance = null;
            }
            if (suppressEmit) return;
            if (activeMarkId === ele.id) {
              activeMarkId = null;
            }
            emitSync("mark:tippy", { id: ele.id, open: false });
          },
          appendTo: document.getElementById("app"),
        });
        instances.push(instance);
        
        // Cleanup mouse move handler on destroy
        if (isHighway && ele._highwayMouseMoveHandler) {
          const originalDestroy = instance.destroy;
          instance.destroy = () => {
            ele.removeEventListener("mousemove", ele._highwayMouseMoveHandler);
            originalDestroy.call(instance);
          };
        }
      }
    }
    return () => {
      for (const instance of instances) {
         instance.destroy();
      }
    };
  }, [blackout, emitSync]);

  return (
    <>
      <Style ref={ref}>{children}</Style>;
    </>
  );
}

export default MarkWithTippy;

const Style = styled.g`
  cursor: pointer;
  z-index: 999999999999999;
`;
