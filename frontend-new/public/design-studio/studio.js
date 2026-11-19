import { pages, directions } from "./concepts.js";

const nav = document.querySelector("#pages");
const options = document.querySelector("#options");
const name = document.querySelector("#page-name");
const feedback = document.querySelector("#feedback");
const count = document.querySelector("#count");
let picks = {};
try {
  picks = JSON.parse(localStorage.getItem("nw-design-picks") || "{}") || {};
} catch {}
let page = pages.some(([id]) => id === location.hash.slice(1))
  ? location.hash.slice(1)
  : "landing";
let device = "desktop";
let observer;

function updatePicks() {
  count.textContent = pages.filter(([id]) =>
    directions.some(({ key }) => key === picks[id]),
  ).length;
  for (const button of options.querySelectorAll("[data-pick]")) {
    const picked = picks[page] === button.dataset.pick;
    button.setAttribute("aria-pressed", String(picked));
    button.textContent = picked ? "Selected ✓" : "Pick this design";
  }
}

function render() {
  const label = pages.find(([key]) => key === page)[1];
  name.textContent = label;
  for (const button of nav.querySelectorAll("button")) {
    button.setAttribute(
      "aria-current",
      button.dataset.page === page ? "page" : "false",
    );
  }
  observer?.disconnect();
  const width = device === "phone" ? 390 : 900;
  const height = device === "phone" ? 650 : 640;
  options.innerHTML = directions
    .map(
      ({ key, name, detail }) => `
    <article class="option ${key}">
      <div class="option-head"><span class="swatch"></span><div><h3>${name}</h3><p>${detail}</p></div></div>
      <div class="preview"><iframe title="${name} · ${label}" src="screen.html?design=${key}&page=${page}" width="${width}" height="${height}" loading="eager"></iframe></div>
      <footer><button data-pick="${key}" aria-label="Pick ${name} for ${label}"></button><a href="screen.html?design=${key}&page=${page}" target="_blank" rel="noopener">Open full view ↗</a></footer>
    </article>`,
    )
    .join("");
  options.dataset.device = device;
  observer = new ResizeObserver((entries) => {
    for (const { target, contentRect } of entries) {
      const frame = target.firstElementChild;
      const scale = Math.min(contentRect.width / width, 1);
      target.style.height = `${height * scale}px`;
      frame.style.transform = `scale(${scale})`;
      frame.style.left = `${Math.max(0, (contentRect.width - width * scale) / 2)}px`;
    }
  });
  for (const preview of options.querySelectorAll(".preview"))
    observer.observe(preview);
  updatePicks();
}

for (const [id, label] of pages) {
  const button = document.createElement("button");
  button.dataset.page = id;
  button.textContent = label;
  button.onclick = () => {
    location.hash = id;
  };
  nav.append(button);
}
window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1);
  if (!pages.some(([id]) => id === next)) return;
  page = next;
  feedback.textContent = "";
  render();
});
for (const button of document.querySelectorAll("[data-device]")) {
  button.onclick = () => {
    device = button.dataset.device;
    for (const peer of document.querySelectorAll("[data-device]"))
      peer.setAttribute("aria-pressed", String(peer === button));
    render();
  };
}
options.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pick]");
  if (!button) return;
  if (picks[page] === button.dataset.pick) delete picks[page];
  else picks[page] = button.dataset.pick;
  try {
    localStorage.setItem("nw-design-picks", JSON.stringify(picks));
  } catch {}
  updatePicks();
  feedback.textContent = picks[page]
    ? `${name.textContent} selection saved in this browser.`
    : "Selection cleared.";
});
document.querySelector("#copy").onclick = async () => {
  const picked = pages.flatMap(([id, label]) => {
    const chosen = directions.find(({ key }) => key === picks[id]);
    return chosen ? [`${label}: ${chosen.name}`] : [];
  });
  if (!picked.length) {
    feedback.textContent = "Choose at least one page design first.";
    return;
  }
  try {
    await navigator.clipboard.writeText(picked.join("\n"));
    feedback.textContent =
      "Copied. Paste your picks into the chat when you’re ready.";
  } catch {
    feedback.textContent = picked.join(" · ");
  }
};
render();
