// DOM construction and updates for the page controllers. Values become text
// nodes, so filenames and service responses cannot inject markup.
const bindings = new WeakMap();
const identities = new WeakMap();
let current;
let renderPage;
let queued = false;

export const fragment = ({ children }) => children;

export function el(tag, props = {}, ...children) {
  props ||= {};
  if (typeof tag === "function") {
    return tag({
      ...props,
      children: children.length > 1 ? children : children[0],
    });
  }
  const node = document.createElement(tag);
  const options = {};
  bindings.set(node, options);
  for (const [name, value] of Object.entries(props)) {
    if (name === "key") identities.set(node, value);
    else if (
      name === "ref" ||
      /^on[A-Z]/.test(name) ||
      ["value", "checked"].includes(name)
    ) {
      options[name] = value;
    } else if (
      (value !== false && value != null) ||
      (name.startsWith("aria-") && value === false)
    ) {
      const attribute =
        { className: "class", htmlFor: "for", tabIndex: "tabindex" }[name] ||
        name;
      node.setAttribute(
        attribute,
        value === true && !name.startsWith("aria-") ? "" : String(value),
      );
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child != null && typeof child !== "boolean")
      node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

function sameNode(a, b) {
  return (
    a.nodeType === b.nodeType &&
    a.nodeName === b.nodeName &&
    identities.get(a) === identities.get(b)
  );
}

function bind(node, next, previous = {}) {
  for (const name of new Set([
    ...Object.keys(previous),
    ...Object.keys(next),
  ])) {
    const handler = next[name];
    if (name === "ref") {
      if (handler) handler.current = node;
    } else if (name === "checked" || name === "value") {
      if (handler != null && node[name] !== handler) node[name] = handler;
    } else {
      const event =
        name === "onChange" &&
        node.tagName === "INPUT" &&
        !["file", "checkbox", "radio"].includes(node.type)
          ? "input"
          : name.slice(2).toLowerCase();
      node[`on${event}`] = handler || null;
    }
  }
  bindings.set(node, next);
}

function connect(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  for (const child of node.children) connect(child);
  bind(node, bindings.get(node) || {});
}

function reconcile(old, next) {
  if (!sameNode(old, next)) {
    old.replaceWith(next);
    connect(next);
    return next;
  }
  if (old.nodeType === Node.TEXT_NODE) {
    if (old.data !== next.data) old.data = next.data;
    return old;
  }
  for (const name of old.getAttributeNames()) {
    // Native controls own their open state.
    if (
      !next.hasAttribute(name) &&
      !(["DETAILS", "DIALOG"].includes(old.tagName) && name === "open")
    )
      old.removeAttribute(name);
  }
  for (const attribute of next.attributes) {
    if (old.getAttribute(attribute.name) !== attribute.value)
      old.setAttribute(attribute.name, attribute.value);
  }
  updateChildren(old, [...next.childNodes]);
  bind(old, bindings.get(next) || {}, bindings.get(old));
  return old;
}

export function updateChildren(parent, children) {
  const desired = [children]
    .flat(Infinity)
    .filter((node) => node instanceof Node);
  let cursor = parent.firstChild;
  for (const next of desired) {
    if (!cursor) {
      parent.append(next);
      connect(next);
    } else {
      const key = identities.get(next);
      if (!sameNode(cursor, next) && key != null) {
        const match = [...parent.childNodes].find((node) =>
          sameNode(node, next),
        );
        if (match) parent.insertBefore(match, cursor);
        else {
          parent.insertBefore(next, cursor);
          connect(next);
          continue;
        }
        cursor = match;
      }
      cursor = reconcile(cursor, next).nextSibling;
    }
  }
  while (cursor) {
    const next = cursor.nextSibling;
    cursor.remove();
    cursor = next;
  }
}

export function setRenderer(fn) {
  renderPage = fn;
}
export function redraw() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    renderPage?.();
  });
}
export function newView() {
  return { values: new Map() };
}
export function inView(scope, render) {
  const previous = current;
  current = scope;
  try {
    return render();
  } finally {
    current = previous;
  }
}
export function viewState(key, initial) {
  const { values } = current;
  if (!values.has(key))
    values.set(key, typeof initial === "function" ? initial() : initial);
  return [
    values.get(key),
    (value) => {
      if (!Object.is(value, values.get(key))) {
        values.set(key, value);
        redraw();
      }
    },
  ];
}
export function viewValue(key, create) {
  if (!current.values.has(key)) current.values.set(key, create());
  return current.values.get(key);
}
