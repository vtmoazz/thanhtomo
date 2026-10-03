import { Environment, useTexture } from "@react-three/drei";
import { EquirectangularReflectionMapping, SRGBColorSpace } from "three";

// "Cayley Interior" by Greg Zaal, Poly Haven (CC0): a real 360° photo of a
// room with balcony glass doors at dawn. https://polyhaven.com/a/cayley_interior
const PHOTO = "/textures/backdrop/cayley-interior.webp";

// The glass doors sit at +x in the photo; turn them to -z, behind the book
const ROTATION = [0, Math.PI / 2 - 0.38, 0];
// A little blur, like a shallow depth of field, keeps the book in focus
const BLUR = 0.04;

const toPanorama = (texture) => {
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;
};

// Background only: the photo's bright windows would overexpose the pages
export const Backdrop = () => {
  const photo = useTexture(PHOTO, toPanorama);
  return (
    <Environment
      map={photo}
      background="only"
      backgroundBlurriness={BLUR}
      backgroundRotation={ROTATION}
    />
  );
};

useTexture.preload(PHOTO);
