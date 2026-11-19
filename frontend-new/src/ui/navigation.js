import { el, redraw } from "./view.js";

export function useLocation() {
  return {
    pathname: location.pathname.replace(/\/$/, "") || "/",
    search: location.search,
    hash: location.hash,
    state: history.state,
  };
}
export function navigate(to, { replace = false, state = null } = {}) {
  const target = new URL(to, location.href);
  if (target.origin !== location.origin) return;
  history[replace ? "replaceState" : "pushState"](state, "", target);
  redraw();
}
export const useNavigate = () => navigate;
export const useSearchParams = () => [new URLSearchParams(location.search)];
export function useParams() {
  try {
    return { id: decodeURIComponent(useLocation().pathname.split("/").at(-1)) };
  } catch {
    return { id: "" };
  }
}
export function Link({ to, children, ...props }) {
  return el("a", { ...props, href: to }, children);
}
export function NavLink({ to, end, children, ...props }) {
  const { pathname } = useLocation();
  const active = pathname === to || (!end && pathname.startsWith(to + "/"));
  return Link({
    ...props,
    to,
    className: active ? "active" : "",
    "aria-current": active ? "page" : undefined,
    children,
  });
}
export function Navigate({ to, replace, state }) {
  navigate(to, { replace, state });
  return null;
}

export function bindNavigation() {
  window.addEventListener("popstate", redraw);
  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = event.target.closest("a[href]");
    if (!link || link.target || link.hasAttribute("download")) return;
    const href = link.getAttribute("href");
    if (!href.startsWith("/") || href.startsWith("//")) return;
    event.preventDefault();
    navigate(href);
  });
}
