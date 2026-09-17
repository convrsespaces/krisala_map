import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { getMapFilters } from "../data/filters";
import { useLandmark, useMapFilter } from "../hooks";
import { useLocation } from "react-router-dom";
import { AppContext } from "../context";

// function MapFilters({label,setLabel}) {
// const { selectedLandmarkId, setSelectedLandmarkId } = useLandmark();
// const { setActiveMapFilterIds, isFilterActive, activeMapFilterIds } =
//   useMapFilter();
// const location = useLocation();
// // Get the current route
// const currentRoute = location.pathname;
// const mapFilters = getMapFilters(currentRoute);
// // Get all filter IDs for comparison
// const allFilterIds = mapFilters.map(filter => filter.id);
// const isAllFiltersActive = () => {
//   return allFilterIds.every(id => activeMapFilterIds.includes(id));
// };
// const onShowAllClicked = () => {
//   if (isAllFiltersActive()) {
//     setActiveMapFilterIds([]);
//   } else {
//     setActiveMapFilterIds([...allFilterIds]);
//   }
// };
// // useEffect(() => {
// //   setActiveMapFilterIds([
// //     "map-filter-landmarks",
// //     "map-filter-highways",
// //     "map-filter-landmark",
// //   ]);
// // }, []);

// useEffect(()=>{  // only initialize once—if nothing is selected yet
//  if (activeMapFilterIds.length === 0) {
//    setActiveMapFilterIds([
//      "map-filter-landmarks",
//      "map-filter-highways",
//      "map-filter-landmark",
//    ]);
//  }
// },[])
// const handleFilterClick = (id) => {
//   if (isFilterActive(id)) {
//     // If unchecking landmarks, clear selected landmark
//     if (id === "map-filter-landmarks" && selectedLandmarkId) {
//       setSelectedLandmarkId(false);
//     }
//     setActiveMapFilterIds(old => old.filter(_id => _id !== id));
//   } else {
//     setActiveMapFilterIds(old => [...old, id]);
//   }
// };

//   const { selectedLandmarkId, setSelectedLandmarkId } = useLandmark();
//   const { setActiveMapFilterIds, isFilterActive, activeMapFilterIds } = useMapFilter();
//   const location = useLocation();
//   const { isSingleSelect, setIsSingleSelect} = useContext(AppContext)

//   const currentRoute = location.pathname;
//   const mapFiltersLength = getMapFilters(currentRoute);
//   const isAllFiltersActive = () =>
//     activeMapFilterIds.length === mapFiltersLength.length;
//   const mapFilters =  getMapFilters(currentRoute);
//   const visibleFilters = mapFilters.filter((filter) => filter.id !== "");

//   // const onShowAllClicked = () => {
//   //   const newShowAllValue = !showAll;
//   //   setShowAll(newShowAllValue);

//   //   if (newShowAllValue) {
//   //     setActiveMapFilterIds(visibleFilters.map((filter) => filter.id));
//   //   } else {
//   //     setActiveMapFilterIds([]);
//   //   }
//   //   setIsSingleSelect(false);
//   //   setLabel(null);
//   // };

//    const onShowAllClicked = () => {
//     if (isAllFiltersActive()) {
//       setActiveMapFilterIds(visibleFilters.map((filter) => filter.id));
//     } else {
//       setActiveMapFilterIds([...visibleFilters]);
//     }
//     setIsSingleSelect(false);
//     setLabel(null);
//   };

//   useEffect(() => {
//     if (activeMapFilterIds.length === 0) {
//       setActiveMapFilterIds(["map-filter-landmarks"]);
//       setLabel("Landmarks");
//     }
//   }, [currentRoute]);

//   const handleFilterClick = (id) => {
//     if (isSingleSelect) {
//       setActiveMapFilterIds([id]);

//       if (id === "map-filter-landmarks") {
//         setLabel("Landmarks");
//       } else {
//         const selectedFilter = mapFilters.find((filter) => filter.id === id);
//         if (selectedFilter) {
//           setLabel(selectedFilter.title);
//         }
//       }
//     } else {
//       if (isFilterActive(id)) {
//         if (id === "map-filter-landmarks" && selectedLandmarkId) {
//           setSelectedLandmarkId(false);
//         }
//         if (isAllFiltersActive()) {
//           setActiveMapFilterIds(
//             mapFilters.map((filter) => filter.id).filter((_id) => _id !== id)
//           );
//         } else {
//           setActiveMapFilterIds((old) => old.filter((_id) => _id !== id));
//         }
//       } else {
//         setActiveMapFilterIds((old) => [...old, id]);
//       }
//       setLabel(null);
//     }
//   };
// if(label) setIsSingleSelect(true);
//   const toggleSingleSelect = () => {
//    if(label) setIsSingleSelect(!isSingleSelect);
//     if (!isSingleSelect) {
//       if (isAllFiltersActive() || activeMapFilterIds.length === 0) {
//         setActiveMapFilterIds(["map-filter-landmarks"]);
//         setLabel("Landmarks");
//       } else {
//         let result = visibleFilters.find(
//           (item) => item.id === activeMapFilterIds[activeMapFilterIds.length - 1]
//         );
//         if (result) {
//           setActiveMapFilterIds([result.id]);
//           setLabel(result.title);
//         }
//       }
//     } else {
//       setLabel(null);
//     }
//     return null; // placeholder, assuming JSX is added elsewhere
//   };

//   return (
//     <>
//       <div className="overlay-can-hide fixed bottom-3 left-1/2 transform -translate-x-1/2  z-50">
//         <div className="flex justify-center items-center gap-3">
//           <button
//             onClick={onShowAllClicked}
//             className={`
//               p-2 text-sm text-white rounded-2xl w-28 whitespace-nowrap
//               flex items-center justify-center gap-1 hover:opacity-90 transition-all button
//               ${
//                 isAllFiltersActive()
//                   ? "bg-[#cca05b] text-[#1C2632] active"
//                   : "bg-[#76b82a]"
//               }
//             `}
//           >
//             <span>{isAllFiltersActive()?"Hide All":"Show All"}</span>
//           </button>
//           <button
//             onClick={toggleSingleSelect}
//             className={`
//               p-2 text-sm text-white rounded-2xl w-28 whitespace-nowrap
//               flex items-center justify-center gap-1 hover:opacity-90 transition-all button
//               ${
//                 isAllFiltersActive()
//                   ? "bg-[#cca05b] text-[#1C2632] active"
//                   : "bg-[#76b82a]"
//               }
//             `}
//           >
//             <span>Show Label</span>
//           </button>

//           {mapFilters.map(
//             (filter) =>
//               filter.title && (
//                 <button
//                   key={filter.id}
//                   onClick={() => handleFilterClick(filter.id)}
//                   className={`
//                     p-2 text-sm rounded-2xl w-28 whitespace-nowrap
//                     flex items-center justify-center gap-1 hover:opacity-90 transition-all button
//                     ${
//                       isFilterActive(filter.id)
//                         ? "bg-[#cca05b] text-[#1C2632] active"
//                         : "bg-[#76B82a] text-white"
//                     } button-icon ${filter.className}
//                   `}
//                 >
//                   {filter.icon && <span className="icon">{filter.icon}</span>}
//                   <span>{filter.title}</span>
//                 </button>
//               )
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default MapFilters;

const MapFilters = () => {
  // const { selectedLandmarkId, setSelectedLandmarkId } = useLandmark();
  // const { setActiveMapFilterIds, isFilterActive, activeMapFilterIds } = useMapFilter();
  // const { isSingleSelect, setIsSingleSelect, label, setLabel } = useContext(AppContext);
  // const location = useLocation();
  // const [lastSelectedFilterId, setLastSelectedFilterId] = useState(null);

  // const currentRoute = location.pathname;
  // const mapFilters = useMemo(() => getMapFilters(currentRoute), [currentRoute]);
  // const visibleFilters = useMemo(() => mapFilters.filter((filter) => filter.id), [mapFilters]);
  // const isAllFiltersActive = () => activeMapFilterIds.length === visibleFilters.length;

  // const onShowAllClicked = () => {
  //    if (isAllFiltersActive()) {
  //     setActiveMapFilterIds();
  //   } else {
  //     setActiveMapFilterIds(visibleFilters.map((filter) => filter.id));
  //   }
  //   setIsSingleSelect(false);
  //   setLabel(null);
  //   setLastSelectedFilterId(null);
  // };

  // useEffect(() => {
  //   if (activeMapFilterIds.length === 0) {
  //     setActiveMapFilterIds(["map-filter-landmarks"]);
  //     setLabel("");
  //     setIsSingleSelect(false);
  //     setLastSelectedFilterId("");
  //   }
  // }, [currentRoute]);

  // const handleFilterClick = (id) => {

  //    if (isSingleSelect) {
  //     setActiveMapFilterIds([id]);
  //     const selectedFilter = mapFilters.find((filter) => filter.id === id);
  //     if (selectedFilter) {
  //       setLabel(selectedFilter.title);
  //     }
  //     setLastSelectedFilterId(id);
  //   } else {
  //     if (isFilterActive(id)) {
  //       setActiveMapFilterIds((old) => old.filter((_id) => _id !== id));
  //     } else {
  //       setActiveMapFilterIds((old) => [...old, id]);
  //       setLastSelectedFilterId(id);
  //     }
  //     setLabel(null);
  //   }
  // };

  // const toggleSingleSelect = () => {

  //     setIsSingleSelect(!isSingleSelect);

  //   if (!isSingleSelect) {
  //     let targetFilterId = null;

  //     if (lastSelectedFilterId && visibleFilters.some(f => f.id === lastSelectedFilterId)) {
  //       targetFilterId = lastSelectedFilterId;
  //     } else {
  //       targetFilterId = "map-filter-landmarks";
  //     }

  //     const selectedFilter = visibleFilters.find((filter) => filter.id === targetFilterId);

  //     if (selectedFilter) {
  //       setActiveMapFilterIds([selectedFilter.id]);
  //       setLabel(selectedFilter.title);
  //       setLastSelectedFilterId(selectedFilter.id);
  //     } else {
  //       setActiveMapFilterIds(["map-filter-landmarks"]);
  //       setLabel("Landmarks");
  //       setLastSelectedFilterId("map-filter-landmarks");
  //     }
  //   } else {
  //     setLabel(null);
  //   }
  // };

  const { selectedLandmarkId, setSelectedLandmarkId } = useLandmark();
  const { setActiveMapFilterIds, isFilterActive, activeMapFilterIds } =
    useMapFilter();
  const { isSingleSelect, setIsSingleSelect, label, setLabel } =
    useContext(AppContext);
  const location = useLocation();
  const [lastSelectedFilterId, setLastSelectedFilterId] = useState(null);

  const currentRoute = location.pathname;
  const mapFilters = useMemo(() => getMapFilters(currentRoute), [currentRoute]);
  const visibleFilters = useMemo(
    () => mapFilters.filter((filter) => filter.id),
    [mapFilters]
  );
  const isAllFiltersActive = () =>
    activeMapFilterIds.length === visibleFilters.length;

  const onShowAllClicked = () => {
    if (isAllFiltersActive()) {
      setActiveMapFilterIds([]); // If all are active, clear them (effectively 'Hide All')
      // Remove the show-all class when hiding all
      document.body.classList.remove("show-all-active");
    } else {
      setActiveMapFilterIds(visibleFilters.map((filter) => filter.id)); // Set all visible filters as active
      // Add the show-all class when showing all
      document.body.classList.add("show-all-active");
    }
    setIsSingleSelect(false);
    setLabel(null);
    setLastSelectedFilterId(null);
  };

  useEffect(() => {
    // Set landmarks filter as active on initial load
    if (activeMapFilterIds.length === 0 && visibleFilters.length > 0) {
      setActiveMapFilterIds(["map-filter-landmarks"]);
      setLabel("Landmarks");
      setIsSingleSelect(false);
      setLastSelectedFilterId("map-filter-landmarks");
    }
  }, [currentRoute, visibleFilters, setActiveMapFilterIds]);

  // Cleanup effect to remove show-all-active class when component unmounts or route changes
  useEffect(() => {
    return () => {
      document.body.classList.remove("show-all-active");
      document.body.removeAttribute("data-route");
    };
  }, [currentRoute]);

  // Handle route changes - ensure show-all-active class is properly managed
  useEffect(() => {
    // Set data-route attribute on body for CSS targeting
    document.body.setAttribute("data-route", currentRoute);

    // When route changes, check if we should have show-all-active class
    if (
      activeMapFilterIds.length === visibleFilters.length &&
      visibleFilters.length > 0
    ) {
      document.body.classList.add("show-all-active");
    } else {
      document.body.classList.remove("show-all-active");
    }
  }, [currentRoute, activeMapFilterIds, visibleFilters]);

  const handleFilterClick = (id) => {
    // Remove show-all-active class when individual filters are clicked
    document.body.classList.remove("show-all-active");

    // Always use Single Select logic for activeMapFilterIds
    setActiveMapFilterIds([id]);
    setLastSelectedFilterId(id);

    if (isSingleSelect) {
      if (id === "map-filter-landmarks") {
        setLabel("Landmarks");
      } else {
        const selectedFilter = mapFilters.find((filter) => filter.id === id);
        if (selectedFilter) {
          setLabel(selectedFilter.title);
        }
      }
    } else {
      setLabel(null);
    }
  };

  const toggleSingleSelect = () => {
    // Remove show-all-active class when toggle single select is used
    document.body.classList.remove("show-all-active");

    setIsSingleSelect(!isSingleSelect);

    if (!isSingleSelect) {
      let targetFilterId = null;

      if (
        lastSelectedFilterId &&
        visibleFilters.some((f) => f.id === lastSelectedFilterId)
      ) {
        targetFilterId = lastSelectedFilterId;
      } else {
        targetFilterId = "map-filter-landmarks";
      }

      const selectedFilter = visibleFilters.find(
        (filter) => filter.id === targetFilterId
      );

      if (selectedFilter) {
        setActiveMapFilterIds([selectedFilter.id]);
        setLabel(selectedFilter.title);
        setLastSelectedFilterId(selectedFilter.id);
      } else {
        setActiveMapFilterIds(["map-filter-landmarks"]);
        setLabel("Landmarks");
        setLastSelectedFilterId("map-filter-landmarks");
      }
    } else {
      setLabel(null);
    }
  };

  return (
    <>
      {/* <div className="overlay-can-hide fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={onShowAllClicked}
            className={`
              p-2 text-sm text-white rounded-2xl w-28 whitespace-nowrap
              flex items-center justify-center gap-1 hover:opacity-90 transition-all button
              ${
                isAllFiltersActive()
                  ? "bg-[#cca05b] text-[#1C2632] active"
                  : "bg-[#76b82a]"
              }
            `}
          >
            <span>{isAllFiltersActive() ? "Hide All" : "Show All"}</span>
          </button>
          <button
            onClick={toggleSingleSelect}
            className={`
              p-2 text-sm rounded-2xl w-28 whitespace-nowrap
              flex items-center justify-center gap-1 transition-all button
              ${
                isSingleSelect
                  ? "bg-[#cca05b] text-[#1C2632] active"
                  : !isSingleSelect && isAllFiltersActive()
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-[#76b82a] text-white hover:opacity-90"
              }
            `}
          >
            <span>Show Label</span>
          </button>
          {visibleFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className={`
                p-2 text-sm rounded-2xl w-28 whitespace-nowrap
                flex items-center justify-center gap-1 hover:opacity-90 transition-all button
                ${
                  isFilterActive(filter.id)
                    ? "bg-[#cca05b] text-[#1C2632] active"
                    : "bg-[#76b82a] text-white"
                } button-icon ${filter.className}
              `}
            >
              {filter.icon && <span className="icon">{filter.icon}</span>}
              <span>{filter.title}</span>
            </button>
          ))}
        </div>
      </div> */}

      <div className="overlay-can-hide fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 w-[96vw] max-w-[1600px] px-2">
        <div className="flex justify-center items-center" style={{ gap: 'clamp(0.1rem, 0.2vw, 0.35rem)' }}>
          <button
            onClick={onShowAllClicked}
            className={`
        flex-1 rounded-2xl whitespace-nowrap
        flex items-center justify-center hover:opacity-90 transition-all button
        ${isAllFiltersActive()
                ? "bg-[#cca05b] text-[#1C2632] active"
                : "bg-[#76b82a]"
              }
      `}
            style={{
              padding: 'clamp(0.2rem, 0.4vw, 0.4rem) clamp(0.25rem, 0.5vw, 0.6rem)',
              fontSize: 'clamp(0.45rem, 0.7vw, 0.8rem)',
              minWidth: 'clamp(2.5rem, 4.5vw, 5.5rem)',
              maxWidth: 'clamp(4.5rem, 7vw, 8rem)'
            }}

          >
            <span className="truncate">
              {isAllFiltersActive() ? "Hide All" : "Show All"}
            </span>{" "}
            {/* Added truncate */}
          </button>
          <button
            onClick={toggleSingleSelect}
            className={`
        flex-1 rounded-2xl whitespace-nowrap
        flex items-center justify-center transition-all button
        ${isSingleSelect
                ? "bg-[#cca05b] text-[#1C2632] active"
                : !isSingleSelect && isAllFiltersActive()
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-[#76b82a] text-white hover:opacity-90"
              }
      `}
            style={{
              padding: 'clamp(0.2rem, 0.4vw, 0.4rem) clamp(0.25rem, 0.5vw, 0.6rem)',
              fontSize: 'clamp(0.45rem, 0.7vw, 0.8rem)',
              minWidth: 'clamp(2.5rem, 4.5vw, 5.5rem)',
              maxWidth: 'clamp(4.5rem, 7vw, 8rem)'
            }}

          >
            <span className="truncate">Show Label</span> {/* Added truncate */}
          </button>
          {visibleFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className={`
          flex-1 rounded-2xl whitespace-nowrap
          flex items-center justify-center hover:opacity-90 transition-all button
          ${isFilterActive(filter.id)
                  ? "bg-[#cca05b] text-[#1C2632] active"
                  : "bg-[#76b82a] text-white"
                } button-icon ${filter.className}
        `}
              style={{
                padding: 'clamp(0.2rem, 0.4vw, 0.4rem) clamp(0.25rem, 0.5vw, 0.6rem)',
                fontSize: 'clamp(0.45rem, 0.7vw, 0.8rem)',
                minWidth: 'clamp(2.5rem, 4.5vw, 5.5rem)',
                maxWidth: 'clamp(4.5rem, 7vw, 8rem)',
                gap: 'clamp(0.08rem, 0.15vw, 0.2rem)'
              }}

            >
              {filter.icon && <span className="icon" style={{ fontSize: 'clamp(0.45rem, 0.7vw, 0.8rem)' }}>{filter.icon}</span>}
              <span className="truncate">
                {filter.title === "Schools" ? "Education" : filter.title}
              </span>{" "}
              {/* Added truncate */}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MapFilters;
