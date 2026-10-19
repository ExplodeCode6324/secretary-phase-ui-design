const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { plan, createController } = require("../signal-motion.js");
const source = fs.readFileSync(
  require("node:path").join(__dirname, "../prototype.js"),
  "utf8",
);
const geometry = vm.runInNewContext(
  source.slice(0, source.indexOf("const escapeHTML")) +
    ";JSON.parse(JSON.stringify(geometry))",
);
function host() {
  const listeners = {};
  return {
    addEventListener(t, f) {
      (listeners[t] ??= []).push(f);
    },
    removeEventListener() {},
    dispatch(t, e = {}) {
      for (const f of listeners[t] || []) f(e);
    },
  };
}
class Node {
  constructor(tag) {
    this.tag = tag;
    this.attrs = {};
    this.children = [];
    this.classes = new Set();
    this.dataset = {};
    this.isConnected = true;
    this.classList = {
      add: (...ns) => ns.forEach((n) => this.classes.add(n)),
      remove: (...ns) => ns.forEach((n) => this.classes.delete(n)),
      contains: (n) => this.classes.has(n),
    };
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
  }
  getAttribute(k) {
    return this.attrs[k] ?? null;
  }
  removeAttribute(k) {
    delete this.attrs[k];
  }
  append(...nodes) {
    for (const n of nodes) {
      n.parent = this;
      this.children.push(n);
    }
  }
  remove() {
    this.parent.children = this.parent.children.filter((c) => c !== this);
  }
  replaceChildren() {
    this.children = [];
  }
  contains(n) {
    return n === this || this.children.some((c) => c.contains(n));
  }
  matches() {
    return this.disabled || false;
  }
  closest(s) {
    if (s === ".static-sample") return null;
    if (s === "nav") return this.nav ? {} : null;
    if (s === ".composer-box") return this.composer ? this : null;
    return this;
  }
  getBoundingClientRect() {
    return { width: this.width || 24, height: this.height || 24 };
  }
  querySelector(s) {
    return (
      walk(this).find((n) =>
        s === ".glyph"
          ? n.tag === "glyph"
          : s === ".icon-body"
            ? n.tag === "body"
            : s === ".signal-layer"
              ? n.tag === "layer"
              : false,
      ) || null
    );
  }
  animate(frames, options) {
    return {
      frames,
      options,
      finished: Promise.resolve(),
      cancelled: false,
      paused: false,
      cancel() {
        this.cancelled = true;
      },
      pause() {
        this.paused = true;
      },
    };
  }
}
function walk(n) {
  return [n, ...n.children.flatMap(walk)];
}
function harness() {
  const timers = new Map(),
    history = new Map();
  let seq = 0,
    observer;
  const media = Object.assign(host(), { matches: false });
  const body = {
    blocked: false,
    matches() {
      return this.blocked;
    },
  };
  const document = Object.assign(host(), {
    body,
    hidden: false,
    createElementNS(_ns, tag) {
      return new Node(tag);
    },
  });
  const window = Object.assign(host(), {
    matchMedia: () => media,
    setTimeout(fn) {
      timers.set(++seq, fn);
      history.set(seq, fn);
      return seq;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    MutationObserver: class {
      constructor(fn) {
        observer = fn;
      }
      observe() {}
      disconnect() {}
    },
  });
  const control = new Node("button"),
    glyph = new Node("glyph"),
    original = new Node("body"),
    layer = new Node("layer");
  glyph.dataset.glyph = "attention";
  glyph.append(original, layer);
  control.append(glyph);
  const fire = (type, extra = {}) =>
    document.dispatch(type, { target: control, relatedTarget: null, ...extra });
  const controller = createController({ document, window, geometry });
  return {
    control,
    original,
    layer,
    document,
    window,
    media,
    timers,
    history,
    fire,
    controller,
    observe: () => observer(),
  };
}
test("fixed plans deterministic; auto resolves randomness once, within actual CSS px/time limits", () => {
  for (const [name, g] of Object.entries(geometry))
    for (const size of [16, 22, 24, 32])
      for (const kind of [0, 1, 2]) {
        const a = plan({ ...g, name }, size, kind, () => {
          throw Error("fixed plans must not randomize");
        });
        assert.ok(a.duration >= 160 && a.duration <= 360);
        assert.ok((Math.abs(a.dx) * size) / 24 <= 3);
        assert.ok(g.body.includes(a.dropout.d));
        assert.ok(a.dropout.start + a.dropout.length <= 100);
      }
  let calls = 0;
  const p = plan(geometry.search, 24, -1, () => {
    calls++;
    return 0.8;
  });
  assert.equal(p.kind, 2);
  assert.equal(calls, 4);
});
test("A replaces full bottom image with masked base plus clipped translated real geometry", () => {
  const h = harness();
  h.controller.setScheme(0);
  h.fire("pointerover");
  assert.equal(h.original.getAttribute("visibility"), "hidden");
  const nodes = walk(h.layer);
  assert.equal(nodes.filter((n) => n.attrs.class === "source-gap").length, 1);
  assert.equal(nodes.filter((n) => n.tag === "clipPath").length, 1);
  assert.ok(nodes.find((n) => n.attrs.class === "rendered-base").attrs.mask);
  assert.equal(
    nodes.filter((n) => n.attrs.class === "signal-residue").length,
    0,
  );
  for (const n of nodes.filter((n) => n.tag === "path"))
    assert.ok(geometry.attention.body.includes(n.attrs.d));
  h.controller.clearAll();
  assert.equal(h.original.getAttribute("visibility"), null);
  assert.equal(h.layer.children.length, 0);
});
test("B subtracts real stroke segments via black mask, without displaced copies", () => {
  const h = harness();
  h.controller.setScheme(1);
  h.fire("click");
  const nodes = walk(h.layer);
  assert.equal(h.original.getAttribute("visibility"), "hidden");
  const hole = nodes.find((n) => n.attrs.class === "dropout-hole");
  assert.equal(hole.attrs.stroke, "black");
  assert.ok(hole.attrs["stroke-dasharray"]);
  assert.equal(
    nodes.filter((n) => n.attrs.class === "displaced-slice").length,
    0,
  );
});
test("C combines subtraction and slicing, monochrome removes only auxiliary residue", () => {
  const h = harness();
  h.controller.setScheme(2);
  h.fire("click");
  assert.ok(walk(h.layer).some((n) => n.attrs.class === "signal-residue"));
  h.controller.setMonochrome(true);
  h.fire("click");
  const nodes = walk(h.layer);
  assert.ok(nodes.some((n) => n.attrs.class === "source-gap"));
  assert.ok(nodes.some((n) => n.attrs.class === "dropout-hole"));
  assert.ok(!nodes.some((n) => n.attrs.class === "signal-residue"));
});
test("same-contact hover/focus merges, replacement generation defeats old timer", () => {
  const h = harness();
  h.fire("pointerover");
  const old = [...h.history.values()][0],
    first = [...h.timers.keys()][0];
  h.fire("focusin");
  assert.equal([...h.timers.keys()][0], first);
  h.fire("click");
  old();
  assert.equal(h.original.getAttribute("visibility"), "hidden");
  assert.equal(h.timers.size, 1);
  [...h.timers.values()][0]();
  assert.equal(h.original.getAttribute("visibility"), null);
  assert.equal(h.layer.children.length, 0);
});
test("cancel, exit, blur, disable, removal and dynamic mode switch restore full source and remove timers", () => {
  for (const reason of [
    "pointerout",
    "focusout",
    "pointercancel",
    "blur",
    "disable",
    "detach",
    "off",
    "reduce",
  ]) {
    const h = harness();
    h.fire("pointerover");
    if (["pointerout", "focusout", "pointercancel"].includes(reason))
      h.fire(reason);
    if (reason === "blur") h.window.dispatch("blur");
    if (reason === "disable") {
      h.control.disabled = true;
      h.observe();
    }
    if (reason === "detach") {
      h.control.isConnected = false;
      h.observe();
    }
    if (reason === "off") {
      h.document.body.blocked = true;
      h.observe();
    }
    if (reason === "reduce") {
      h.media.matches = true;
      h.media.dispatch("change");
    }
    assert.equal(h.original.getAttribute("visibility"), null, reason);
    assert.equal(h.layer.children.length, 0, reason);
    assert.equal(h.timers.size, 0, reason);
  }
});
test("press-drag-out never synthesizes click; disabled and static modes never hide source", () => {
  const h = harness();
  let clicks = 0;
  h.document.addEventListener("click", () => clicks++);
  h.fire("pointerover");
  h.fire("pointerdown");
  h.fire("pointerout");
  h.fire("pointerup");
  assert.equal(clicks, 0);
  h.controller.setScheme(3);
  h.fire("click");
  assert.equal(clicks, 1);
  assert.equal(h.original.getAttribute("visibility"), null);
});
test("debug freeze applies only to samples, cancels without residue and does not queue playback", () => {
  const h = harness();
  h.control.classes.add("study-trigger");
  h.controller.setFreeze(true);
  h.fire("click");
  assert.equal(h.timers.size, 0);
  assert.equal(h.original.getAttribute("visibility"), "hidden");
  h.fire("pointerout");
  assert.equal(h.original.getAttribute("visibility"), null);
  h.controller.setFreeze(false);
  assert.equal(h.timers.size, 0);
});
test("submit replaces actual border without mutating input nodes; repeated submit cancels old overlay", () => {
  const h = harness();
  const box = new Node("div");
  box.composer = true;
  box.width = 600;
  box.height = 120;
  const input = new Node("textarea");
  box.append(input);
  h.controller.submit(box);
  assert.ok(box.classes.has("boundary-fault"));
  assert.equal(box.children[0], input);
  assert.equal(box.children.length, 2);
  h.controller.submit(box);
  assert.equal(box.children.length, 2);
  assert.equal(h.timers.size, 1);
  h.document.dispatch("focusout", { target: box, relatedTarget: null });
  assert.equal(box.children.length, 1);
  assert.ok(!box.classes.has("boundary-fault"));
});
test("navigation boundary fault replaces lines but preserves aria-current and full row", () => {
  const h = harness();
  h.control.nav = true;
  h.control.width = 196;
  h.control.height = 45;
  h.control.setAttribute("aria-current", "page");
  h.controller.navigation(h.control);
  assert.equal(h.control.getAttribute("aria-current"), "page");
  assert.ok(h.control.classes.has("boundary-fault"));
  h.controller.clearAll();
  assert.ok(!h.control.classes.has("boundary-fault"));
  assert.equal(h.control.getAttribute("aria-current"), "page");
});
test("no scale/rotation/body spring scripts; send uses incremental append and native IME guard", () => {
  const css = fs.readFileSync(
    require("node:path").join(__dirname, "../style.css"),
    "utf8",
  );
  for (const obsolete of [
    "send-shaft",
    "send-head",
    "nav-phase-a",
    "scale(.82)",
    "clapper",
    "lens-sample",
  ])
    assert.ok(!css.includes(obsolete));
  const submit = source.slice(
    source.indexOf('document.addEventListener("submit"'),
    source.indexOf('document.addEventListener("keydown"'),
  );
  const message = submit.slice(
    0,
    submit.indexOf('if (e.target.id === "task-form")'),
  );
  assert.ok(!message.includes("render();"));
  assert.ok(message.includes("restoreMessages(sentMessages.slice(-1))"));
  assert.ok(source.includes("!e.isComposing"));
});
