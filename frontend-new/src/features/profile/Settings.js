import { el, fragment, viewState } from "../../ui/view.js";
import { viewValue } from "../../ui/view.js";
import { useForm } from "../../ui/forms.js";
import { useMutation, useQuery, useQueryClient } from "../../ui/queries.js";
import { useAuth } from "../auth/AuthProvider.js";
import { database } from "../../lib/supabase.js";
import { message } from "../../lib/contracts.js";
import { readingPreference } from "../../lib/preferences.js";
import {
  Busy,
  ErrorNotice,
  Loading,
  PageTitle,
} from "../../components/ui/Common.js";
export default function Settings() {
  const { session } = useAuth();
  const id = session.user.id;
  const cache = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [size, setSize] = viewState("Settings:size", () =>
    readingPreference("size"),
  );
  const [space, setSpace] = viewState("Settings:space", () =>
    readingPreference("space"),
  );
  const [preferenceStatus, setPreferenceStatus] = viewState(
    "Settings:preferenceStatus",
    "",
  );
  const profile = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await database()
        .from("profiles")
        .select("name,institution")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const loaded = viewValue("loaded-profile", () => ({}));
  if (profile.data !== undefined && loaded.data !== profile.data) {
    loaded.data = profile.data;
    reset({
      name: profile.data?.name || session.user.user_metadata?.name || "",
      institution: profile.data?.institution || "",
    });
  }
  const save = useMutation("save-profile", {
    mutationFn: async (values) => {
      const { error } = await database()
        .from("profiles")
        .upsert({
          id,
          name: values.name.trim(),
          institution: values.institution.trim() || null,
          updated_at: new Date().toISOString(),
        });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ["profile", id] }),
  });
  function preference(kind, value) {
    (kind === "size" ? setSize : setSpace)(value);
    document
      .querySelector(".app-shell")
      ?.setAttribute(`data-reading-${kind}`, value);
    try {
      localStorage.setItem(`nw-text-${kind}`, value);
      setPreferenceStatus("Reading preference saved on this device.");
    } catch {
      setPreferenceStatus(
        "Preference applied for now. Browser storage is unavailable.",
      );
    }
  }
  return el(
    fragment,
    null,
    el(
      PageTitle,
      { eyebrow: "Make the workspace yours", title: "Settings" },
      "Manage your profile and choose how text reads on this device.",
    ),
    el(
      "div",
      { className: "settings-layout" },
      el(
        "section",
        { className: "settings-section" },
        el("h2", null, "Profile"),
        el(
          "p",
          { className: "muted" },
          "These details belong to your signed-in account.",
        ),
        profile.isPending
          ? el(Loading, null)
          : profile.error
            ? el(
                ErrorNotice,
                null,
                message(profile.error),
                " ",
                el(
                  "button",
                  { className: "text-link", onClick: () => profile.refetch() },
                  "Retry loading",
                ),
              )
            : el(
                "form",
                {
                  className: "form-stack",
                  onSubmit: handleSubmit((values) => save.mutate(values)),
                },
                el(
                  "label",
                  { htmlFor: "profile-name" },
                  "Name",
                  el("input", {
                    id: "profile-name",
                    autoComplete: "name",
                    maxLength: 120,
                    ...register("name"),
                  }),
                ),
                el(
                  "label",
                  { htmlFor: "institution" },
                  "Institution ",
                  el("span", { className: "muted" }, "(optional)"),
                  el("input", {
                    id: "institution",
                    maxLength: 180,
                    ...register("institution"),
                  }),
                ),
                el(
                  "label",
                  { htmlFor: "profile-email" },
                  "Account email",
                  el("input", {
                    id: "profile-email",
                    value: session.user.email || "",
                    readOnly: true,
                  }),
                  el(
                    "small",
                    null,
                    "Email changes are managed through your account provider.",
                  ),
                ),
                save.isError && el(ErrorNotice, null, message(save.error)),
                save.isSuccess &&
                  el(
                    "p",
                    { role: "status", className: "notice success" },
                    "Your profile was saved.",
                  ),
                el(
                  "button",
                  { className: "btn btn--primary", disabled: save.isPending },
                  save.isPending
                    ? el(Busy, null, "Saving profile\u2026")
                    : "Save profile",
                ),
              ),
      ),
      el(
        "section",
        { className: "settings-section" },
        el("h2", null, "Reading preferences"),
        el(
          "p",
          { className: "muted" },
          "Choose what feels comfortable. These preferences stay on this device.",
        ),
        el(
          "label",
          { htmlFor: "text-size" },
          "Text size",
          el(
            "select",
            {
              id: "text-size",
              value: size,
              onChange: (e) => preference("size", e.target.value),
            },
            el("option", { value: "standard" }, "Standard"),
            el("option", { value: "large" }, "Large"),
            el("option", { value: "larger" }, "Larger"),
          ),
        ),
        el(
          "label",
          { htmlFor: "text-space" },
          "Text spacing",
          el(
            "select",
            {
              id: "text-space",
              value: space,
              onChange: (e) => preference("space", e.target.value),
            },
            el("option", { value: "standard" }, "Standard"),
            el("option", { value: "relaxed" }, "Relaxed"),
          ),
        ),
        el(
          "div",
          { className: "reading-preview" },
          el("h3", null, "A little room to read."),
          el(
            "p",
            null,
            "Review the handwriting image, take your time with the explanations, and choose your next step.",
          ),
        ),
        preferenceStatus &&
          el("p", { className: "small", role: "status" }, preferenceStatus),
        el(
          "p",
          { className: "small muted" },
          "Reading preferences are personal. No font or spacing setting is presented as a treatment.",
        ),
      ),
    ),
  );
}
