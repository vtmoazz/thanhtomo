import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useAtomValue } from "jotai";
import { Suspense } from "react";
import { Experience } from "./components/Experience";
import { Reader } from "./components/Reader";
import { readerAtom, UI } from "./components/UI";

function App() {
  // Pause 3D rendering while the 2D reader covers the book (saves battery)
  const reading = useAtomValue(readerAtom) !== null;

  return (
    <>
      <UI />
      <Loader />
      <Canvas
        shadows
        flat
        frameloop={reading ? "never" : "always"}
        camera={{ position: [-0.5, 1, 4], fov: 45 }}
      >
        <group position-y={0}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </group>
      </Canvas>
      <Reader />
    </>
  );
}

export default App;
