import { useAtom, useSetAtom } from "jotai";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import HTMLFlipBook from "react-pageflip";
import { pageAtom, pictures, readerAtom, spreadOfPicture } from "./UI";

const PAGE_RATIO = 1350 / 1080; // Canva pages are 4:5

// Largest page that fits the window: two pages side by side on wide
// screens, a single page on phones
const measure = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const portrait = vw < 768;
  const maxH = vh - 140; // room for the close button and page counter
  const maxW = portrait ? vw - 32 : (vw - 160) / 2;
  const width = Math.floor(Math.min(maxW, maxH / PAGE_RATIO));
  return { width, height: Math.floor(width * PAGE_RATIO), portrait };
};

// page-flip turns back without any animation in portrait (single page)
// mode. Instead, show the previous page and play its forward flip in
// reverse, so it sweeps in from the left like a real page. Covers taps,
// swipes, slow drags, the arrow buttons and the keyboard.
const BACK = 1; // page-flip's FlipDirection.BACK
const animatePortraitBackFlip = (pageFlip) => {
  if (pageFlip.backFlipPatched) return;
  pageFlip.backFlipPatched = true;
  const ctrl = pageFlip.getFlipController();
  const render = pageFlip.getRender();
  const flip = ctrl.flip.bind(ctrl);
  const fold = ctrl.fold.bind(ctrl);

  // Swap a backward turn for the previous page's forward flip, already
  // fully turned. Returns false when the normal behavior should run.
  const startReversed = (globalPos, decidingPos = globalPos) => {
    const turningBack =
      render.getOrientation() === "portrait" &&
      ctrl.getDirectionByPoint(render.convertToBook(decidingPos)) === BACK;
    if (!turningBack) return false;

    // Drop any running flip or hover corner-fold before restarting;
    // finishing a flip may change the page, so read it afterwards
    render.finishAnimation();
    ctrl.reset();
    const current = pageFlip.getCurrentPageIndex();
    if (current < 1) return false;
    pageFlip.turnToPage(current - 1);
    const rect = render.getRect();
    // Same point flipNext() uses, so start() picks a forward flip
    const started = ctrl.start({
      x: rect.left + rect.pageWidth * 2 - 10,
      y: globalPos.y,
    });
    // Undo the page change so a failed start can't step back repeatedly
    if (!started) pageFlip.turnToPage(current);
    return started;
  };

  ctrl.flip = (globalPos) => {
    if (!startReversed(globalPos)) return flip(globalPos);
    ctrl.setState("flipping");

    const rect = render.getRect();
    const margin = rect.height / 10;
    const bottom = ctrl.getCalculation().getCorner() === "bottom";
    ctrl.animateFlippingTo(
      { x: -rect.pageWidth, y: bottom ? rect.height : 0 },
      { x: rect.pageWidth, y: bottom ? rect.height - margin : margin },
      false
    );
  };

  // Where a drag started (not its first move, which can already be far
  // away) decides its direction; then the previous page follows the finger
  ctrl.fold = (globalPos) => {
    if (ctrl.getState() !== "user_fold") {
      const from = pageFlip.mousePosition ?? globalPos;
      if (!startReversed(globalPos, from)) {
        render.finishAnimation();
        ctrl.reset();
        ctrl.start(from);
      }
    }
    fold(globalPos);
  };
};

const last = pictures.length - 1;

// react-pageflip needs each page to forward its DOM ref
const Page = forwardRef(({ picture, index, hard }, ref) => (
  <div ref={ref} data-density={hard ? "hard" : "soft"} className="bg-white">
    <img
      src={`/textures/${picture}.webp`}
      alt={`Trang ${index + 1}`}
      draggable={false}
      className="w-full h-full object-cover select-none"
    />
  </div>
));

// 2D page-flip reader opened from the 3D book, for comfortable reading
export const Reader = () => {
  const [opened, setOpened] = useAtom(readerAtom);
  const setPage = useSetAtom(pageAtom);
  const bookRef = useRef();
  const [current, setCurrent] = useState(0);
  const [size, setSize] = useState(measure);

  // Stable children: react-pageflip reloads every page (killing a running
  // flip animation) whenever it receives new child elements
  const bookPages = useMemo(
    () =>
      pictures.map((picture, index) => (
        <Page
          key={picture}
          picture={picture}
          index={index}
          hard={index === 0 || index === last}
        />
      )),
    []
  );

  useEffect(() => {
    if (opened === null) return;
    setCurrent(opened);
    setSize(measure());
    const onResize = () => setSize(measure());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [opened]);

  // react-pageflip creates its PageFlip a few renders after mounting
  // (and again after each resize remount), so wait until it exists
  useEffect(() => {
    if (opened === null) return;
    let frame;
    const patch = () => {
      const pageFlip = bookRef.current?.pageFlip();
      if (pageFlip) animatePortraitBackFlip(pageFlip);
      else frame = requestAnimationFrame(patch);
    };
    patch();
    return () => cancelAnimationFrame(frame);
  }, [opened, size]);

  const flip = useCallback((direction) => {
    const book = bookRef.current?.pageFlip();
    if (!book) return;
    direction > 0 ? book.flipNext() : book.flipPrev();
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
      if (e.key === "ArrowRight") flip(1);
      if (e.key === "ArrowLeft") flip(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, close, flip]);

  if (opened === null) return null;

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/80 text-2xl text-neutral-800 shadow hover:bg-white disabled:opacity-0 transition z-10";

  return (
    <div
      className="fixed inset-0 z-20 bg-[#fffdf6]/85 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Đọc trang sách"
      // Tapping the empty area around the book closes the reader
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <HTMLFlipBook
        // The library reads its settings once, so remount on resize
        key={`${size.width}x${size.portrait}`}
        ref={bookRef}
        width={size.width}
        height={size.height}
        size="fixed"
        usePortrait={size.portrait}
        startPage={opened}
        showCover
        drawShadow
        maxShadowOpacity={0.4}
        flippingTime={700}
        mobileScrollSupport={false}
        onFlip={(e) => setCurrent(e.data)}
        className="shadow-xl"
      >
        {bookPages}
      </HTMLFlipBook>

      <button
        onClick={close}
        aria-label="Đóng"
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/80 text-xl text-neutral-800 shadow hover:bg-white z-10"
      >
        ✕
      </button>
      <button
        onClick={() => flip(-1)}
        disabled={current === 0}
        aria-label="Trang trước"
        className={`${arrowClass} left-2 md:left-4`}
      >
        ←
      </button>
      <button
        onClick={() => flip(1)}
        disabled={current >= last}
        aria-label="Trang sau"
        className={`${arrowClass} right-2 md:right-4`}
      >
        →
      </button>
      <p className="absolute bottom-5 inset-x-0 text-center text-sm font-medium text-neutral-500 pointer-events-none">
        {size.portrait || current === 0 || current === last
          ? current + 1
          : `${current + 1}–${current + 2}`}{" "}
        / {pictures.length}
      </p>
    </div>
  );
};
