import { el, viewState } from "../../ui/view.js";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "../../ui/navigation.js";
import { useForm } from "../../ui/forms.js";
import { zodResolver } from "../../ui/forms.js";
import { z } from "zod";
import {
  ArrowLeft,
  LockKey,
  EnvelopeSimple,
  ArrowUpRight,
} from "../../ui/icons.js";
import {
  Brand,
  Busy,
  ErrorNotice,
  Loading,
} from "../../components/ui/Common.js";
import { supabase } from "../../lib/supabase.js";
import { message } from "../../lib/contracts.js";
import { useAuth } from "./AuthProvider.js";
const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string(),
  name: z.string(),
  institution: z.string(),
});
export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, initializing } = useAuth();
  const signup = location.pathname === "/signup";
  const forgot = location.pathname === "/forgot-password";
  const reset = location.pathname === "/reset-password";
  const callback = location.pathname === "/auth/callback";
  const [error, setError] = viewState("AuthPage:error", "");
  const [status, setStatus] = viewState("AuthPage:status", "");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: fieldError,
  } = useForm({
    resolver: zodResolver(
      schema.extend({ email: reset ? z.string() : schema.shape.email }),
    ),
    defaultValues: { email: "", password: "", name: "", institution: "" },
  });
  const redirect =
    typeof location.state?.from === "string" &&
    /^\/(dashboard|upload|processing|result|history|report|settings)(\/|\?|$)/.test(
      location.state.from,
    )
      ? location.state.from
      : "/dashboard";
  if (initializing)
    return el(Loading, { text: "Restoring your session\u2026" });
  if (callback)
    return session
      ? el(Navigate, { to: "/dashboard", replace: true })
      : el(
          AuthFrame,
          null,
          el("h1", null, "Check your sign-in link"),
          el(
            ErrorNotice,
            null,
            "The link could not complete sign-in. It may have expired.",
          ),
          el(
            Link,
            { className: "btn btn--primary", to: "/login" },
            "Sign in again",
          ),
        );
  if (session && !reset && !forgot)
    return el(Navigate, { to: redirect, replace: true });
  async function submit(values) {
    if (!supabase) return;
    setError("");
    setStatus("");
    if ((signup || reset) && values.password.length < 8) {
      fieldError("password", { message: "Use at least 8 characters." });
      return;
    }
    if (!forgot && !reset && !signup && !values.password) {
      fieldError("password", { message: "Enter your password." });
      return;
    }
    if (signup && !values.name.trim()) {
      fieldError("name", { message: "Enter your name." });
      return;
    }
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          values.email,
          { redirectTo: `${window.location.origin}/reset-password` },
        );
        if (error) throw error;
        setStatus(
          "If this email has an account, a password reset link will arrive shortly.",
        );
      } else if (reset) {
        const { error } = await supabase.auth.updateUser({
          password: values.password,
        });
        if (error) throw error;
        setStatus("Your password was updated.");
      } else if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name: values.name.trim(),
              institution: values.institution.trim() || null,
            },
          },
        });
        if (error) throw error;
        if (data.session) navigate("/dashboard", { replace: true });
        else
          setStatus(
            "Check your email to confirm your account before signing in.",
          );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        navigate(redirect, { replace: true });
      }
    } catch (e) {
      setError(message(e));
    }
  }
  const title = signup
    ? "Create your workspace."
    : forgot
      ? "Reset your password."
      : reset
        ? "Choose a new password."
        : "Welcome back.";
  return el(
    AuthFrame,
    null,
    el("p", { className: "eyebrow" }, "Your screening workspace"),
    el("h1", null, title),
    el(
      "p",
      { className: "muted" },
      signup
        ? "An account keeps your saved screenings together."
        : forgot
          ? "We will email you a recovery link."
          : reset
            ? "Use a password with at least 8 characters."
            : "Sign in to review handwriting and revisit your saved results.",
    ),
    !supabase &&
      el(
        ErrorNotice,
        null,
        "Account services are not configured. Ask the project maintainer to set the Supabase connection in ",
        el("code", null, "frontend-new/.env"),
        ".",
      ),
    reset &&
      !session &&
      el(
        ErrorNotice,
        null,
        "Open a valid password recovery link from your email first.",
        " ",
        el(Link, { to: "/forgot-password" }, "Request a new link"),
        ".",
      ),
    el(
      "form",
      {
        onSubmit: handleSubmit(submit),
        noValidate: true,
        className: "form-stack",
      },
      signup &&
        el(
          "label",
          { htmlFor: "name" },
          "Name",
          el("input", {
            id: "name",
            autoComplete: "name",
            ...register("name"),
            "aria-invalid": Boolean(errors.name),
            "aria-describedby": errors.name ? "name-error" : undefined,
          }),
          errors.name &&
            el(
              "span",
              { id: "name-error", className: "field-error" },
              errors.name.message,
            ),
        ),
      signup &&
        el(
          "label",
          { htmlFor: "signup-institution" },
          "Institution ",
          el("span", { className: "muted" }, "(optional)"),
          el("input", {
            id: "signup-institution",
            autoComplete: "organization",
            maxLength: 180,
            ...register("institution"),
          }),
        ),
      el(
        "label",
        { htmlFor: "email" },
        "Email address",
        el(
          "span",
          { className: "input-icon" },
          el(EnvelopeSimple, { size: 18, "aria-hidden": "true" }),
          el("input", {
            id: "email",
            type: "email",
            autoComplete: "email",
            ...register("email"),
            "aria-invalid": Boolean(errors.email),
            "aria-describedby": errors.email ? "email-error" : undefined,
          }),
        ),
        errors.email &&
          el(
            "span",
            { id: "email-error", className: "field-error" },
            errors.email.message,
          ),
      ),
      !forgot &&
        el(
          "label",
          { htmlFor: "password" },
          reset ? "New password" : "Password",
          el(
            "span",
            { className: "input-icon" },
            el(LockKey, { size: 18, "aria-hidden": "true" }),
            el("input", {
              id: "password",
              type: "password",
              autoComplete:
                signup || reset ? "new-password" : "current-password",
              ...register("password"),
              "aria-invalid": Boolean(errors.password),
              "aria-describedby": errors.password
                ? "password-error"
                : undefined,
            }),
          ),
          errors.password &&
            el(
              "span",
              { id: "password-error", className: "field-error" },
              errors.password.message,
            ),
        ),
      error && el(ErrorNotice, null, error),
      status &&
        el("p", { role: "status", className: "notice success" }, status),
      el(
        "button",
        {
          className: "btn btn--primary",
          disabled: !supabase || isSubmitting || (reset && !session),
        },
        isSubmitting
          ? el(Busy, null, "Working\u2026")
          : signup
            ? "Create account"
            : forgot
              ? "Send recovery link"
              : reset
                ? "Update password"
                : "Sign in",
      ),
    ),
    reset
      ? el(
          Link,
          { className: "text-link", to: "/dashboard" },
          "Return to workspace",
        )
      : el(
          "div",
          { className: "auth-links" },
          !signup &&
            !forgot &&
            el(Link, { to: "/forgot-password" }, "Forgot password?"),
          el(
            Link,
            { to: signup || forgot ? "/login" : "/signup" },
            signup || forgot ? "Back to sign in" : "Create an account",
          ),
        ),
  );
}
function AuthFrame({ children }) {
  const { pathname } = useLocation();
  const signup = pathname === "/signup";
  const artwork = signup ? "signup" : "login";
  const hasArtwork = signup || pathname === "/login";
  return el(
    "div",
    {
      className: `auth-page auth-redesign ${signup ? "auth-signup" : "auth-login"}`,
    },
    el("a", { className: "skip-link", href: "#content" }, "Skip to content"),
    el(
      "header",
      null,
      el(Brand, null),
      el(
        "div",
        { className: "auth-header-links" },
        el(
          Link,
          { className: "text-link", to: "/" },
          el(ArrowLeft, { size: 16, "aria-hidden": "true" }),
          " Back to overview",
        ),
        el(
          Link,
          {
            className: "btn btn--secondary",
            to: signup ? "/login" : "/signup",
          },
          signup ? "Sign in" : "Create account",
          el(ArrowUpRight, { size: 16, "aria-hidden": "true" }),
        ),
      ),
    ),
    el(
      "div",
      {
        className: `auth-layout${hasArtwork ? "" : " auth-layout--form-only"}`,
      },
      hasArtwork &&
        el(
          "aside",
          {
            className: "auth-story",
            "aria-label": signup
              ? "Your new workspace"
              : "About your screening workspace",
          },
          el(
            "div",
            { className: "auth-photo", "aria-hidden": "true" },
            el("img", {
              src: `/assets/images/${artwork}-1024.webp`,
              srcSet: `/assets/images/${artwork}-640.webp 640w, /assets/images/${artwork}-1024.webp 1024w`,
              sizes: "(max-width: 767px) 90vw, 46vw",
              width: 1024,
              height: 1280,
              alt: "",
            }),
          ),
          el(
            "div",
            { className: "auth-story-copy" },
            el(
              "h2",
              null,
              signup
                ? "Keep your screenings together."
                : "Pick up your handwriting review.",
            ),
            el(
              "p",
              { className: "auth-story-lead" },
              signup
                ? "Save results to your workspace and return to them when you need them."
                : "Open a saved screening to revisit the score and available image views.",
            ),
          ),
        ),
      el(
        "main",
        { id: "content", className: "auth-card", tabIndex: -1 },
        children,
      ),
    ),
    el(
      "footer",
      { className: "auth-foot" },
      el("span", null, "\u00A9 ", new Date().getFullYear(), " PRISM"),
      el("span", null, "Handwriting screening for professional review."),
    ),
  );
}
