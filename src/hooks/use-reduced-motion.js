import { useEffect, useState } from "react";

// Ported from Hostlife22/sunday-space `useMotionPreference` (MIT)
// https://github.com/Hostlife22/sunday-space/blob/main/src/state/useMotionPreference.ts
const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia(QUERY).matches
  );
  useEffect(() => {
    const query = window.matchMedia(QUERY);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
