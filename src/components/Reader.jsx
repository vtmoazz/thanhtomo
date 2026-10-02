import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { pageAtom, pictures, readerAtom, spreadOfPicture } from "./UI";

// Flat, full-screen reader: one Canva page per slide, swiped horizontally
// with native scroll-snap so touch, trackpad and keyboard all feel natural
export const Reader = () => {
  const [opened, setOpened] = useAtom(readerAtom);
  const setPage = useSetAtom(pageAtom);
  const trackRef = useRef();
  const [current, setCurrent] = useState(0);

  // Jump straight to the clicked page before the first paint
  useLayoutEffect(() => {
    if (opened === null || !trackRef.current) return;
    const track = trackRef.current;
    track.scrollLeft = opened * track.clientWidth;
    setCurrent(opened);
  }, [opened]);

  const goTo = useCallback((index) => {
    const track = trackRef.current;
    const target = Math.max(0, Math.min(pictures.length - 1, index));
    track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
  }, []);

  // Leave the 3D book open on the spread that was being read
  const close = useCallback(() => {
    setPage(spreadOfPicture(current));
    setOpened(null);
  }, [current, setOpened, setPage]);

  useEffect(() => {
    if (opened === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, current, close, goTo]);

  if (opened === null) return null;

  const onScroll = (e) => {
    const track = e.currentTarget;
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  };

  const arrowClass =
    "hidden md:flex absolute top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-white/80 text-2xl text-neutral-800 shadow hover:bg-white disabled:opacity-0 transition";

  return (
    <div
      className="fixed inset-0 z-20 bg-[#fffdf6]/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Đọc trang sách"
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {pictures.map((picture, index) => (
          <div
            key={picture}
            // Tapping the empty area around a page closes the reader
            onClick={(e) => e.target === e.currentTarget && close()}
            className="snap-center shrink-0 w-full h-full flex items-center justify-center px-4 py-16"
          >
            <img
              src={`/textures/${picture}.webp`}
              alt={`Trang ${index + 1}`}
              draggable={false}
              className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
            />
          </div>
        ))}
      </div>

      <button
        onClick={close}
        aria-label="Đóng"
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/80 text-xl text-neutral-800 shadow hover:bg-white"
      >
        ✕
      </button>
      <button
        onClick={() => goTo(current - 1)}
        disabled={current === 0}
        aria-label="Trang trước"
        className={`${arrowClass} left-4`}
      >
        ←
      </button>
      <button
        onClick={() => goTo(current + 1)}
        disabled={current === pictures.length - 1}
        aria-label="Trang sau"
        className={`${arrowClass} right-4`}
      >
        →
      </button>
      <p className="absolute bottom-5 inset-x-0 text-center text-sm font-medium text-neutral-500 pointer-events-none">
        {current + 1} / {pictures.length}
      </p>
    </div>
  );
};
