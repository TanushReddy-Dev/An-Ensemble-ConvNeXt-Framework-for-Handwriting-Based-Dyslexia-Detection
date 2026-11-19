import "@fontsource-variable/instrument-sans";
import "@fontsource/dm-mono/400.css";
import "./styles/index.css";
import {
  el,
  inView,
  newView,
  redraw,
  setRenderer,
  updateChildren,
} from "./ui/view.js";
import {
  bindNavigation,
  navigate,
  useLocation,
  useParams,
} from "./ui/navigation.js";
import { presentDialogs } from "./ui/controls.js";
import {
  bindMotion,
  captureMotionState,
  enterSurface,
  revealMotionState,
  revealPage,
} from "./ui/motion.js";
import { List, X } from "./ui/icons.js";
import { Brand } from "./components/ui/Common.js";
import AppLayout from "./components/layout/AppLayout.js";
import AuthPage from "./features/auth/AuthPage.js";
import { restoreSession, useAuth } from "./features/auth/AuthProvider.js";
import History, { Dashboard } from "./features/history/History.js";
import Settings from "./features/profile/Settings.js";
import Processing from "./features/screening/Processing.js";
import Report from "./features/screening/Report.js";
import CurrentResult, { SavedDetail } from "./features/screening/Results.js";
import Upload from "./features/screening/Upload.js";

const root = document.getElementById("root");
const landing = root.querySelector(".public-page");
let mountedLanding = false;
let routeKey;
let renderedRoute;
let scope = newView();
const publicTitle = document.title;
const accountPaths = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]);
const pages = new Map([
  ["/dashboard", Dashboard],
  ["/upload", Upload],
  ["/processing", Processing],
  ["/result", CurrentResult],
  ["/history", History],
  ["/report", Report],
  ["/settings", Settings],
]);
const redirects = new Map([
  ["/index.html", "/"],
  ["/app", "/dashboard"],
  ["/app/screenings/new", "/upload"],
  ["/app/screenings/current", "/result"],
  ["/app/history", "/history"],
  ["/app/settings", "/settings"],
]);

const toggle = landing.querySelector(".public-menu-toggle");
const compactNavigation = matchMedia("(max-width: 1023px)");
const mobileMenu = document.createElement("nav");
mobileMenu.className = "public-mobile-menu";
mobileMenu.setAttribute("aria-label", "Mobile navigation");
for (const link of landing.querySelectorAll(".nav__links a, .public-signin")) {
  const copy = link.cloneNode(true);
  copy.removeAttribute("class");
  mobileMenu.append(copy);
}
function toggleMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  toggle.replaceChildren((open ? X : List)({ size: 24 }));
  landing.querySelector("main").inert = open;
  landing.querySelector("footer").inert = open;
  if (open) {
    landing.querySelector("header").append(mobileMenu);
    enterSurface(mobileMenu, {
      from: ["translateY(-0.375rem)", "translateY(0)"],
    });
  } else mobileMenu.remove();
}
toggle.addEventListener("click", () =>
  toggleMenu(toggle.getAttribute("aria-expanded") !== "true"),
);
landing.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileMenu.isConnected) {
    toggleMenu(false);
    toggle.focus();
  }
});
mobileMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) toggleMenu(false);
});
compactNavigation.addEventListener("change", ({ matches }) => {
  if (!matches) toggleMenu(false);
  redraw();
});

function render() {
  const { pathname, search, hash } = useLocation();
  const alias = redirects.get(pathname);
  if (alias) return navigate(alias, { replace: true });
  if (/^\/app\/screenings\/[^/]+$/.test(pathname)) {
    return navigate(`/result/${encodeURIComponent(useParams().id)}`, {
      replace: true,
    });
  }
  const key = `${pathname}${search}:${useAuth().session?.user.id || ""}`;
  const changed = routeKey !== key;
  if (changed) {
    routeKey = key;
    scope = newView();
  }
  if (pathname === "/") {
    document.title = publicTitle;
    document.documentElement.removeAttribute("data-workspace-route");
    if (mountedLanding) return;
    if (!landing.isConnected) root.replaceChildren(landing);
    if (renderedRoute) revealPage(landing.querySelector("main"));
    renderedRoute = pathname;
    mountedLanding = true;
    landing.setAttribute("data-taste-ready", "");
    document.dispatchEvent(
      new CustomEvent("nw:public-mounted", { detail: landing }),
    );
    if (!hash) window.scrollTo(0, 0);
    else document.getElementById(hash.slice(1))?.scrollIntoView();
    return;
  }
  const pageTitle =
    {
      "/login": "Sign in",
      "/signup": "Create an account",
      "/forgot-password": "Reset your password",
      "/reset-password": "Choose a new password",
      "/auth/callback": "Account confirmation",
      "/dashboard": "Overview",
      "/upload": "New screening",
      "/processing": "Screening in progress",
      "/result": "Screening result",
      "/history": "Screening history",
      "/report": "Screening report",
      "/settings": "Settings",
    }[pathname] ??
    (pathname.startsWith("/result/") ? "Saved screening" : "Page not found");
  document.title = `${pageTitle} | NeuroWrite AI`;
  if (landing.isConnected) {
    toggleMenu(false);
    landing.removeAttribute("data-taste-ready");
    if (mountedLanding)
      document.dispatchEvent(
        new CustomEvent("nw:public-unmounted", { detail: landing }),
      );
    mountedLanding = false;
    landing.remove();
  }
  document.documentElement.removeAttribute("data-workspace-route");
  const page =
    pages.get(pathname) ||
    (/^\/result\/[^/]+$/.test(pathname) ? SavedDetail : null);
  try {
    const content = inView(scope, () => {
      if (accountPaths.has(pathname)) return AuthPage();
      if (page) return AppLayout(page, compactNavigation.matches);
      return el(
        "div",
        { className: "setup-page" },
        el(Brand),
        el("p", { className: "mono" }, "404"),
        el("h1", {}, "This page isn't in the workspace."),
        el("p", {}, "Return to the overview and choose your next step."),
        el(
          "a",
          { className: "btn btn--primary", href: "/" },
          "Back to overview",
        ),
      );
    });
    if (pathname !== useLocation().pathname) return;
    const beforeMotion = captureMotionState(root);
    updateChildren(root, content);
    presentDialogs(root);
    const route = pathname + search;
    const pageContent = root.querySelector("#content, .setup-page");
    const pageChanged = Boolean(renderedRoute && renderedRoute !== route);
    revealMotionState(root, beforeMotion, pageChanged);
    // Session restoration can render a loader before the redirect or final page.
    // Keep the previous route until there is an actual destination to reveal.
    if (pageContent) {
      if (pageChanged) {
        const accountEntry =
          renderedRoute === "/" && accountPaths.has(pathname);
        revealPage(pageContent.closest(".auth-layout") || pageContent, {
          accountEntry,
        });
        if (!changed) pageContent.focus({ preventScroll: true });
      }
      renderedRoute = route;
    }
    if (changed) {
      if (!hash) window.scrollTo(0, 0);
      root.querySelector("#content")?.focus({ preventScroll: true });
    }
  } catch {
    updateChildren(
      root,
      el(
        "div",
        { className: "setup-page" },
        el(Brand),
        el("h1", {}, "The workspace could not open."),
        el(
          "p",
          {},
          "Reload to try again. Unsaved screening work will be lost.",
        ),
        el(
          "button",
          { className: "btn btn--primary", onClick: () => location.reload() },
          "Reload workspace",
        ),
      ),
    );
  }
}

bindMotion();
bindNavigation();
window.addEventListener("resize", redraw, { passive: true });
setRenderer(render);
restoreSession();
render();
