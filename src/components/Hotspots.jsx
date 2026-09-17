import React, { useEffect, useRef, useState } from "react";
import { useBlackout, useLandmark } from "../hooks";
import tippy from "tippy.js"; // sticky is not needed if you're not using it

import ActiveRoute from "./ActiveRoute";
import { TippyLocationInfo } from "./TippyLocationInfo";

let tippyInstance = null;

export default function Hotspots({ children }) {
  const ref = useRef();
  const mouseDownRef = useRef(null);

  const { selectedLandmarkId, setSelectedLandmarkId } = useLandmark();
  const { setBlackout } = useBlackout(); // Assuming this is used elsewhere

  // Helper functions
  const isLandmark = (element) => element.id.includes("__landmark ");
  const getLandmarkId = (id) => id.split("__landmark ")?.[1];

  // Store current hover state for each landmark
  const [hoveredLandmarkId, setHoveredLandmarkId] = useState(null);

  // Handle click events
  const handleClick = (e) => {
    let element = e.target;

    // Find the landmark element in the click hierarchy
    while (element && element.id !== "parent-svg" && !isLandmark(element)) {
      element = element.parentElement;
    }

    if (element && isLandmark(element)) {
      const landmarkId = getLandmarkId(element.id);

      // Toggle selection - if already selected, deselect
      if (selectedLandmarkId === landmarkId) {
        setSelectedLandmarkId(null);
        if (tippyInstance) {
          tippyInstance.destroy();
          tippyInstance = null;
        }
      } else {
        setSelectedLandmarkId(landmarkId);
      }
    } else {
      // Clicked outside any landmark - deselect
      setSelectedLandmarkId(null);
      if (tippyInstance) {
        tippyInstance.destroy();
        tippyInstance = null;
      }
    }
  };

  // Handle mouse events for click detection
  const onMouseDown = (e) => {
    mouseDownRef.current = { x: e.screenX, y: e.screenY };
  };

  const onMouseUp = (e) => {
    if (mouseDownRef.current) {
      const { x, y } = mouseDownRef.current;
      // Allow for a small drag without triggering a click
      if (Math.abs(x - e.screenX) < 5 && Math.abs(y - e.screenY) < 5) {
        handleClick(e);
      }
    }
    mouseDownRef.current = null;
  };

  // Set up global event listeners for mouse up/down
  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [selectedLandmarkId]);

  // Apply styles to landmarks based on selection and hover
  useEffect(() => {
    if (!ref.current) return;

    Array.from(ref.current.children).forEach((child) => {
      if (isLandmark(child)) {
        const landmarkId = getLandmarkId(child.id);
        const isSelected = landmarkId === selectedLandmarkId;
        const isHovered = landmarkId === hoveredLandmarkId;

        // Base styles for all landmarks
        child.style.transition = "all 0.3s ease-out";
        child.style.transformOrigin = "center";
        child.style.transformBox = "fill-box";
        child.style.cursor = "pointer";

        // Apply scale and filter based on selection and hover
        if (isSelected) {
          child.style.transform = "scale(1.2)";
          child.style.filter = "drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))";
        } else if (isHovered) {
          child.style.transform = "scale(1.1)";
          child.style.filter = "drop-shadow(0 0 4px rgba(0, 0, 0, 0.6))";
        } else {
          child.style.transform = "scale(1)";
          child.style.filter = "none";
        }

        // Apply path colors/opacity
        const paths = child.querySelectorAll("path");
        paths.forEach((path) => {
          path.style.transition = "fill-opacity 0.3s ease-out";
          path.style.fillOpacity = isSelected ? "1" : "1";
        });

        // Attach mouse event listeners to handle hover state for inline styles
        // Clean up existing listeners to prevent duplicates
        const oldOnMouseEnter = child.__onMouseEnter;
        const oldOnMouseLeave = child.__onMouseLeave;

        if (oldOnMouseEnter)
          child.removeEventListener("mouseenter", oldOnMouseEnter);
        if (oldOnMouseLeave)
          child.removeEventListener("mouseleave", oldOnMouseLeave);

        const newOnMouseEnter = () => setHoveredLandmarkId(landmarkId);
        const newOnMouseLeave = () => setHoveredLandmarkId(null);

        child.addEventListener("mouseenter", newOnMouseEnter);
        child.addEventListener("mouseleave", newOnMouseLeave);

        // Store references to the new listeners for cleanup
        child.__onMouseEnter = newOnMouseEnter;
        child.__onMouseLeave = newOnMouseLeave;
      }
    });

    // Cleanup function for this useEffect to remove event listeners when component unmounts
    return () => {
      if (!ref.current) return;
      Array.from(ref.current.children).forEach((child) => {
        if (isLandmark(child)) {
          if (child.__onMouseEnter)
            child.removeEventListener("mouseenter", child.__onMouseEnter);
          if (child.__onMouseLeave)
            child.removeEventListener("mouseleave", child.__onMouseLeave);
        }
      });
    };
  }, [ref, selectedLandmarkId, hoveredLandmarkId]); // Depend on hoveredLandmarkId to re-run for hover effects

  // Manage tippy tooltip
  useEffect(() => {
    if (tippyInstance) {
      tippyInstance.destroy();
      tippyInstance = null;
    }

    if (selectedLandmarkId) {
      const element = document.getElementById(
        `__landmark ${selectedLandmarkId}`
      );
      if (element) {
        const landmarksToMove = ["Balewadi Stadium", "Amity University"];
        const isTargetLandmark = landmarksToMove.some((l) =>
          selectedLandmarkId.includes(l)
        );
        const logoTrigger =
          isTargetLandmark && document.getElementById("logoTrigger");

        const theme =
          isTargetLandmark && !logoTrigger
            ? "repositioned-route-info"
            : "selected-landmark";

        const normalizedSelectedId = selectedLandmarkId
          .toLowerCase()
          .replace(/\s+/g, "_");
        const placement =
          normalizedSelectedId === "khamboli_dam"
            ? "top"
            : selectedLandmarkId.includes("Dam") ||
              selectedLandmarkId.includes("Valley")
              ? "bottom"
              : "top";

        tippyInstance = tippy(logoTrigger || element, {
          content: TippyLocationInfo(selectedLandmarkId),
          theme,
          animation: "shift-toward",
          placement: logoTrigger ? "bottom" : placement,
          allowHTML: true,
          arrow: false,
          offset: logoTrigger ? [0, 10] : [10, 0],
          trigger: "manual",
          showOnCreate: true,
          hideOnClick: false,
          interactive: true,
          appendTo:
            theme === "repositioned-route-info" || logoTrigger
              ? document.body
              : document.getElementById("app") || document.body,
        });
      }
    }

    return () => {
      if (tippyInstance) {
        tippyInstance.destroy();
        tippyInstance = null;
      }
    };
  }, [selectedLandmarkId]);

  return (
    <>
      <ActiveRoute selectedLandmarkId={selectedLandmarkId} />
      <g ref={ref}>{children}</g>
    </>
  );
}
