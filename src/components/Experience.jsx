import { Float, OrbitControls } from "@react-three/drei";
import { Book } from "./Book";

export const Experience = () => {
  return (
    <>
      <Float
        rotation-x={-Math.PI / 4}
        floatIntensity={1}
        speed={2}
        rotationIntensity={2}
      >
        <Book />
      </Float>
      <OrbitControls />
      {/* No HDR environment: its bright softboxes overexposed the pages.
          Ambient + directional sum to ~PI so a page facing the light shows
          its printed colors at 1:1 without clipping. */}
      <ambientLight intensity={1.9} />
      <directionalLight
        position={[2, 5, 2]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.12} />
      </mesh>
    </>
  );
};
