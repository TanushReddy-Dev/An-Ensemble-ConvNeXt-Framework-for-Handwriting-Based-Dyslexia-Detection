import { pages, directions } from "./concepts.js";

const params = new URLSearchParams(location.search);
const design =
  directions.find((item) => item.key === params.get("design")) ?? directions[0];
const [page, label] =
  pages.find(([id]) => id === params.get("page")) ?? pages[0];
document.body.classList.add(design.key, page);
document.title = `${label} · ${design.name} · PRISM`;
const variant = (folio, signal, field) =>
  ({ folio, signal, field })[design.key];
const base = "/assets/images/";
const photos = {
  landing: "landing-640.webp",
  login: "login-640.webp",
  signup: "signup-640.webp",
  dashboard: "dashboard-640.webp",
};
const sample = variant(
  "Garden notes",
  "Cloud observations",
  "A page from the field",
);
const file = variant(
  "garden-notes.jpg",
  "cloud-observations.jpg",
  "field-journal.jpg",
);
const specimen = (className = "") =>
  `<img class="specimen ${className}" src="${base}studio-${design.key}.webp" alt="Fictional handwritten sample on a desk">`;
const photo = (key) =>
  `<img class="specimen" src="${base}${photos[key]}" alt="">`;
const brand =
  '<span class="mark" aria-hidden="true"></span><span>PRISM</span>';
const button = (text, secondary = false) =>
  `<button type="button" class="action ${secondary ? "secondary" : ""}">${text}</button>`;
const badge = (content) => `<span class="badge">${content}</span>`;
const panel = (content, cls = "") =>
  `<section class="panel ${cls}">${content}</section>`;
const heading = (title, copy, actions = "") =>
  `<header class="page-heading"><div><h1>${title}</h1><p>${copy}</p></div>${actions}</header>`;
const field = (name, placeholder, type = "text") =>
  `<label>${name}<input type="${type}" placeholder="${placeholder}" readonly></label>`;
const notice =
  "Experimental screening. Professional assessment remains essential.";
const navigation = [
  ["dashboard", "Overview"],
  ["upload", "New screening"],
  ["history", "History"],
  ["report", "Reports"],
  ["settings", "Settings"],
];
const nav = navigation
  .map(
    ([id, name]) =>
      `<a class="${id === page ? "active" : ""}" href="?design=${design.key}&page=${id}">${name}</a>`,
  )
  .join("");
const preview = `<div class="frame-label"><span>Image preview</span><span>${file}</span></div>${specimen()}`;
const rows = `<div class="records"><div class="row labels"><span>Screening</span><span>Signal</span><span>Reviewed</span></div>
  ${[
    [sample, "Elevated", "Today"],
    ["Writing practice", "Typical", "Yesterday"],
    ["Class notes", "Typical", "15 Nov"],
  ]
    .map(
      ([name, signal, date]) =>
        `<div class="row"><span><i class="record-icon">▤</i><strong>${name}</strong></span><span>${badge(signal)}</span><span>${date}</span></div>`,
    )
    .join("")}</div>`;
const sequence = `<ol class="steps"><li><span>1</span><div><strong>Choose an image</strong><small>Start with a clear page of handwriting.</small></div></li><li><span>2</span><div><strong>Review the signal</strong><small>Look at the score and available explanations.</small></div></li><li><span>3</span><div><strong>Keep your review</strong><small>Save a result or download a PDF.</small></div></li></ol>`;

function landing() {
  const title = variant(
    "A closer look at the written page.",
    "Handwriting screening, with the evidence in view.",
    "A clearer starting point for handwriting review.",
  );
  return `<header class="public-nav"><a class="brand" href="?design=${design.key}">${brand}</a><nav><a href="#review">How it works</a><a href="?design=${design.key}&page=login">Sign in</a></nav></header>
    <section class="hero"><div class="hero-copy"><h1>${title}</h1><p>Upload a page of handwriting and review the experimental screening signal and available model explanations.</p><div class="actions"><a class="action" href="?design=${design.key}&page=upload">Start a screening ↗</a></div><small>${notice}</small></div><div class="hero-photo">${specimen()}</div></section>
    <section id="review" class="further"><h2>From an image to a review.</h2>${sequence}</section>
    <footer class="public-footer"><div class="brand">${brand}</div><p>${notice}</p></footer>`;
}

function account() {
  const signup = page === "signup";
  const other = signup ? "login" : "signup";
  const title = signup ? "Create your workspace." : "Welcome back.";
  const asideTitle = variant(
    "A dedicated space for review.",
    signup ? "Set up your review console." : "Return to your review queue.",
    signup ? "Keep your notes together." : "Pick up where you left off.",
  );
  return `<header class="public-nav"><a class="brand" href="?design=${design.key}">${brand}</a><a href="?design=${design.key}&page=${other}">${signup ? "Sign in" : "Create account"} ↗</a></header>
    <div class="account-layout">
      <section class="account-form"><h1>${title}</h1><p>${signup ? "Save screenings and return to your reviews." : "Open your saved handwriting screenings."}</p>
      ${signup ? field("Name", "Your name") + field("Institution (optional)", "School or organisation") : ""}
      ${field("Email address", "you@example.com", "email")}${field("Password", "••••••••", "password")}
      ${button(signup ? "Create account" : "Sign in")}<div class="account-links"><span>${signup ? "" : "Forgot password?"}</span><a href="?design=${design.key}&page=${other}">${signup ? "Back to sign in" : "Create an account"}</a></div></section>
      <aside class="account-art">${photo(page)}<div><h2>${asideTitle}</h2><p>${notice}</p></div></aside>
    </div>`;
}

const screens = {
  dashboard() {
    const feature = `<div class="dashboard-feature">${photo("dashboard")}<div><h2>${variant("Start a review", "New analysis", "Start with a page")}</h2><p>Choose a clear handwriting image and review it before screening.</p>${button("Choose an image ↗")}</div></div>`;
    return (
      heading(
        variant("Review desk", "Screening overview", "Your review workspace"),
        "Review handwriting and revisit your saved screenings.",
      ) +
      `<div class="dashboard-content">${feature}${panel(sequence, "sequence")}</div><h2 class="section-title">Recent screenings</h2>${rows}`
    );
  },
  upload() {
    return (
      heading(
        "New screening",
        "Choose a clear handwriting image. You can review it before it’s sent.",
      ) +
      `<div class="two-col"><div class="image-panel">${preview}</div>
        ${panel(
          `<h2>Before you begin</h2><p>Check that the page is evenly lit and the handwriting is easy to see.</p>
          ${field("Subject identifier (optional)", "An identifier you recognise")}<p class="notice">${notice}</p><div class="actions">${button("Run screening ↗")}${button("Change image", true)}</div>`,
          "review-card",
        )}</div>`
    );
  },
  processing() {
    const status = panel(
      `<span class="pulse"></span><h2>Screening in progress</h2><p role="status">Waiting for the model response…</p><div class="loading-line" aria-hidden="true"></div><p class="muted">The first request can take longer while models load.</p>${button("Cancel request", true)}`,
      "status-card",
    );
    return (
      heading(
        "Screening your image",
        "Your handwriting image stays in view while the model runs.",
      ) +
      `<div class="two-col"><div class="image-panel">${preview}</div>${status}</div>`
    );
  },
  result() {
    const score = panel(
      `${badge("Example · Elevated signal")}<div class="score">64<span>%</span></div><p>Model screening score</p>
      <div class="folds" aria-hidden="true"><i style="--height:45%"></i><i style="--height:68%"></i><i style="--height:56%"></i><i style="--height:81%"></i><i style="--height:66%"></i></div><small>Fold disagreement · 48–74%</small><p class="notice">${notice}</p>${button("Save result")}`,
      "score-card",
    );
    return (
      heading(
        sample,
        "Review the screening signal alongside the original image.",
        button("Generate report", true),
      ) +
      `<div class="two-col"><div class="image-panel"><div class="view-tabs"><strong>Original</strong><span>Attention</span><span>Grad-CAM</span><span>Strokes</span></div>${specimen()}</div>${score}</div>`
    );
  },
  history() {
    return (
      heading(
        "Screening history",
        "Revisit the screenings you chose to save.",
        button("Start a screening"),
      ) +
      `<div class="filters">${field("Find a screening", "Search by subject")}<div>${badge("All patterns")}${badge("Elevated")}${badge("Typical")}</div></div>
      ${design.key === "field" ? `<div class="history-cards">${[sample, "Writing practice", "Class notes"].map((name, i) => panel(`<i class="record-icon">▤</i><h2>${name}</h2><p>${i ? "Typical signal" : "Elevated signal"}</p><small>${i ? "Previously reviewed" : "Reviewed today"}</small>`)).join("")}</div>` : rows}<p class="notice">3 sample records</p>`
    );
  },
  report() {
    return (
      heading(
        "Screening report",
        "Review the details before downloading a PDF.",
      ) +
      `<div class="two-col"><section class="paper"><div class="brand">${brand}</div><hr><h2>Handwriting screening report</h2><p>Prepared for professional review</p><dl><dt>Student identifier</dt><dd>Sample reviewer record</dd><dt>Examiner</dt><dd>Educational specialist</dd><dt>Includes</dt><dd>Screening signal, fold information and model explanations</dd></dl></section>
        ${panel(`<h2>Report details</h2>${field("Student identifier", "Anonymous student")}${field("Examiner or institution", "Educational specialist")}<p class="notice">The report service screens the original image again.</p>${button("Download PDF ↗")}`, "review-card")}</div>`
    );
  },
  settings() {
    return (
      heading(
        "Settings",
        "Manage your profile and how text reads on this device.",
      ) +
      `<div class="two-col settings-grid">${panel(`<h2>Profile</h2>${field("Name", "Sample reviewer")}${field("Institution", "School or organisation")}${field("Account email", "reviewer@example.com", "email")}${button("Save profile")}`)}
        ${panel(`<h2>Reading preferences</h2><div class="choice"><span>Text size</span>${badge("Standard")}${badge("Larger")}</div><div class="choice"><span>Text spacing</span>${badge("Standard")}${badge("Relaxed")}</div><div class="reading-sample"><h3>A little room to read.</h3><p>Review the handwriting image and take your time with the explanations.</p></div>`, "preferences")}</div>`
    );
  },
};

const html =
  page === "landing"
    ? landing()
    : page === "login" || page === "signup"
      ? account()
      : `<header class="workspace-head"><a class="brand" href="?design=${design.key}">${brand}</a><span>Workspace / ${label}</span><span class="avatar">NR</span></header>
   <div class="workspace"><nav class="workspace-nav" aria-label="Workspace">${nav}</nav><div class="workspace-content">${screens[page]()}</div></div>`;
document.querySelector("#screen").innerHTML = html;
