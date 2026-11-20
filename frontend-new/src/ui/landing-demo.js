import { enterSurface } from "./motion.js";

const workflow = {
  screen: [
    "Screen the sample",
    "PRISM analyzes the uploaded handwriting image and returns its experimental screening signal.",
  ],
  review: [
    "Review the result",
    "Compare the original image with available model views. You can save a result or request a PDF.",
  ],
};

const explanations = {
  original:
    "Original image of the fictional worksheet. The overlays are illustrations.",
  regions:
    "Illustration of Grad-CAM. Broad shading represents regions associated with the model output.",
  strokes:
    "Illustration of stroke attribution. Fine marks represent pixel contributions along handwriting.",
};

function bindControls(root, select) {
  const controls = root.querySelector("[data-demo-controls]");
  const buttons = [...controls.querySelectorAll("button")];
  controls.hidden = false;
  for (const button of buttons) {
    button.addEventListener("click", () => {
      for (const item of buttons) {
        item.setAttribute("aria-pressed", String(item === button));
      }
      select(button.dataset.demoValue);
    });
  }
}

function bindLens(scene) {
  const range = scene.querySelector(".lens-range");
  const controls = scene.querySelector("[data-lens-controls]");
  const buttons = [...controls.querySelectorAll("button")];
  let entrance;

  function setAmount(amount) {
    entrance?.cancel();
    range.value = amount;
    scene.style.setProperty("--lens-edge", `${100 - amount}%`);
    scene.toggleAttribute("data-lens-endpoint", amount === 0 || amount === 100);
    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.lensValue) === amount),
      );
    }
  }

  range.hidden = false;
  controls.hidden = false;
  setAmount(Number(range.value));
  range.addEventListener("input", () => setAmount(Number(range.value)));
  for (const button of buttons) {
    button.addEventListener("click", () =>
      setAmount(Number(button.dataset.lensValue)),
    );
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const stop = () => entrance?.cancel();
  reduced.addEventListener("change", stop);
  document.addEventListener("nw:public-unmounted", stop);
  if (!scene.animate || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.intersectionRatio < 0.45) return;
      observer.disconnect();
      if (reduced.matches || document.documentElement.dataset.motion === "off")
        return;
      const easing = getComputedStyle(scene)
        .getPropertyValue("--m-ease")
        .trim();
      entrance = scene.animate(
        [
          { "--lens-edge": "94%" },
          { "--lens-edge": "24%", offset: 0.66 },
          { "--lens-edge": "50%" },
        ],
        { duration: 1200, easing },
      );
    },
    { threshold: 0.45 },
  );
  range.addEventListener("pointerdown", () => {
    observer.disconnect();
    stop();
  });
  range.addEventListener("focus", () => {
    observer.disconnect();
    stop();
  });
  controls.addEventListener("click", () => observer.disconnect());
  observer.observe(scene);
}

export function bindLandingDemo(landing) {
  bindLens(landing.querySelector("[data-review-lens]"));
  const steps = landing.querySelector("[data-workflow-demo]");
  const choose = steps.querySelector('[data-demo-panel="choose"]');
  const sample = steps.querySelector('[data-demo-panel="sample"]');
  const stageTitle = sample.querySelector("[data-demo-title]");
  const stageDescription = sample.querySelector("[data-demo-description]");
  bindControls(steps, (value) => {
    choose.hidden = value !== "choose";
    sample.hidden = value === "choose";
    if (sample.hidden) return;
    sample.dataset.workflowView = value;
    [stageTitle.textContent, stageDescription.textContent] = workflow[value];
    enterSurface(sample, { duration: 160 });
  });

  const views = landing.querySelector("[data-explanation-demo]");
  const description = landing.querySelector(
    "#explanations [data-demo-description]",
  );
  bindControls(views, (value) => {
    views.dataset.explanationView = value;
    description.textContent = explanations[value];
  });
}
