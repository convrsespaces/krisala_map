import React from "react";
import styled from "styled-components";

function Compass({ angle = 0 }) {
  return (
    <Style
      angle={angle}
      className="overlay-can-hide absolute right-[1rem] bottom-[75px]"
    >
      <div class="compass__wrapper svelte-aa5lhs">
        <div
          class="compass__circle svelte-aa5lhs"
          style={{ transform: "rotate(0deg)" }}
        >
          <div
            class="compass__north svelte-aa5lhs"
            style={{ transform: "rotate(0deg)" }}
          >
            N
          </div>
          <div class="compass__arrow svelte-aa5lhs"></div>
        </div>
      </div>
    </Style>
  );
}

export default Compass;

const Style = styled.div`
  z-index: 10;
  /* position: relative; */
  width: 70px;
  height: 70px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  transition: all linear 200ms;
  transform-origin: center;
  transform: rotate(${(props) => props.angle}deg);
  border-radius: 50%;
  background:rgb(150, 150, 150,0.6);
  backdrop-filter: blur(3px);

  .compass__wrapper.svelte-aa5lhs {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .compass__circle.svelte-aa5lhs {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .compass__north.svelte-aa5lhs {
    font-size: 10px;
    line-height: 100%;
    font-weight: 400;
    color: #fff;
    text-align: center;
    top: -13px;
    position: absolute;
    transition: var(--transition);
  }

  .compass__arrow.svelte-aa5lhs {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 100%;
    background-color: rgba(35, 35, 35, 0.5);
    transition: var(--transition);
  }
  .compass__arrow.svelte-aa5lhs {
    ::before {
      content: "";
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 3px 20px 3px;
      border-color: transparent transparent #fe191a transparent;
    }
  }

  .compass__arrow.svelte-aa5lhs {
    ::after {
      content: "";
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 20px 3px 0 3px;
      border-color: #fefefe transparent transparent transparent;
    }
  }
`;
