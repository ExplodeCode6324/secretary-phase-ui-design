/* Display-only sampling. No body path is mutated or animated. */
(function (root) {
  const schemes = [
    {
      regions: [0, 1],
      delay: [0, 115],
      span: [310, 420],
      offset: [
        [-1, 0],
        [1, 0.4],
      ],
      colors: ["light", "blue"],
      widths: [0.7, 1.6],
      align: [true, false],
    },
    {
      regions: [2, 0],
      delay: [65, 0],
      span: [350, 280],
      offset: [
        [0.5, -1],
        [-1, 0],
      ],
      colors: ["blue", "light"],
      widths: [1, 0.7],
      align: [false, true],
    },
    {
      regions: [1, 3],
      delay: [0, 165],
      span: [260, 360],
      offset: [
        [1, 0],
        [-0.3, 1],
      ],
      colors: ["light", "blue"],
      widths: [0.7, 1.8],
      align: [false, true],
    },
    {
      regions: [3, 2],
      delay: [100, 15],
      span: [390, 300],
      offset: [
        [-0.7, -0.5],
        [1, 0],
      ],
      colors: ["blue", "light"],
      widths: [1, 0.7],
      align: [true, false],
    },
  ];
  function plan(shape, size, scheme = -1, random = Math.random) {
    // Resolve every choice once. Animation frames never call random().
    const index =
      scheme < 0
        ? Math.min(3, Math.floor(random() * 4))
        : Math.max(0, Math.min(3, scheme));
    const config = schemes[index];
    const variation = scheme < 0 ? random() : 0.5;
    const count = size <= 18 ? 1 : 2;
    const amplitude = size <= 18 ? 1.3 : size <= 24 ? 2 : 2.6; // SVG units; up to 3.5 CSS px at 32px.
    const fragments = config.regions.slice(0, count).map((region, i) => {
      const [part, start, length] = shape.regions[region];
      return {
        d: shape.body[part],
        part,
        start,
        length: Math.max(8, length - (variation < 0.5 ? 3 : 0)),
        dx: config.offset[i][0] * amplitude,
        dy: config.offset[i][1] * amplitude,
        delay: config.delay[i] + Math.round(variation * 25),
        duration: config.span[i],
        width: size <= 18 ? Math.min(1, config.widths[i]) : config.widths[i],
        opacity: size <= 18 ? 0.45 : config.colors[i] === "light" ? 0.58 : 0.65,
        color: config.colors[i],
        align: config.align[i],
      };
    });
    return {
      scheme: index,
      fragments,
      duration: Math.max(...fragments.map((f) => f.delay + f.duration)),
    };
  }
  function createController({
    document,
    window,
    geometry,
    onSample = () => {},
  }) {
    const active = new Map();
    let contacts = new WeakMap(),
      fixedScheme = -1;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    function enabled(c) {
      return (
        c.isConnected &&
        !c.matches(':disabled,[aria-disabled="true"]') &&
        !c.closest(".static-sample") &&
        !reduced.matches &&
        !document.body.matches(
          ".plain-surface,.motion-off,.motion-reduced,.wireframe",
        )
      );
    }
    function contact(c) {
      if (!contacts.has(c)) contacts.set(c, { hover: false, focus: false });
      return contacts.get(c);
    }
    function clear(c) {
      const effect = active.get(c);
      if (!effect) return;
      active.delete(c); // Invalidate before cancel promises resolve.
      effect.animations.forEach((a) => a.cancel());
      if (effect.timer !== undefined) window.clearTimeout(effect.timer);
      c.querySelectorAll(".signal-layer").forEach((layer) =>
        layer.replaceChildren(),
      );
      c.classList.remove("is-simulating", "commit-pulse");
      c.removeAttribute("data-signal-scheme");
    }
    function clearAll() {
      for (const c of [...active.keys()]) clear(c);
      contacts = new WeakMap();
    }
    function play(c, activation = false) {
      clear(c);
      if (!enabled(c)) return;
      const effect = { animations: [] };
      active.set(c, effect);
      c.classList.add("is-simulating");
      // A control owns one batch, even if it contains more than one icon.
      const selected =
        fixedScheme < 0 ? Math.floor(Math.random() * 4) : fixedScheme;
      c.dataset.signalScheme = String(selected + 1);
      const glyph = c.querySelector(".glyph");
      let duration = activation ? 360 : 640,
        count = 0;
      if (glyph) {
        const shape = geometry[glyph.dataset.glyph] || geometry.file;
        const sample = plan(
          shape,
          glyph.getBoundingClientRect().width,
          selected,
        );
        duration = sample.duration;
        count = sample.fragments.length;
        const layer = glyph.querySelector(".signal-layer");
        for (const f of sample.fragments) {
          const fragment = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          fragment.setAttribute("d", f.d);
          fragment.setAttribute("pathLength", "100");
          fragment.setAttribute(
            "stroke-dasharray",
            `0 ${f.start} ${f.length} 100`,
          );
          fragment.setAttribute("stroke-width", String(f.width));
          fragment.setAttribute(
            "stroke",
            f.color === "light" ? "var(--light-blue)" : "var(--blue)",
          );
          fragment.classList.add("signal-fragment");
          layer.append(fragment);
          const initial = `translate(${f.dx}px, ${f.dy}px)`;
          const animation = fragment.animate(
            [
              { opacity: 0, transform: initial, offset: 0 },
              { opacity: f.opacity, transform: initial, offset: 0.18 },
              {
                opacity: f.opacity * 0.8,
                transform: f.align ? "translate(0px, 0px)" : initial,
                offset: 0.65,
              },
              {
                opacity: 0,
                transform: f.align ? "translate(0px, 0px)" : initial,
                offset: 1,
              },
            ],
            {
              delay: f.delay,
              duration: f.duration,
              easing: "linear",
              fill: "none",
            },
          );
          effect.animations.push(animation);
        }
        effect.animations.forEach((a) => a.finished.catch(() => {}));
      }
      if (activation) c.classList.add("commit-pulse");
      // Own CSS decoration cleanup with the same generation as the SVG effects.
      effect.timer = window.setTimeout(
        () => {
          if (active.get(c) === effect) clear(c);
        },
        Math.max(duration, activation ? 360 : 640) + 20,
      );
      if (glyph) onSample({ scheme: selected, count, duration });
    }
    const target = (e) => e.target.closest?.("button,a");
    const listeners = [];
    function listen(host, type, fn, options) {
      host.addEventListener(type, fn, options);
      listeners.push(() => host.removeEventListener(type, fn, options));
    }
    listen(document, "pointerover", (e) => {
      const c = target(e);
      if (!c || c.contains(e.relatedTarget)) return;
      const state = contact(c),
        already = state.focus || state.hover;
      state.hover = true;
      if (!already) play(c);
    });
    listen(document, "pointerout", (e) => {
      const c = target(e);
      if (!c || c.contains(e.relatedTarget)) return;
      contact(c).hover = false;
      contact(c).focus = false;
      clear(c);
    });
    listen(document, "focusin", (e) => {
      const c = target(e);
      if (!c || c.contains(e.relatedTarget)) return;
      const state = contact(c),
        already = state.hover || state.focus;
      state.focus = true;
      if (!already) play(c);
    });
    listen(document, "focusout", (e) => {
      const c = target(e);
      if (c && !c.contains(e.relatedTarget)) {
        contact(c).focus = false;
        contact(c).hover = false;
        clear(c);
      }
    });
    listen(document, "pointerdown", (e) => {
      const c = target(e);
      if (c) clear(c);
    });
    listen(document, "keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        const c = target(e);
        if (c) clear(c);
      }
    });
    listen(document, "pointercancel", clearAll);
    listen(window, "blur", clearAll);
    listen(document, "visibilitychange", () => {
      if (document.hidden) clearAll();
    });
    listen(reduced, "change", clearAll);
    // Capture runs before business handlers; never preventDefault or synthesize clicks.
    listen(
      document,
      "click",
      (e) => {
        const c = target(e);
        if (c) play(c, true);
      },
      true,
    );
    const observer = new window.MutationObserver(() => {
      for (const c of [...active.keys()]) if (!enabled(c)) clear(c);
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "class"],
    });
    return {
      clearAll,
      setScheme(value) {
        fixedScheme = value;
        clearAll();
      },
      destroy() {
        clearAll();
        observer.disconnect();
        listeners.forEach((remove) => remove());
      },
    };
  }
  const api = { plan, createController };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PhaseSignalMotion = api;
})(typeof window !== "undefined" ? window : globalThis);
