import { el, viewState } from "../../ui/view.js";
import { NavLink, Navigate, useLocation } from "../../ui/navigation.js";
import {
  SquaresFour,
  UploadSimple,
  ClockCounterClockwise,
  SlidersHorizontal,
  FileText,
  SignOut,
  List,
  X,
  Info,
} from "../../ui/icons.js";
import { Brand, ErrorNotice, Loading } from "../ui/Common.js";
import { useAuth } from "../../features/auth/AuthProvider.js";
import { message } from "../../lib/contracts.js";
import { readingPreference } from "../../lib/preferences.js";
const links = [
  { path: "/dashboard", label: "Overview", icon: SquaresFour, end: true },
  { path: "/upload", label: "New screening", icon: UploadSimple },
  {
    path: "/history",
    label: "Screening history",
    icon: ClockCounterClockwise,
  },
  { path: "/report", label: "Screening report", icon: FileText },
  { path: "/settings", label: "Settings", icon: SlidersHorizontal },
];
export default function AppLayout(page) {
  const { session, initializing, error, signOut } = useAuth();
  const location = useLocation();
  const [menu, setMenu] = viewState("AppLayout:menu", false);
  const [signError, setSignError] = viewState("AppLayout:signError", "");
  const [signingOut, setSigningOut] = viewState("AppLayout:signingOut", false);
  if (initializing)
    return el(Loading, { text: "Restoring your session\u2026" });
  if (!session)
    return el(Navigate, {
      to: "/login",
      state: { from: location.pathname + location.search },
      replace: true,
    });
  async function logout() {
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      setSignError(message(e));
    } finally {
      setSigningOut(false);
    }
  }
  const name =
    session.user.user_metadata?.name ||
    session.user.email?.split("@")[0] ||
    "Your account";
  return el(
    "div",
    {
      className: "app-shell",
      "data-reading-size": readingPreference("size"),
      "data-reading-space": readingPreference("space"),
      onKeyDown: (e) => {
        if (e.key === "Escape") setMenu(false);
      },
    },
    el("a", { className: "skip-link", href: "#content" }, "Skip to content"),
    el(
      "header",
      { className: "mobile-app-header" },
      el(Brand, null),
      el(
        "button",
        {
          className: "icon-button",
          onClick: () => setMenu(!menu),
          "aria-label": menu ? "Close navigation" : "Open navigation",
          "aria-expanded": menu,
        },
        menu ? el(X, { size: 22 }) : el(List, { size: 22 }),
      ),
    ),
    el(
      "aside",
      {
        className: `sidebar ${menu ? "is-open" : ""}`,
        "aria-label": "Workspace navigation",
      },
      el(Brand, null),
      el(
        "div",
        { className: "workspace-label" },
        el("span", {
          className: "brand-mark workspace-avatar",
          "aria-hidden": "true",
        }),
        el(
          "div",
          null,
          "Personal workspace",
          el("small", null, "Handwriting screening"),
        ),
      ),
      el(
        "nav",
        null,
        el("span", { className: "sidebar-indicator", "aria-hidden": "true" }),
        links.map(({ path, label, icon: Icon, end }) =>
          el(
            NavLink,
            { key: path, to: path, end: end, onClick: () => setMenu(false) },
            el(Icon, { size: 20, "aria-hidden": "true" }),
            label,
          ),
        ),
      ),
      el(
        "div",
        { className: "sidebar-bottom" },
        el(
          "div",
          { className: "sidebar-note" },
          el(Info, { size: 20, "aria-hidden": "true" }),
          el(
            "p",
            null,
            "Screening supports a conversation. A formal assessment needs a qualified professional.",
          ),
        ),
        el(
          "div",
          { className: "account-row" },
          el(
            "span",
            { className: "account-avatar" },
            String(name).slice(0, 1).toUpperCase(),
          ),
          el(
            "div",
            null,
            el("span", null, name),
            el("small", null, session.user.email),
          ),
        ),
        el(
          "button",
          {
            className: "text-link signout",
            onClick: logout,
            disabled: signingOut,
          },
          el(SignOut, { size: 18 }),
          signingOut ? "Signing out…" : "Sign out",
        ),
        signError && el(ErrorNotice, null, signError),
      ),
    ),
    el(
      "div",
      { className: "app-main", inert: menu },
      el(
        "div",
        { className: "app-topbar" },
        el(
          "span",
          null,
          "Workspace /",
          " ",
          location.pathname.startsWith("/result/")
            ? "Saved result"
            : {
                "/dashboard": "Dashboard",
                "/upload": "Upload",
                "/processing": "Processing",
                "/result": "Result",
                "/history": "History",
                "/report": "Report",
                "/settings": "Settings",
              }[location.pathname] || "Overview",
        ),
        el("span", { className: "tag neutral" }, "Experimental screening"),
      ),
      el(
        "main",
        { id: "content", tabIndex: -1 },
        error && el(ErrorNotice, null, error),
        page(),
      ),
      el(
        "footer",
        { className: "app-footer" },
        el("span", null, "NeuroWrite AI"),
        el("span", null, "Screening signals for professional review."),
      ),
    ),
  );
}
