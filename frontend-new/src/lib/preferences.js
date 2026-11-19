export function readingPreference(kind) {
  try {
    const value = localStorage.getItem(`nw-text-${kind}`);
    const allowed =
      kind === "size"
        ? ["standard", "large", "larger"]
        : ["standard", "relaxed"];
    return value && allowed.includes(value) ? value : "standard";
  } catch {
    return "standard";
  }
}
