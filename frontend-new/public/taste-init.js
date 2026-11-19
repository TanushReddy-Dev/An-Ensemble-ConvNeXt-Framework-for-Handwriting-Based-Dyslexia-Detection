// Mount and unmount the unchanged Taste kit as the public route opens and closes.
let pending;
function kits() {
  return (pending ||= Promise.all([
    import("./assets/motion/motion.js"),
    import("./assets/moments/moments.js"),
  ]));
}
async function mount(root) {
  if (!root) return;
  try {
    const [motion, moments] = await kits();
    if (!root.isConnected || !root.hasAttribute("data-taste-ready")) return;
    motion.init();
    await moments.mountAll(root);
  } catch {
    document.documentElement.classList.add("m-enter-done", "mo-safe");
  }
}
document.addEventListener("nw:public-mounted", (event) => mount(event.detail));
document.addEventListener("nw:public-unmounted", (event) => {
  if (pending)
    void pending.then(([, moments]) => moments.unmountAll(event.detail));
});
mount(document.querySelector(".public-page[data-taste-ready]"));
