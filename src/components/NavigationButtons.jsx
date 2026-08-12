import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NavigationButtons = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const is10KmView = location.pathname === "/tenkm";

  const toggleView = () => {
    const target = is10KmView ? "/thirtyfive" : "/tenkm";
    navigate(`${target}${location.search || ""}`);
  };

  return (
    <div className="absolute bottom-[75px] left-4 z-100">
      <button
        onClick={() => {
          toggleView();
        }}
        className="bg-[#105b30] border-2 border-white-800 rounded-lg px-2 h-9 flex items-center justify-center w-20 text-[10px] text-white"
      >
        {is10KmView ? "10KM" : "35KM"}
      </button>
    </div>
  );
};

export default NavigationButtons;
