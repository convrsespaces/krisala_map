import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AppContext } from "../context";
import MasterplanModal from "./MasterplanModal";

// OpenSeadragon needs a real canvas, so the 2D viewer stands in as a marker.
jest.mock("./DeepZoomViewer", () => {
  const React = require("react");
  const Mock = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ resetView: () => {} }));
    return <div data-testid="deep-zoom-viewer" />;
  });
  return { __esModule: true, DeepZoomViewer: Mock, default: Mock };
});

const THREE_D_URL = "https://d1orgriad8wx4q.cloudfront.net/";

// Mirrors the shared context the pages provide, so mode changes are observable.
const Harness = ({ defaultRotation }) => {
  const [isMasterplanOpen, setIsMasterplanOpen] = useState(true);
  const [masterplanRotation, setMasterplanRotation] = useState(null);
  const [masterplanMode, setMasterplanMode] = useState("3d");

  return (
    <AppContext.Provider
      value={{
        isMasterplanOpen,
        setIsMasterplanOpen,
        masterplanRotation,
        setMasterplanRotation,
        masterplanMode,
        setMasterplanMode,
      }}
    >
      <div data-testid="shared-mode">{masterplanMode}</div>
      <div data-testid="shared-open">{String(isMasterplanOpen)}</div>
      <div data-testid="shared-rotation">{String(masterplanRotation)}</div>
      <MasterplanModal defaultRotation={defaultRotation} />
    </AppContext.Provider>
  );
};

const frame = () => screen.queryByTitle("3D masterplan");
const viewer = () => screen.queryByTestId("deep-zoom-viewer");

test("opens on the 3D masterplan", () => {
  render(<Harness />);

  expect(frame()).toHaveAttribute("src", THREE_D_URL);
});

test("leaves the 2D tiles alone until they are asked for", () => {
  render(<Harness />);

  expect(viewer()).not.toBeInTheDocument();
});

test("switching to 2D shows the tiled masterplan", () => {
  render(<Harness />);

  fireEvent.click(screen.getByRole("button", { name: "2D" }));

  expect(viewer()).toBeInTheDocument();
});

test("hides the 2D rotate controls while the 3D masterplan is showing", () => {
  render(<Harness />);

  expect(screen.queryByTitle("Rotate Right")).not.toBeInTheDocument();
  expect(screen.queryByTitle("Rotate Left")).not.toBeInTheDocument();
  expect(screen.getByTitle("Close")).toBeInTheDocument();
});

test("keeps the loaded 3D explorer out of the way while 2D shows", () => {
  render(<Harness />);

  fireEvent.click(screen.getByRole("button", { name: "2D" }));

  // Still mounted so switching back is instant, but inert meanwhile.
  expect(frame()).toBeInTheDocument();
  expect(frame().closest("[aria-hidden]")).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  expect(screen.getByTitle("Rotate Right")).toBeInTheDocument();
});

const disclaimer = () => screen.queryByText(/revised at the sole discretion/i);

test("keeps the disclaimer away until the info button asks for it", () => {
  render(<Harness />);

  expect(disclaimer()).not.toBeInTheDocument();

  fireEvent.click(screen.getByTitle("Disclaimer"));

  expect(disclaimer()).toBeInTheDocument();
});

test("shows the disclaimer over the 2D plan too", () => {
  render(<Harness />);

  fireEvent.click(screen.getByRole("button", { name: "2D" }));
  fireEvent.click(screen.getByTitle("Disclaimer"));

  expect(disclaimer()).toBeInTheDocument();
});

test("dismisses the disclaimer when the info button is used again", () => {
  render(<Harness />);

  fireEvent.click(screen.getByTitle("Disclaimer"));
  fireEvent.click(screen.getByTitle("Disclaimer"));

  expect(disclaimer()).not.toBeInTheDocument();
});

test("shares the chosen mode through app context so other screens follow", () => {
  render(<Harness />);

  fireEvent.click(screen.getByRole("button", { name: "2D" }));

  expect(screen.getByTestId("shared-mode")).toHaveTextContent("2d");
});

test("resets rotation to the default the page asks for", () => {
  // The 10 km map opens the plan upright; the home map opens it turned -90.
  render(<Harness defaultRotation={0} />);

  fireEvent.click(screen.getByRole("button", { name: "2D" }));
  fireEvent.click(screen.getByTitle("Rotate Right"));
  fireEvent.click(screen.getByTitle("Reset"));

  expect(screen.getByTestId("shared-rotation")).toHaveTextContent(/^0$/);
});

test("closing from 2D reopens later on the 3D masterplan", () => {
  render(<Harness />);

  fireEvent.click(screen.getByRole("button", { name: "2D" }));
  fireEvent.click(screen.getByTitle("Close"));

  expect(screen.getByTestId("shared-open")).toHaveTextContent("false");
  expect(screen.getByTestId("shared-mode")).toHaveTextContent("3d");
});
