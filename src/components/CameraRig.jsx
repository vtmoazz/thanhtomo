import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { CAMERA } from "./scene/poses";
import { INTRO_SEEN_KEY, stageAtom } from "./UI";

const INTRO_SMOOTH_TIME = 0.6; // slow pan from the room to the book (~2.5s)
const STAGE_SMOOTH_TIME = 0.4;
const INTRO_FALLBACK_MS = 3500; // `rest` may never fire in a hidden tab
const SKIP_CLICK_MS = 600;

// Reading: only a small orbit around the lifted book
const READING_AZIMUTH = 0.5;
const READING_POLAR = 0.35;

const TAU = Math.PI * 2;

// Portrait screens are narrow: back the camera off so the book still fits
const FIT_ASPECT = 1.0;

const framed = (key, aspect) => {
  const { pos, target } = CAMERA[key];
  const fit = Math.max(1, FIT_ASPECT / aspect);
  const offset = pos.map((value, i) => (value - target[i]) * fit);
  return { pos: offset.map((value, i) => value + target[i]), target, offset };
};

const lookAt = (controls, key, aspect, smooth) => {
  const { pos, target } = framed(key, aspect);
  return controls.setLookAt(...pos, ...target, smooth);
};

// Limits also clamp programmatic moves, so they are set per stage
const applyLimits = (controls, stage, aspect) => {
  if (stage !== "reading") {
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 0;
    controls.maxDistance = Infinity;
    return;
  }
  const [x, y, z] = framed("reading", aspect).offset;
  const distance = Math.hypot(x, y, z);
  // camera-controls keeps azimuth in [0, 2π); match it or the first drag
  // clamps the camera the long way round
  const azimuth = (Math.atan2(x, z) + TAU) % TAU;
  const polar = Math.acos(y / distance);
  controls.minAzimuthAngle = azimuth - READING_AZIMUTH;
  controls.maxAzimuthAngle = azimuth + READING_AZIMUTH;
  controls.minPolarAngle = Math.max(0.05, polar - READING_POLAR);
  controls.maxPolarAngle = polar + READING_POLAR;
  controls.minDistance = distance * 0.8;
  controls.maxDistance = distance * 1.25;
};

// No user camera input until the book is lifted; then rotate/dolly only
const applyInput = (controls, reading) => {
  const { ACTION } = controls.constructor;
  controls.mouseButtons.left = reading ? ACTION.ROTATE : ACTION.NONE;
  controls.mouseButtons.middle = ACTION.NONE;
  controls.mouseButtons.right = ACTION.NONE;
  controls.mouseButtons.wheel = reading ? ACTION.DOLLY : ACTION.NONE;
  controls.touches.one = reading ? ACTION.TOUCH_ROTATE : ACTION.NONE;
  controls.touches.two = reading ? ACTION.TOUCH_DOLLY : ACTION.NONE;
  controls.touches.three = ACTION.NONE;
};

// The tap that skips the intro must not also lift the book
const swallowNextClick = () => {
  const swallow = (e) => e.stopPropagation();
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(
    () => window.removeEventListener("click", swallow, { capture: true }),
    SKIP_CLICK_MS
  );
};

export const CameraRig = () => {
  const controls = useRef();
  const mounted = useRef(false);
  const [stage, setStage] = useAtom(stageAtom);
  const reduced = useReducedMotion();
  const aspect = useThree((state) => state.size.width / state.size.height);
  // Read through a ref so resizing doesn't restart the stage transition
  const aspectRef = useRef(aspect);
  aspectRef.current = aspect;

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const first = !mounted.current;
    mounted.current = true;
    const aspect = aspectRef.current;

    applyLimits(c, stage, aspect);
    applyInput(c, stage === "reading");
    c.smoothTime = stage === "intro" ? INTRO_SMOOTH_TIME : STAGE_SMOOTH_TIME;

    if (stage !== "intro") {
      lookAt(c, stage, aspect, !reduced && !first);
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setStage((current) => (current === "intro" ? "desk" : current));
    };
    const skip = (e) => {
      if (e.type === "pointerdown") swallowNextClick();
      lookAt(c, "desk", aspect, false);
      finish();
    };

    lookAt(c, "intro", aspect, false);
    if (reduced) {
      skip({});
      return;
    }
    lookAt(c, "desk", aspect, true).then(finish);
    const fallback = setTimeout(finish, INTRO_FALLBACK_MS);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      done = true;
      clearTimeout(fallback);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [stage, reduced, setStage]);

  // Re-frame for the new screen shape (device rotation, mobile URL bar)
  const stageRef = useRef(stage);
  stageRef.current = stage;
  useEffect(() => {
    const c = controls.current;
    const current = stageRef.current;
    if (!c || current === "intro") return;
    applyLimits(c, current, aspect);
    lookAt(c, current, aspect, false);
  }, [aspect]);

  // Remember the intro so the next visit starts at the desk
  useEffect(() => {
    if (stage !== "desk") return;
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Storage blocked (private mode): the intro simply plays again
    }
  }, [stage]);

  return <CameraControls ref={controls} makeDefault />;
};
