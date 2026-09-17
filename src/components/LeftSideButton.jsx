// // import { Home, Layers, Image } from "lucide-react";
// // import { useState } from "react";

// // export default function LeftSideButton() {
// //   const [activeItem, setActiveItem] = useState("home");

// //   // Only allow clicking on the Home button
// //   const handleItemClick = (item) => {
// //     if (item === "home") {
// //       setActiveItem(item);
// //     }
// //   };

// //   return (
// //     <div className="overlay-can-hide fixed left-0 top-1/3 flex flex-col bg-gray-100 rounded-r-lg overflow-hidden shadow-lg">
// //       <div
// //         className={`py-6 px-4 flex flex-col items-center cursor-pointer ${
// //           activeItem === "home"
// //             ? "bg-[#105B30] text-white"
// //             : "hover:bg-gray-200"
// //         }`}
// //         onClick={() => setActiveItem("home")}
// //       >
// //         <Home size={24} />
// //         <span className="text-xs mt-1">Home</span>
// //       </div>

// //       <div
// //         className={`py-6 px-4 flex flex-col items-center cursor-not-allowed ${
// //           activeItem === "inventory"
// //             ? "bg-[#105B30] text-white"
// //             : "hover:bg-gray-200"
// //         }`}
// //         onClick={() => setActiveItem("inventory")}
// //       >
// //         <Layers size={24} />
// //         <span className="text-xs mt-1">Inventory</span>
// //       </div>

// //       <div
// //         className={`py-6 px-4 flex flex-col items-center cursor-not-allowed disabled ${
// //           activeItem === "VrTour"
// //             ? "bg-[#105B30] text-white"
// //             : "hover:bg-gray-200"
// //         }`}
// //         onClick={() => setActiveItem("VrTour")}
// //       >
// //         <Image size={24} />
// //         <span className="text-xs mt-1">VrTour</span>
// //       </div>
// //     </div>
// //   );
// // }

// import { useState } from 'react';
// import { Home, Layers } from 'lucide-react';

// export default function SidebarNavigation() {
//   const [activeItem, setActiveItem] = useState("home");

//   // Only allow clicking on the Home button
//   const handleItemClick = (item) => {
//     if (item === "home") {
//       setActiveItem(item);
//     }
//   };

//   return (
//     <div className="overlay-can-hide fixed right-0 top-1/3 flex flex-col bg-gray-100 rounded-l-lg overflow-hidden shadow-lg">
//       {/* Home button - active and clickable */}
//       <div
//         className={`py-4 px-2 flex flex-col items-center cursor-pointer ${
//           activeItem === "home"
//             ? "bg-green-800 text-white"
//             : "hover:bg-gray-200"
//         }`}
//         onClick={() => handleItemClick("home")}
//       >
//         <Home size={24} />
//         <span className="text-xs mt-1">Home</span>
//       </div>

//       {/* Inventory button - disabled */}
//       <div
//         className="py-4 px-2 flex flex-col items-center cursor-not-allowed opacity-50"
//       >
//         <Layers size={24} />
//         <span className="text-xs mt-1">Inventory</span>
//       </div>

//       {/* VR Tour button - disabled */}
//       {/* <div
//         className="py-4 px-2 flex flex-col items-center cursor-not-allowed opacity-50"
//       >
//         <svg
//           width="25"
//           height="25"
//           viewBox="0 0 144 124"
//           xmlns="http://www.w3.org/2000/svg"
//           stroke="currentColor"
//           fill="none"
//           strokeWidth="9"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         >
//           <g transform="translate(-546.225 -61.849) scale(1)">
//             <path d="M555.207,75.414v43.981a2.341,2.341,0,0,0,2.136,2.331l27.279,2.387A10.142,10.142,0,0,0,592.858,121l10.31-10.852a7.355,7.355,0,0,1,10.664,0L624.142,121a10.142,10.142,0,0,0,8.236,3.118l27.279-2.387a2.341,2.341,0,0,0,2.136-2.331V75.414a2.34,2.34,0,0,0-2.34-2.34H557.547A2.34,2.34,0,0,0,555.207,75.414Z" />
//             <path d="M661.793,74.487l-1.914-10.658a.584.584,0,0,0-.575-.48H557.7a.584.584,0,0,0-.575.48l-1.914,10.658" />
//             <circle cx="9.872" cy="9.872" r="9.872" transform="translate(567.818 105.37) rotate(-80.754)" />
//             <circle cx="9.872" cy="9.872" r="9.872" transform="translate(626.522 105.37) rotate(-80.754)" />
//             <path d="M.592,0H7.2a0,0,0,0,1,0,0V18.227a0,0,0,0,1,0,0H.592A.592.592,0,0,1,0,17.635V.592A.592.592,0,0,1,.592,0Z" transform="translate(548.004 87.341)" />
//             <path d="M555.207,82.249h-5.455a.7.7,0,0,0-.683.542L548,87.808" />
//             <path d="M.592,0H7.2a0,0,0,0,1,0,0V18.227a0,0,0,0,1,0,0H.592A.592.592,0,0,1,0,17.635V.592A.592.592,0,0,1,.592,0Z" transform="translate(668.996 105.568) rotate(180)" />
//             <path d="M661.793,82.249h5.454a.7.7,0,0,1,.684.542L669,87.808" />
//           </g>
//         </svg>
//         <span className="text-xs mt-1">VR Tour</span>
//       </div> */}
//     </div>
//   );
// }

export const MapSwitcher = ({ sattellite, setSattelite }) => {
  return (
    <div
      onClick={() => setSattelite(!sattellite)}
      className="overlay-can-hide absolute bottom-[75px] left-28 z-50 h-12 w-20 cursor-pointer items-center "
    >
      <img
        className="rounded-lg"
        src={`/images/${sattellite ? "sattellite.webp" : "35kmmap.png"}`}
        alt="image"
      />
    </div>
  );
};
export const MapSwitcher10Km = ({ sattellite, setSattelite }) => {
  return (
    <div
      onClick={() => setSattelite(!sattellite)}
      className="overlay-can-hide absolute bottom-[75px] left-28 z-50 h-12 w-20 cursor-pointer items-center "
    >
      <img
        className="rounded-lg"
        src={`/images/${sattellite ? "satellite.webp" : "10kmmap.png"}`}
        alt="image"
      />
    </div>
  );
};
