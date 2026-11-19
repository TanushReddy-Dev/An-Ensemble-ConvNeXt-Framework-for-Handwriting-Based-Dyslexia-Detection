import { el } from "../../ui/view.js";
import { Link } from "../../ui/navigation.js";
import { WarningCircle, ArrowUpRight, CircleNotch } from "../../ui/icons.js";
export function Brand({ compact = false }) {
  return el(
    Link,
    { to: "/", className: "brand", "aria-label": "NeuroWrite AI home" },
    el("span", { className: "brand-mark", "aria-hidden": "true" }),
    !compact &&
      el(
        "span",
        null,
        "NeuroWrite",
        el("span", { className: "brand-ai" }, " AI"),
      ),
  );
}
export function ActionLink({ to, children, secondary = false }) {
  return el(
    Link,
    {
      className: `btn ${secondary ? "btn--secondary" : "btn--primary"}`,
      to: to,
    },
    children,
    !secondary && el(ArrowUpRight, { size: 18, "aria-hidden": "true" }),
  );
}
export function ErrorNotice({ children }) {
  return el(
    "div",
    { className: "notice error", role: "alert" },
    el(WarningCircle, { size: 20, "aria-hidden": "true" }),
    el("div", null, children),
  );
}
export function Loading({ text = "Loading your workspace…" }) {
  return el(
    "div",
    { className: "loading-state", role: "status" },
    el("div", { className: "skeleton" }),
    el("div", { className: "skeleton short" }),
    el("p", null, text),
  );
}
export function Busy({ children }) {
  return el(
    "span",
    { className: "inline-busy" },
    el(CircleNotch, { className: "spin", size: 18, "aria-hidden": "true" }),
    children,
  );
}
export function PageTitle({ eyebrow, title, children, action }) {
  return el(
    "div",
    { className: "page-heading" },
    el(
      "div",
      null,
      eyebrow && el("p", { className: "eyebrow" }, eyebrow),
      el("h1", null, title),
      children && el("p", { className: "muted measure" }, children),
    ),
    action,
  );
}
