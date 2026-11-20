// The CSS still remains visible whenever playback stops.
export function bindHeroScan(scene) {
  const pass = scene.querySelector("[data-scan-pass]");
  const review = scene.querySelector("[data-scan-review]");
  const toggle = scene.querySelector("[data-scan-toggle]");
  const icon = toggle.querySelector("path");
  const image = scene.querySelector("img");
  const paper = image.parentElement;
  if (!pass.animate || !("IntersectionObserver" in window)) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let ready = false;
  let inView = false;
  let paused = false;
  let introduced = false;
  let animations = [];

  function sync() {
    const motionAllowed =
      !reduced.matches && document.documentElement.dataset.motion !== "off";
    toggle.hidden = !motionAllowed || !ready;
    const shouldPlay =
      motionAllowed &&
      ready &&
      inView &&
      scene.isConnected &&
      !document.hidden &&
      !paused;
    if (!shouldPlay) {
      for (const animation of animations) animation.cancel();
      animations = [];
      return;
    }
    if (animations.length) return;

    const delay = introduced ? 0 : 200;
    if (!introduced) {
      const easing = getComputedStyle(scene)
        .getPropertyValue("--m-ease")
        .trim();
      animations.push(
        paper.animate(
          [
            { transform: "translateY(12px) scale(.97)", opacity: 0.8 },
            { transform: "translateY(0) scale(1)", opacity: 1 },
          ],
          { duration: 240, easing },
        ),
      );
      introduced = true;
    }
    const loop = { delay, duration: 2050, iterations: Infinity };
    animations.push(
      pass.animate(
        [
          { transform: "translateY(0%)", opacity: 0 },
          { opacity: 1, offset: 0.07 },
          { opacity: 1, offset: 0.51 },
          { transform: "translateY(100%)", opacity: 0, offset: 0.62 },
          { transform: "translateY(100%)", opacity: 0 },
        ],
        loop,
      ),
      review.animate(
        [
          { opacity: 1 },
          { opacity: 0, offset: 0.08 },
          { opacity: 0, offset: 0.62 },
          { opacity: 1, offset: 0.76 },
          { opacity: 1 },
        ],
        loop,
      ),
    );
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.intersectionRatio >= 0.35;
      sync();
    },
    { threshold: 0.35 },
  );
  observer.observe(scene);
  image
    .decode()
    .then(() => {
      ready = true;
      sync();
    })
    .catch(() => {});
  toggle.addEventListener("click", () => {
    paused = !paused;
    toggle.setAttribute(
      "aria-label",
      `${paused ? "Resume" : "Pause"} handwriting illustration`,
    );
    icon.setAttribute("d", paused ? "M9 5l11 7-11 7Z" : "M9 5v14M15 5v14");
    sync();
  });
  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("nw:public-unmounted", () => {
    inView = false;
    sync();
  });
}
