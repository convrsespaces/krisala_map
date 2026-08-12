import React from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";

const OUTER_RING_COLOR = "#66BBE6";
const INNER_RING_COLOR_10KM = "#FECC33";
const INNER_RING_COLOR_35KM = "#FFEA00";

function HighwayLegend({ className }) {
  const location = useLocation();
  const isTenKm = location.pathname === "/tenkm";
  const innerRingColor = isTenKm ? INNER_RING_COLOR_10KM : INNER_RING_COLOR_35KM;

  return (
    <Style className={`${className} overlay-can-hide`}>
      <h2 className="highway-legend__title">Ring Roads</h2>
      <div className="highway-legend__items">
        <div className="highway-legend__item">
          <div className="highway-legend__line" style={{ backgroundColor: OUTER_RING_COLOR }} />
          <div className="highway-legend__content">
            <span className="highway-legend__text">Outer Ring Road</span>
            <span className="highway-legend__details">Target completion 2026-2027</span>
          </div>
        </div>
        <div className="highway-legend__item">
          <div className="highway-legend__line" style={{ backgroundColor: innerRingColor }} />
          <div className="highway-legend__content">
            <span className="highway-legend__text">Inner Ring Road</span>
            <span className="highway-legend__details">Target Completion 2026-2028</span>
          </div>
        </div>
      </div>
    </Style>
  );
}

export default HighwayLegend;

const Style = styled.div`
  position: absolute;
  top: 12rem;
  right: 1rem;
  width: auto;
  min-width: 200px;
  max-width: 250px;
  margin-top: 10px;
  padding: 8px 15px 15px 15px;
  border-radius: var(--radius);
  background: var(--panel_background);
  transition: var(--transition);

  .highway-legend__title {
    font-size: 9px;
    text-transform: uppercase;
    text-align: center;
    color: var(--color_text);
    margin: 0 0 11px 0;
  }

  .highway-legend__items {
    display: flex;
    flex-direction: column;
    gap: 11px;
  }

  .highway-legend__item {
    display: flex;
    align-items: flex-start;
  }

  .highway-legend__line {
    width: 24px;
    height: 4px;
    border-radius: 2px;
    flex-shrink: 0;
    margin-top: 6px;
  }

  .highway-legend__content {
    margin-inline-start: 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .highway-legend__text {
    font-size: 13px;
    font-weight: 500;
    line-height: 15px;
    color: var(--color_text);
  }

  .highway-legend__details {
    font-size: 11px;
    font-weight: 400;
    line-height: 13px;
    color: var(--color_text);
    opacity: 0.8;
  }
`;
