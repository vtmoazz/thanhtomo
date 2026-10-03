import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { getDefaultStore, useAtomValue } from "jotai";
import { Suspense, useState } from "react";
import { Experience } from "./components/Experience";
import { Reader } from "./components/Reader";
import { CAMERA } from "./components/scene/poses";
import { readerAtom, stageAtom, UI } from "./components/UI";

function App() {
  // Pause 3D rendering while the 2D reader covers the book (saves battery)
  const reading = useAtomValue(readerAtom) !== null;
  // Start where the camera rig begins so the first frame doesn't jump. Read
  // once without subscribing: App needn't re-render on every stage change
  const [initialCamera] = useState(
    () => CAMERA[getDefaultStore().get(stageAtom)].pos
  );
  // Kept in state: Canvas re-applies its `dpr` prop on every render, which
  // would undo a downgrade made through R3F's own setDpr
  const [dpr, setDpr] = useState([1, 2]);

  return (
    <>
      <UI />
      <Loader
        containerStyles={{ background: "#e8e1d6" }}
        barStyles={{ background: "#8a6a4c" }}
        dataStyles={{ color: "#5b4a3a" }}
      />
      <Canvas
        flat
        dpr={dpr}
        frameloop={reading ? "never" : "always"}
        camera={{ position: initialCamera, fov: 40 }}
      >
        <Suspense fallback={null}>
          <Experience onDecline={() => setDpr(1)} />
        </Suspense>
      </Canvas>
      <Reader />
    </>
  );
}

export default App;
