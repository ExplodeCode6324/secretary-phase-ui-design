/* Source geometry is immutable. The visible image is masked and reassembled. */
(function (root) {
  const NS = "http://www.w3.org/2000/svg";
  let serial = 0;
  function plan(shape, size, scheme = -1, random = Math.random) {
    const fixed = scheme >= 0;
    const kind = fixed ? Math.min(3, scheme) : Math.floor(random() * 3);
    const variation = fixed ? 0.5 : random();
    const direction = fixed ? 1 : random() < 0.5 ? -1 : 1;
    const small = size <= 18;
    const region =
      shape.regions[fixed ? 0 : Math.floor(random() * shape.regions.length)];
    const bands = {
      attention: 12,
      search: 10,
      tasks: 11,
      send: 11,
      chat: 10,
      memory: 12,
      file: 10,
      settings: 8,
      plus: 10,
      check: 12,
      arrow: 11,
      motion: 10,
      close: 10,
    };
    return {
      kind,
      duration: small ? 200 : [240, 280, 320, 0][kind],
      band: {
        x: -4,
        y:
          (bands[shape.name] || 11) +
          (fixed ? 0 : Math.floor(variation * 3) - 1),
        width: 32,
        height: small ? 3 : 4,
      },
      dx: (direction * (small ? 1 : 2.4) * 24) / Math.max(size, 1),
      dropout: {
        d: shape.body[region[0]],
        start: region[1],
        length: small ? 10 : 12 + Math.round(variation * 6),
      },
      residueWidth: fixed ? 1 : variation < 0.5 ? 0.7 : 1.8,
    };
  }
  function el(document, tag, attrs = {}) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs))
      node.setAttribute(key, String(value));
    return node;
  }
  // The only full source image is hidden by the caller. All visible copies are clipped/masked.
  function mountFault(
    document,
    layer,
    paths,
    sample,
    bounds,
    animate,
    residue = false,
    strokeWidth = 1.5,
  ) {
    const id = `phase-${++serial}`;
    const defs = el(document, "defs");
    layer.append(defs);
    const maskAttrs = {
      maskUnits: "userSpaceOnUse",
      maskContentUnits: "userSpaceOnUse",
      x: -8,
      y: -8,
      width: bounds.width + 16,
      height: bounds.height + 16,
      style: "mask-type:luminance",
    };
    const makeMask = (suffix) => {
      const m = el(document, "mask", { ...maskAttrs, id: id + suffix });
      m.append(
        el(document, "rect", {
          x: -8,
          y: -8,
          width: bounds.width + 16,
          height: bounds.height + 16,
          fill: "white",
          stroke: "none",
        }),
      );
      defs.append(m);
      return m;
    };
    const baseMask = makeMask("-base");
    const hasSlice = sample.kind === 0 || sample.kind === 2;
    const hasDropout = sample.kind === 1 || sample.kind === 2;
    const draw = (parent) =>
      paths.forEach((d) =>
        parent.append(
          el(document, "path", {
            d,
            fill: "none",
            stroke: "currentColor",
            "stroke-width": strokeWidth,
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
          }),
        ),
      );
    const addDropout = (mask) => {
      const hole = el(document, "path", {
        d: sample.dropout.d,
        fill: "none",
        stroke: "black",
        "stroke-width": strokeWidth + 1.5,
        pathLength: 100,
        "stroke-dasharray": `0 ${sample.dropout.start} ${sample.dropout.length} 100`,
        "stroke-linecap": "butt",
        class: "dropout-hole",
      });
      mask.append(hole);
      animate(
        hole,
        [
          { opacity: 1, offset: 0 },
          { opacity: 0, offset: 0.45 },
          { opacity: 1, offset: 0.6 },
          { opacity: 0, offset: 1 },
        ],
        sample.duration,
      );
    };
    if (hasDropout) addDropout(baseMask);
    const base = el(document, "g", {
      mask: `url(#${id}-base)`,
      class: "rendered-base",
    });
    draw(base);
    layer.append(base);
    if (hasSlice) {
      const cut = el(document, "rect", {
        ...sample.band,
        fill: "black",
        stroke: "none",
        class: "source-gap",
      });
      baseMask.append(cut);
      const clip = el(document, "clipPath", {
        id: id + "-slice",
        clipPathUnits: "userSpaceOnUse",
      });
      clip.append(el(document, "rect", { ...sample.band }));
      defs.append(clip);
      const moved = el(document, "g", { class: "displaced-slice" });
      const cropped = el(document, "g", { "clip-path": `url(#${id}-slice)` });
      if (hasDropout) {
        const dropMask = makeMask("-drop");
        addDropout(dropMask);
        cropped.setAttribute("mask", `url(#${id}-drop)`);
      }
      draw(cropped);
      moved.append(cropped);
      layer.append(moved);
      const dx = sample.dx,
        dy = sample.dy || 0;
      const frames = [
        { transform: `translate(${dx}px,${dy}px)`, offset: 0 },
        { transform: "translate(0px,0px)", offset: 0.48 },
        { transform: `translate(${dx * 0.5}px,${dy}px)`, offset: 0.64 },
        { transform: "translate(0px,0px)", offset: 1 },
      ];
      animate(moved, frames, sample.duration);
      if (residue) {
        const echo = el(document, "g", {
          "clip-path": `url(#${id}-slice)`,
          class: "signal-residue",
          color: "var(--light-blue)",
        });
        paths.forEach((d) =>
          echo.append(
            el(document, "path", {
              d,
              fill: "none",
              stroke: "currentColor",
              "stroke-width": sample.residueWidth,
            }),
          ),
        );
        layer.append(echo);
        animate(
          echo,
          [
            {
              opacity: 0.45,
              transform: `translate(${-dx / 2}px,0px)`,
              offset: 0,
            },
            { opacity: 0, transform: "translate(0px,0px)", offset: 0.5 },
            { opacity: 0, offset: 1 },
          ],
          sample.duration,
        );
      }
    }
  }
  function createController({
    document,
    window,
    geometry,
    onSample = () => {},
  }) {
    const active = new Map();
    let contacts = new WeakMap(),
      fixedScheme = -1,
      monochrome = false,
      freeze = false;
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
    function clear(c) {
      const effect = active.get(c);
      if (!effect) return;
      active.delete(c);
      effect.animations.forEach((a) => a.cancel());
      if (effect.timer !== undefined) window.clearTimeout(effect.timer);
      effect.cleanup.forEach((fn) => fn());
      c.classList.remove(
        "is-simulating",
        "commit-pulse",
        "boundary-fault",
        "submit-fault",
      );
      c.removeAttribute("data-fault-kind");
    }
    function clearAll() {
      for (const c of [...active.keys()]) clear(c);
      contacts = new WeakMap();
    }
    function begin(c, duration, held = false) {
      clear(c);
      if (!enabled(c)) return null;
      const effect = { animations: [], cleanup: [] };
      active.set(c, effect);
      c.classList.add("is-simulating");
      effect.animate = (node, frames, span) => {
        const a = node.animate(frames, {
          duration: span,
          easing: "steps(1,end)",
          fill: "both",
        });
        a.finished.catch(() => {});
        effect.animations.push(a);
        if (held) {
          a.pause();
          a.currentTime = span * 0.25;
        }
      };
      if (!held)
        effect.timer = window.setTimeout(() => {
          if (active.get(c) === effect) clear(c);
        }, duration + 20);
      return effect;
    }
    function boundary(c, navigation = false) {
      const duration = navigation ? 220 : 200;
      const effect = begin(c, duration);
      if (!effect) return;
      const rect = c.getBoundingClientRect(),
        w = rect.width,
        h = rect.height;
      c.classList.add("boundary-fault");
      if (!navigation) c.classList.add("submit-fault");
      const svg = el(document, "svg", {
        viewBox: `0 0 ${w} ${h}`,
        width: w,
        height: h,
        "aria-hidden": "true",
        focusable: "false",
        class: "boundary-display",
      });
      c.append(svg);
      effect.cleanup.push(() => svg.remove());
      // Replace the genuine CSS border, not a colored layer on top of it.
      const selected = c.getAttribute("aria-current") === "page";
      const paths = navigation
        ? selected
          ? [`M0 .5H${w} M0 ${h - 0.5}H${w}`]
          : [`M${w - 0.5} 0V${h}`]
        : [`M.5 .5H${w - 0.5}V${h - 0.5}H.5Z`];
      const sample = {
        kind: 0,
        duration,
        band: navigation
          ? selected
            ? { x: w * 0.2, y: -2, width: Math.min(38, w * 0.3), height: 5 }
            : { x: w - 3, y: h * 0.35, width: 6, height: 8 }
          : { x: w - 3, y: h * 0.3, width: 6, height: 16 },
        dx: navigation ? 2 : -1.5,
        dy: navigation ? 1 : 0,
      };
      mountFault(
        document,
        svg,
        paths,
        sample,
        { width: w, height: h },
        effect.animate,
        false,
        1,
      );
    }
    function play(c, activation = false) {
      clear(c);
      if (!enabled(c) || fixedScheme === 3) return;
      // Submission alone animates its boundary. The old projecting arrow remains in v0.6.
      if (c.classList.contains("send-launch")) return;
      if (
        c.closest("nav") &&
        activation &&
        c.getAttribute("aria-current") === "page"
      ) {
        boundary(c, true);
        return;
      }
      const glyph = c.querySelector(".glyph");
      if (!glyph) return;
      const name = glyph.dataset.glyph;
      const shape = { ...(geometry[name] || geometry.file), name };
      const sample = plan(
        shape,
        glyph.getBoundingClientRect().width,
        fixedScheme,
      );
      const held = freeze && c.classList.contains("study-trigger");
      const effect = begin(c, sample.duration, held);
      if (!effect) return;
      c.dataset.faultKind = ["slice", "dropout", "combined"][sample.kind];
      const body = glyph.querySelector(".icon-body"),
        layer = glyph.querySelector(".signal-layer");
      body.setAttribute("visibility", "hidden");
      effect.cleanup.push(() => {
        body.removeAttribute("visibility");
        layer.replaceChildren();
      });
      mountFault(
        document,
        layer,
        shape.body,
        sample,
        { width: 24, height: 24 },
        effect.animate,
        sample.kind === 2 && !monochrome,
      );
      onSample({
        kind: sample.kind,
        duration: sample.duration,
        monochrome: monochrome || sample.kind !== 2,
        held,
      });
    }
    const target = (e) => e.target.closest?.("button,a");
    function contact(c) {
      if (!contacts.has(c)) contacts.set(c, { hover: false, focus: false });
      return contacts.get(c);
    }
    const listeners = [];
    function listen(host, type, fn, options) {
      host.addEventListener(type, fn, options);
      listeners.push(() => host.removeEventListener(type, fn, options));
    }
    listen(document, "pointerover", (e) => {
      const c = target(e);
      if (!c || c.contains(e.relatedTarget)) return;
      const s = contact(c),
        old = s.hover || s.focus;
      s.hover = true;
      if (!old) play(c);
    });
    listen(document, "focusin", (e) => {
      const c = target(e);
      if (!c || c.contains(e.relatedTarget)) return;
      const s = contact(c),
        old = s.hover || s.focus;
      s.focus = true;
      if (!old) play(c);
    });
    for (const type of ["pointerout", "focusout"])
      listen(document, type, (e) => {
        const c = target(e);
        if (c && !c.contains(e.relatedTarget)) {
          contacts.delete(c);
          clear(c);
        }
      });
    function press(e) {
      const c = target(e);
      if (!c) return;
      clear(c);
      if (c.closest("nav")) boundary(c, true);
    }
    listen(document, "pointerdown", press);
    listen(document, "keydown", (e) => {
      if (e.key === " " || e.key === "Enter") press(e);
    });
    listen(
      document,
      "click",
      (e) => {
        const c = target(e);
        if (c) play(c, true);
      },
      true,
    );
    for (const type of ["pointerout", "focusout"])
      listen(document, type, (e) => {
        const box = e.target.closest?.(".composer-box");
        if (box && !box.contains(e.relatedTarget)) {
          clear(box);
          if (type === "focusout") box.classList.remove("submitted-focus");
        }
      });
    listen(document, "pointercancel", clearAll);
    listen(window, "blur", clearAll);
    listen(document, "visibilitychange", () => {
      if (document.hidden) clearAll();
    });
    listen(reduced, "change", clearAll);
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
      feedback(c) {
        if (c) play(c, true);
      },
      submit(c) {
        if (c) boundary(c);
      },
      navigation(c) {
        if (c) boundary(c, true);
      },
      setScheme(v) {
        clearAll();
        fixedScheme = v;
      },
      setMonochrome(v) {
        clearAll();
        monochrome = v;
      },
      setFreeze(v) {
        clearAll();
        freeze = v;
      },
      destroy() {
        clearAll();
        observer.disconnect();
        listeners.forEach((fn) => fn());
      },
    };
  }
  const api = { plan, mountFault, createController };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PhaseSignalMotion = api;
})(typeof window !== "undefined" ? window : globalThis);
