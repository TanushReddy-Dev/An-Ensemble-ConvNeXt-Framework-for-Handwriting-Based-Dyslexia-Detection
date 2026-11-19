const preference = matchMedia("(prefers-reduced-motion: reduce)");
const active = new Set();
let pointer = false;
let sidebarMotion;
let pageMotion;

function settle() {
  for (const animation of active) animation.cancel();
  active.clear();
}

export function bindMotion() {
  document.addEventListener(
    "pointerdown",
    () => {
      pointer = true;
    },
    true,
  );
  document.addEventListener(
    "keydown",
    () => {
      pointer = false;
      settle();
    },
    true,
  );
  preference.addEventListener("change", settle);
}

function animate(element, frames, duration, curve = "--m-ease") {
  if (
    !element ||
    !pointer ||
    preference.matches ||
    document.documentElement.dataset.motion === "off" ||
    !element.animate
  )
    return;
  const easing = getComputedStyle(element).getPropertyValue(curve).trim();
  const animation = element.animate(frames, { duration, easing });
  active.add(animation);
  const remove = () => active.delete(animation);
  animation.addEventListener("finish", remove, { once: true });
  animation.addEventListener("cancel", remove, { once: true });
  return animation;
}

export function enterSurface(
  element,
  { duration = 200, from = [], opacity = 0.82 } = {},
) {
  const [start, end] = from;
  return animate(
    element,
    [
      { opacity, ...(start && { transform: start }) },
      { opacity: 1, ...(end && { transform: end }) },
    ],
    duration,
  );
}

export function revealPage(element, { accountEntry = false } = {}) {
  pageMotion?.cancel();
  pageMotion = enterSurface(
    element,
    accountEntry
      ? {
          duration: 220,
          opacity: 0.5,
          from: ["translateY(0.375rem)", "translateY(0)"],
        }
      : { duration: 180, opacity: 0.76 },
  );
}

function moveSidebarIndicator(root, before) {
  const indicator = root.querySelector(".sidebar-indicator");
  const selection = root.querySelector(".sidebar nav > a.active");
  if (!indicator || !selection?.offsetHeight) {
    sidebarMotion?.cancel();
    sidebarMotion = undefined;
    return;
  }
  const end = selection.offsetTop;
  indicator.style.height = `${selection.offsetHeight}px`;
  indicator.style.transform = `translateY(${end}px)`;
  indicator.setAttribute("data-positioned", "");

  if (!before.selection || before.selection === selection) return;
  sidebarMotion?.cancel();
  const start =
    before.indicatorTop - indicator.parentElement.getBoundingClientRect().top;
  if (!Number.isFinite(start) || Math.abs(start - end) < 1) return;
  const duration = parseFloat(
    getComputedStyle(indicator).getPropertyValue("--m-slide"),
  );
  sidebarMotion = animate(
    indicator,
    [
      { transform: `translateY(${start}px)` },
      { transform: `translateY(${end}px)` },
    ],
    duration,
    "--m-ease-io",
  );
}

const statusSelector =
  ".notice.success, .saved-state, .processing-status [role='status']";
const imageSelector = ".dropzone.has-image img, .viewer-image img";

export function captureMotionState(root) {
  const indicator = root.querySelector(".sidebar-indicator[data-positioned]");
  return {
    indicatorTop: indicator?.getBoundingClientRect().top,
    selection: root.querySelector(".sidebar nav > a.active"),
    sidebarOpen: Boolean(root.querySelector(".sidebar.is-open")),
    statuses: new Set(
      [...root.querySelectorAll(statusSelector)].map(
        (node) => node.textContent,
      ),
    ),
    image: root.querySelector(imageSelector)?.getAttribute("src"),
    previewTab: root.querySelector('[role="tabpanel"]:not([hidden])')?.id,
  };
}

export function revealMotionState(root, before, pageChanged) {
  moveSidebarIndicator(root, before);
  if (!before.sidebarOpen) {
    enterSurface(root.querySelector(".sidebar.is-open"), { duration: 200 });
  }
  if (pageChanged) return;
  for (const status of root.querySelectorAll(statusSelector)) {
    if (!before.statuses.has(status.textContent))
      enterSurface(status, { duration: 150 });
  }
  const tab = root.querySelector('[role="tabpanel"]:not([hidden])');
  if (tab && tab.id !== before.previewTab) {
    enterSurface(tab, { duration: 150 });
  } else {
    const image = root.querySelector(imageSelector);
    if (image && image.getAttribute("src") !== before.image) {
      enterSurface(image, { duration: 150 });
    }
  }
}
