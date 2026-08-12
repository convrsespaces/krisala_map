import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLandmark } from "../hooks";
import { landmark_description } from "../data/landmark-description";
import { FaMapMarkerAlt } from "react-icons/fa"; // Import the location icon

function LocationInfo() {
  const [imageUrls, setImageUrls] = useState({});
  const { selectedLandmarkId } = useLandmark();

  const landmarkIds = [
    "kasarsai_dam",
    "mca_international_stadium",
    "somatane_shirgaon_bridge",
    "kamshet",
    "aamby_valley_city",
    "lonavala",
    "khandala",
    "pawana_lake",
    "talegaon_toll_plaza",
    "somatne_phata",
    "khamboli_dam",
    "balewadi_stadium",
  ];

  const selectedLandmarkImageName = (selectedLandmarkId || "")
    ?.toLowerCase()
    .replace(/\s+/g, "_");

  const fetchImages = async () => {
    let urls = {};
    for (const landmarkId of landmarkIds) {
      const res = await fetch(
        `${process.env.PUBLIC_URL}/landmarks/${landmarkId}.jpg`
      );
      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      urls[landmarkId] = imageUrl;
    }

    setImageUrls(urls);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  if (!selectedLandmarkId) return;

  return (
    <div
      className={`overlay-can-hide absolute ${selectedLandmarkId.includes("Amity University")
        ? "bottom-[33%]"
        : "bottom-[10%]"
        } right-[2%] z-30 route-details flex flex-row bg-[rgba(0,0,0,0.5)] backdrop-blur-sm text-slate-200 rounded-md overflow-hidden w-[320px] 2xl:w-[38vw] max-w-[90vw]`}
    >
      {imageUrls?.[selectedLandmarkImageName] && (
        <div className="w-[115px] min-w-[115px] 2xl:w-[160px] 2xl:min-w-[160px] flex-shrink-0">
          <img
            className="w-full h-full object-cover"
            src={imageUrls?.[selectedLandmarkImageName]}
            alt={selectedLandmarkId}
          />
        </div>
      )}
      <div className="p-3">
        <div className="text-lg font-semibold mb-2">{selectedLandmarkId}</div>
        <div className="text-sm">
          {landmark_description?.[selectedLandmarkId]}
        </div>
      </div>
    </div>
  );
}

export default LocationInfo;
