import { atom, useAtom } from "jotai";
import { useEffect } from "react";

// Pages exported from Canva "Vài điều về Vân Thanh" (1080x1350, 4:5)
const pictures = Array.from(
  { length: 10 },
  (_, i) => `page-${String(i + 1).padStart(2, "0")}`
);

export const pageAtom = atom(0);

// Each sheet has a front and a back: cover = page-01, back cover = page-10
export const pages = [];
for (let i = 0; i < pictures.length; i += 2) {
  pages.push({ front: pictures[i], back: pictures[i + 1] });
}

const marqueeWords = [
  { text: "Vân Thanh", className: "text-white text-10xl font-black" },
  { text: "Ivy Phạm", className: "text-white text-8xl italic font-light" },
  { text: "Tìm và hiểu về", className: "text-white text-12xl font-bold" },
  {
    text: "bản thân",
    className: "text-transparent text-12xl font-bold italic outline-text",
  },
  { text: "Ma Kết", className: "text-white text-9xl font-medium" },
  { text: "@thanhtomo", className: "text-white text-9xl font-extralight italic" },
  { text: "Daily Routine", className: "text-white text-13xl font-bold" },
  {
    text: "khác biệt",
    className: "text-transparent text-13xl font-bold outline-text italic",
  },
];

const Marquee = ({ className }) => (
  <div className={`bg-white/0 flex items-center gap-8 w-max px-8 ${className}`}>
    {marqueeWords.map(({ text, className }) => (
      <h2 key={text} className={`shrink-0 ${className}`}>
        {text}
      </h2>
    ))}
  </div>
);

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);

  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play().catch(() => {}); // browsers block audio before first interaction
  }, [page]);

  const buttonClass = (active) =>
    `border-transparent hover:border-white transition-all duration-300 px-4 py-3 rounded-full text-lg uppercase shrink-0 border ${
      active ? "bg-white/90 text-black" : "bg-black/30 text-white"
    }`;

  return (
    <>
      <main className="pointer-events-none select-none z-10 fixed inset-0 flex justify-between flex-col">
        <p className="mt-10 ml-10 text-white text-xl font-semibold">
          @thanhtomo
        </p>
        <div className="w-full overflow-auto pointer-events-auto flex justify-center">
          <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
            {pages.map((_, index) => (
              <button
                key={index}
                className={buttonClass(index === page)}
                onClick={() => setPage(index)}
              >
                {index === 0 ? "Bìa" : `Trang ${index}`}
              </button>
            ))}
            <button
              className={buttonClass(page === pages.length)}
              onClick={() => setPage(pages.length)}
            >
              Bìa sau
            </button>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 flex items-center -rotate-2 select-none">
        <div className="relative">
          <Marquee className="animate-horizontal-scroll" />
          <Marquee className="absolute top-0 left-0 animate-horizontal-scroll-2" />
        </div>
      </div>
    </>
  );
};
