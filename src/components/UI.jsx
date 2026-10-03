import { atom, useAtom } from "jotai";
import { useEffect, useRef } from "react";

// Pages exported from Canva "Vài điều về Vân Thanh" (1080x1350, 4:5)
export const pictures = Array.from(
  { length: 10 },
  (_, i) => `page-${String(i + 1).padStart(2, "0")}`
);

export const pageAtom = atom(0);

// Index into `pictures` shown in the 2D reader, or null when it is closed
export const readerAtom = atom(null);

// Spread that shows a picture: page N shows sheet N-1's back and sheet N's front
export const spreadOfPicture = (pictureIndex) => Math.ceil(pictureIndex / 2);

// Each sheet has a front and a back: cover = page-01, back cover = page-10
export const pages = [];
for (let i = 0; i < pictures.length; i += 2) {
  pages.push({ front: pictures[i], back: pictures[i + 1] });
}

// Scene flow: "intro" (camera pans to the book) -> "desk" (closed book
// waits in front of the balcony) -> "reading" (book comes closer, opens). Returning visitors skip straight to the desk
export const INTRO_SEEN_KEY = "thanhtomo:intro-seen";
const introSeen = () => {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
};
export const stageAtom = atom(introSeen() ? "desk" : "intro");

// True while "Gấp sách" is closing the book; page input is ignored
export const closingAtom = atom(false);

// Closing flips one sheet per ~150ms (see Book), then the cover settles
const FLIP_STEP_MS = 150;
const COVER_SETTLE_MS = 600;

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const [stage, setStage] = useAtom(stageAtom);
  const [closing, setClosing] = useAtom(closingAtom);
  const closeTimer = useRef();
  const reading = stage === "reading";

  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play().catch(() => {}); // browsers block audio before first interaction
  }, [page]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Enter or Space lifts the book from the desk (buttons handle their own keys)
  useEffect(() => {
    if (stage !== "desk") return;
    const onKeyDown = (e) => {
      if (e.target.closest?.("button")) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      setStage("reading");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage, setStage]);

  // Close the book first, then send it back to its waiting pose
  const putDown = () => {
    setClosing(true);
    setPage(0);
    closeTimer.current = setTimeout(
      () => {
        setStage("desk");
        setClosing(false);
      },
      page === 0 ? 0 : page * FLIP_STEP_MS + COVER_SETTLE_MS
    );
  };

  const buttonClass = (active) =>
    `border-transparent hover:border-neutral-800 transition-all duration-300 px-4 py-3 rounded-full text-lg uppercase shrink-0 border ${
      active ? "bg-neutral-800 text-white" : "bg-white/70 text-neutral-800"
    }`;

  const hintClass =
    "px-4 py-1.5 rounded-full bg-white/70 text-xs md:text-sm text-neutral-600";

  return (
    <main className="pointer-events-none select-none z-10 fixed inset-0 flex justify-between flex-col">
      <header
        className={`mt-5 px-5 text-neutral-800 transition-opacity duration-700 ${
          reading ? "opacity-0" : "opacity-100"
        }`}
      >
        <h1 className="text-sm md:text-lg font-semibold max-w-[16rem] md:max-w-none">
          Ở đây có một em bé 21 tuổi hay tò mò
        </h1>
        <p className="text-xs md:text-sm font-medium text-neutral-500">
          @thanhtomo
        </p>
      </header>

      {stage === "desk" && (
        <div className="flex flex-col items-center pb-10">
          <p className={`${hintClass} motion-safe:animate-pulse`}>
            Chạm vào cuốn sách
          </p>
          <button
            className={`sr-only focus:not-sr-only focus:mt-2 pointer-events-auto ${hintClass}`}
            onClick={() => setStage("reading")}
          >
            Mở cuốn sách
          </button>
        </div>
      )}

      {reading && (
        <div className="flex flex-col items-center">
          <p className={hintClass}>Chạm 1 lần để lật trang · Chạm 2 lần để mở đọc</p>
          <div className="w-full overflow-auto pointer-events-auto flex justify-center">
            <div className="overflow-auto flex items-center gap-4 max-w-full px-10 pt-4 pb-4">
              {pages.map((_, index) => (
                <button
                  key={index}
                  className={buttonClass(index === page)}
                  onClick={() => setPage(index)}
                  disabled={closing}
                >
                  {index === 0 ? "Bìa" : `Trang ${index}`}
                </button>
              ))}
              <button
                className={buttonClass(page === pages.length)}
                onClick={() => setPage(pages.length)}
                disabled={closing}
              >
                Bìa sau
              </button>
            </div>
          </div>
          <button
            className="pointer-events-auto mb-8 px-4 py-2 rounded-full text-sm bg-white/70 text-neutral-700 border border-transparent hover:border-neutral-800 transition-all duration-300 disabled:opacity-50"
            onClick={putDown}
            disabled={closing}
            aria-label="Gấp sách lại"
          >
            Gấp sách
          </button>
        </div>
      )}
    </main>
  );
};
