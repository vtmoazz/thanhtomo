import { PerformanceMonitor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAtomValue } from "jotai";
import { easing } from "maath";
import { useRef, useState } from "react";
import { Euler, Vector3 } from "three";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { Book } from "./Book";
import { CameraRig } from "./CameraRig";
import { Backdrop } from "./scene/Backdrop";
import { BOOK_POSE } from "./scene/poses";
import { stageAtom } from "./UI";

const POSE_SMOOTH_TIME = 0.35;

const targetPosition = new Vector3();
const targetRotation = new Euler();

// Moves the book between its waiting and reading poses. It floats, so it
// bobs gently in both, like the old floating book but calmer
const BookPose = ({ children }) => {
  const group = useRef();
  const stage = useAtomValue(stageAtom);
  const reduced = useReducedMotion();
  const reading = stage === "reading";
  const pose = reading ? BOOK_POSE.reading : BOOK_POSE.desk;
  // Only the first pose goes through props: R3F would apply later changes
  // instantly, skipping the damping below
  const [initial] = useState(pose);

  useFrame(({ clock }, delta) => {
    const bob = reduced ? 0 : Math.sin(clock.elapsedTime * 1.2);
    targetPosition.fromArray(pose.position);
    targetPosition.y += bob * 0.03;
    targetRotation.set(
      pose.rotation[0] + bob * 0.02,
      pose.rotation[1] + bob * 0.015,
      pose.rotation[2]
    );
    if (reduced) {
      group.current.position.copy(targetPosition);
      group.current.rotation.copy(targetRotation);
      return;
    }
    easing.damp3(group.current.position, targetPosition, POSE_SMOOTH_TIME, delta);
    easing.dampE(group.current.rotation, targetRotation, POSE_SMOOTH_TIME, delta);
  });

  return (
    <group ref={group} position={initial.position} rotation={initial.rotation}>
      {children}
    </group>
  );
};

export const Experience = ({ onDecline }) => (
  <>
    <PerformanceMonitor onDecline={onDecline} />
    <CameraRig />
    <Backdrop />
    <BookPose>
      <Book />
    </BookPose>
    {/* No environment lighting: the photo's bright windows overexposed the
        pages. Ambient + directional sum to ~PI so a page facing the light
        shows its printed colors at 1:1 without clipping; the light comes
        from the reading pose's page normal */}
    <ambientLight intensity={1.9} />
    <directionalLight position={[0, 4, 9]} color="#fff6ea" intensity={1.1} />
  </>
);
