import { Vector3 } from "three";

// The background is a photo at infinity, so only where the camera looks
// matters; the book floats in front of the balcony glass doors (-z).
// The book's spine is its local origin; closed, it spans x = 0..1.28
export const BOOK_POSE = {
  // Waiting: closed and centred, leaning back a little, further away
  desk: { position: [-0.64, -0.15, 0], rotation: [-0.35, 0, 0] },
  // Lifted toward the viewer; opened, the spread is centred on the spine
  reading: { position: [0, 0.05, 0.9], rotation: [-0.25, 0, 0] },
};

const deskCamera = { pos: [0, 0.55, 4.6], target: [0, -0.1, 0] };

// The intro starts turned ~100° to the left, at the dining table, and pans
// right to the glass doors and the book
const INTRO_TURN = (100 * Math.PI) / 180;
const introTarget = new Vector3()
  .fromArray(deskCamera.target)
  .sub(new Vector3().fromArray(deskCamera.pos))
  .applyAxisAngle(new Vector3(0, 1, 0), INTRO_TURN)
  .add(new Vector3().fromArray(deskCamera.pos))
  .toArray();

export const CAMERA = {
  intro: { pos: deskCamera.pos, target: introTarget },
  desk: deskCamera,
  // Aimed a little below the book so it clears the page buttons
  reading: { pos: [0, 0.55, 5.1], target: [0, -0.2, 0.9] },
};
