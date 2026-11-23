/* Dinner Table Politics — interactions. Plain JavaScript, no libraries, no network requests
   except the optional, consent-gated analytics script. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var R = window.RESULTS;
  var SVGNS = "http://www.w3.org/2000/svg";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = getComputedStyle(doc);
  function tok(name) { return css.getPropertyValue(name).trim(); }
  var C = { ink: tok("--ink"), bg: tok("--bg"), mint: tok("--mint"), orange: tok("--orange"), grey: tok("--grey"), mid: tok("--chart-mid"),
    blue: tok("--blue"), red: tok("--red"), blueDark: tok("--blue-on-dark"), redDark: tok("--red-on-dark") };
  var POL = [0, 1, 2, 3, 4, 5, 6].map(function (v) { return tok("--pol-" + v); });

  function el(name, attrs, parent) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) {
      if (k === "style") e.style.cssText = attrs[k];   // CSSOM, allowed by the page's Content-Security-Policy
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el("text", Object.assign({ x: x, y: y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }
  function clear(svg) {
    Array.prototype.slice.call(svg.childNodes).forEach(function (n) {
      if (n.nodeName !== "title" && n.nodeName !== "desc") svg.removeChild(n);
    });
  }
  function fmt(x, d) {
    d = d === undefined ? 2 : d;
    var s = Math.abs(x).toFixed(d);
    if (Number(s) === 0) return "0." + "0".repeat(d);
    return (x < 0 ? "−" : "+") + s;
  }

  /* ---------------- motion helpers ---------------- */
  var ease = function (x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };          // exponential ease-out
  var easeIO = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  function tween(dur, step, done) {               // calls step(p) with p from 0 to 1 over dur ms
    if (reduced || dur <= 0) { step(1); if (done) done(); return function () {}; }
    var start = null, stop = false;
    function frame(ts) { if (stop) return; if (start === null) start = ts; var p = Math.min(1, (ts - start) / dur); step(p); if (p < 1) requestAnimationFrame(frame); else if (done) done(); }
    requestAnimationFrame(frame);
    return function () { stop = true; };
  }
  function onView(node, fn, margin) {             // runs fn once, when node first scrolls into view
    if (!node) return;
    if (reduced || !("IntersectionObserver" in window)) { fn(); return; }
    var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { o.disconnect(); fn(); } }, { rootMargin: margin || "0px 0px -15% 0px", threshold: 0.1 });
    o.observe(node);
  }

  /* ---------------- first paint: masked headline ---------------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add("ready"); }); });

  /* ---------------- phone menu ---------------- */
  var menuBtn = document.querySelector(".menu-toggle");
  var links = document.getElementById("top-links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.focus(); }
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------------- section entrances (heading, text, picture, staggered) ---------------- */
  var groups = [
    ".tile", ".how-head > *", ".how-figure", ".how-steps > div", ".chart-head > *", ".chart-figure",
    ".cut", ".try-head > *", ".calc > *", ".sure-top > *", ".sure-controls", ".table-wrap", ".quiz-pic",
    ".about > h2", ".about > .lead", ".about-photo"
  ];
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    groups.forEach(function (sel) {
      var list = document.querySelectorAll(sel);
      Array.prototype.forEach.call(list, function (node, i) {
        if (node.tagName === "H2") return;              // headings get their own masked reveal below
        node.classList.add("rise");
        var d = Math.min(i, 8) * 70;
        if (sel === ".cut") d = ((i % 6) + Math.floor(i / 6)) * 55;   // a wave across the board
        node.style.setProperty("--d", d + "ms");
        io.observe(node);
      });
    });
    // anything the reader has already scrolled past (fast scroll, anchor jump) is shown at once
    var pending = false;
    function sweep() {
      pending = false;
      Array.prototype.forEach.call(document.querySelectorAll(".rise:not(.in)"), function (n) {
        if (n.getBoundingClientRect().top < window.innerHeight) { n.classList.add("in"); io.unobserve(n); }
      });
    }
    window.addEventListener("scroll", function () { if (!pending) { pending = true; requestAnimationFrame(sweep); } }, { passive: true });
    window.addEventListener("hashchange", sweep);

    // every section heading rises from behind its own baseline, like the hero headline
    Array.prototype.forEach.call(document.querySelectorAll("main h2:not(.sr-only)"), function (h) {
      var inner = document.createElement("span"); inner.className = "mask-in";
      while (h.firstChild) inner.appendChild(h.firstChild);
      var outer = document.createElement("span"); outer.className = "mask-out"; outer.appendChild(inner);
      h.appendChild(outer); h.classList.add("masked");
      onView(h, function () { h.classList.add("in"); }, "0px 0px -10% 0px");
    });

    // big figures count up from zero the first time they are seen
    Array.prototype.forEach.call(document.querySelectorAll(".big-figure"), function (n) {
      var target = parseFloat(n.textContent.replace("\u2212", "-").replace("+", "")), dec = (n.textContent.split(".")[1] || "").length;
      n.textContent = "+" + (0).toFixed(dec);
      onView(n, function () { tween(1400, function (p) { n.textContent = "+" + (target * ease(p)).toFixed(dec); }); });
    });

    // footer name: letters rise one after another
    var fname = document.querySelector(".foot-name");
    if (fname) {
      var txtc = fname.textContent; fname.textContent = "";
      txtc.split("").forEach(function (ch, i) {
        var sp = document.createElement("span"); sp.className = "ltr"; sp.textContent = ch === " " ? "\u00a0" : ch;
        sp.style.setProperty("--d", i * 28 + "ms"); fname.appendChild(sp);
      });
      onView(fname, function () { fname.classList.add("in"); }, "0px 0px -5% 0px");
    }

    // reading progress along the top edge, and a slow parallax on the hero film
    var bar = document.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar);
    var mast = document.querySelector(".masthead video, .masthead img"), ticking = false;
    function onScroll() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      if (mast && window.scrollY < window.innerHeight * 1.2) mast.style.transform = "translateY(" + window.scrollY * 0.18 + "px) scale(1.06)";
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ---------------- "many into one" diagram ---------------- */
  (function drawHow() {
    var svg = document.getElementById("how-svg");
    if (!svg) return;
    var narrow = window.matchMedia("(max-width: 700px)").matches;
    var W = 900, H = 200, s = 10, n = 144;
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var g = el("g", {}, svg);
    for (var i = 0; i < n; i++) {
      var x, y, fill;
      if (i < 64) {            // scattered answers
        x = 10 + rnd() * 270; y = 10 + rnd() * (H - 30); fill = i % 2 ? C.blue : C.red;
      } else if (i < 100) {    // the narrow Thanksgiving-week ribbon
        var k = i - 64; x = 330 + (k % 12) * 20; y = 75 + Math.floor(k / 12) * 18; fill = C.orange;
      } else {                 // ordered comparison rows
        var j = i - 100; x = 640 + (j % 11) * 22; y = 30 + Math.floor(j / 11) * 36; fill = C.ink;
      }
      var r = el("rect", { x: x.toFixed(1), y: y.toFixed(1), width: s + 2, height: s + 2, fill: fill }, g);
      if (!reduced && i >= 64) {     // the ribbon and the rows start among the scattered answers and flow to their place
        var sx = 10 + rnd() * 270, sy = 10 + rnd() * (H - 30);
        r.style.transform = "translate(" + (sx - x).toFixed(1) + "px," + (sy - y).toFixed(1) + "px)";
        r.style.fill = i % 2 ? C.blue : C.red;
        r.style.transition = "transform 1400ms cubic-bezier(0.16,1,0.3,1) " + ((i - 64) * 12) + "ms, fill 600ms ease " + (500 + (i - 64) * 12) + "ms";
        r.dataset.flow = "1";
      }
    }
    if (narrow) svg.setAttribute("viewBox", "0 0 900 200");
    onView(svg, function () {
      Array.prototype.forEach.call(svg.querySelectorAll("[data-flow]"), function (r) { r.style.transform = "none"; r.style.fill = ""; });
    });
  })();

  /* ---------------- calendar drawing in the about tile ---------------- */
  (function drawCal() {
    var g = document.getElementById("cal");
    if (!g) return;
    function month(x0, name, startDow, days, mark) {
      txt(g, x0, 34, name, { "font-size": 18, "font-weight": 600, fill: C.ink });
      var cw = 17, ch = 17;
      for (var d = 1; d <= days; d++) {
        var idx = startDow + d - 1, col = idx % 7, row = Math.floor(idx / 7);
        var x = x0 + col * cw, y = 50 + row * ch;
        var on = d === mark;
        var day = el("rect", { x: x, y: y, width: cw - 3, height: ch - 3, fill: on ? C.ink : "rgba(0,0,0,0.18)", class: "day" + (on ? " holiday" : "") }, g);
        day.style.transitionDelay = (d * 18 + (x0 > 100 ? 300 : 0)) + "ms";
      }
    }
    // 2022: October starts on Saturday (Canadian Thanksgiving Mon 10 Oct); November starts Tuesday (US Thu 24 Nov)
    month(18, "October", 5, 31, 10);
    month(160, "November", 1, 30, 24);
    txt(g, 18, 186, "Canada", { "font-size": 14, fill: C.ink });
    txt(g, 160, 186, "United States", { "font-size": 14, fill: C.ink });
    onView(g, function () { g.classList.add("in"); });
  })();

  /* ---------------- film clips: pause button, reduced motion, play only while visible ---------------- */
  (function clips() {
    var vids = document.querySelectorAll("video.clip");
    Array.prototype.forEach.call(vids, function (v) {
      var btn = v.parentNode.querySelector(".vid-toggle");
      v.dataset.user = reduced ? "paused" : "";
      function sync() { if (btn) { btn.textContent = v.paused ? "Play" : "Pause"; btn.setAttribute("aria-pressed", String(v.paused)); btn.setAttribute("aria-label", (v.paused ? "Play" : "Pause") + " film clip"); } }
      if (reduced) { v.removeAttribute("autoplay"); v.pause(); }
      v.addEventListener("play", sync); v.addEventListener("pause", sync); sync();
      if (btn) btn.addEventListener("click", function () {
        if (v.paused) { v.dataset.user = ""; v.play().catch(function () {}); } else { v.dataset.user = "paused"; v.pause(); }
      });
    });
    if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) { if (!v.dataset.user) v.play().catch(function () {}); } else if (!v.paused) v.pause();
        });
      }, { threshold: 0.2 });
      Array.prototype.forEach.call(vids, function (v) { vio.observe(v); });
    }
  })();

  if (!R) return;  // the remaining parts need the data file

  /* ---------------- event-study chart with toggles ---------------- */
  (function eventChart() {
    var svg = document.getElementById("event-chart");
    if (!svg) return;
    var state = { measure: "discussion", sample: "Combined" };
    var caption = document.getElementById("chart-caption");
    var captions = {
      discussion: "In the Thanksgiving week, people are about 5 percentage points more likely to talk politics with parents, siblings or grown-up children than the week before.",
      opinion: "How much more a family one point further right pulls opinions, week by week. Positive in the Thanksgiving week, but the range is wide: the effect is small and short-lived."
    };
    var shownVals = null, stopT = null, seen = false;
    function draw(instant) {
      var target = R[state.measure][state.sample];
      var from = shownVals || { week: target.week, b: target.b.map(function () { return 0; }), se: target.se.map(function () { return 0; }) };
      if (!seen) { render(from, target); return; }          // wait until the chart is on screen
      if (stopT) stopT();
      stopT = tween(instant ? 0 : 700, function (p) {
        var e = easeIO(p);
        var mid = { week: target.week, b: target.b.map(function (v, i) { return from.b[i] + (v - from.b[i]) * e; }), se: target.se.map(function (v, i) { return from.se[i] + (v - from.se[i]) * e; }) };
        render(mid, target); shownVals = mid;
      });
    }
    function render(d, target) {
      clear(svg);
      var small = svg.getBoundingClientRect().width < 520;
      var W = small ? 420 : 720, H = small ? 340 : 380, L = small ? 58 : 70, Rr = small ? 8 : 20, T = 30, B = 60;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var FS = small ? 18 : 14;   // about 14px on screen either way
      var lo = Math.min.apply(null, target.b.map(function (b, i) { return b - 1.96 * target.se[i]; }));
      var hi = Math.max.apply(null, target.b.map(function (b, i) { return b + 1.96 * target.se[i]; }));
      var pad = (hi - lo) * 0.08; lo = Math.min(lo - pad, -0.02); hi = Math.max(hi + pad, 0.02);
      var xs = function (i) { return L + (i + 0.5) * (W - L - Rr) / d.week.length; };
      var ys = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
      var pct = state.measure === "discussion";
      // axis ticks
      var step = (hi - lo) > 0.25 ? 0.1 : 0.05;
      for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
        var lab = pct ? Math.round(v * 100) + " pp" : v.toFixed(2);
        txt(svg, L - 12, ys(v) + 5, lab.replace("-", "−"), { "text-anchor": "end", "font-size": FS });
      }
      el("rect", { x: L, y: ys(0) - 1, width: W - L - Rr, height: 2, fill: C.ink }, svg);
      // Thanksgiving week band
      var bw = (W - L - Rr) / d.week.length;
      el("rect", { x: xs(2) - bw / 2, y: T, width: bw, height: H - T - B, fill: C.mint }, svg);
      txt(svg, xs(2), T - 10, "Thanksgiving week", { "text-anchor": "middle", "font-size": FS, "font-weight": 600 });
      d.week.forEach(function (w, i) {
        var b = d.b[i], se = d.se[i], x = xs(i);
        if (se > 0) el("rect", { x: x - 2, y: ys(b + 1.96 * se), width: 4, height: Math.max(2, ys(b - 1.96 * se) - ys(b + 1.96 * se)), fill: C.ink }, svg);
        var c = el("circle", { cx: x, cy: ys(b), r: i === 2 ? 9 : 7, fill: i === 2 ? C.orange : C.ink, stroke: C.ink, "stroke-width": 2 }, svg);
        var tl = el("title", {}, c);
        tl.textContent = "Week " + w + ": " + (pct ? (b * 100).toFixed(1) + " percentage points" : b.toFixed(3)) + (se > 0 ? " (95% range " + (pct ? ((b - 1.96 * se) * 100).toFixed(1) + " to " + ((b + 1.96 * se) * 100).toFixed(1) : (b - 1.96 * se).toFixed(3) + " to " + (b + 1.96 * se).toFixed(3)) + ")" : " (reference week)");
        var wl = w === -2 ? (small ? "−2+" : "−2 or earlier") : w === 3 ? (small ? "+3+" : "+3 or later") : (w > 0 ? "+" : w < 0 ? "−" : "") + Math.abs(w);
        txt(svg, x, H - B + 26, wl, { "text-anchor": "middle", "font-size": FS });
      });
      txt(svg, L + (W - L - Rr) / 2, H - 8, "Weeks relative to Thanksgiving", { "text-anchor": "middle", "font-size": FS });
      caption.textContent = captions[state.measure];
      var live = document.getElementById("chart-data");
      if (live) live.textContent = state.sample + ", " + (pct ? "talking politics" : "pull of the family") + ": " + target.week.map(function (w, i) {
        return "week " + w + " " + (pct ? (target.b[i] * 100).toFixed(1) + " percentage points" : target.b[i].toFixed(3));
      }).join("; ") + ".";
    }
    function bindSeg(attr, key) {
      var btns = document.querySelectorAll("[data-" + attr + "]");
      Array.prototype.forEach.call(btns, function (b) {
        b.addEventListener("click", function () {
          Array.prototype.forEach.call(btns, function (o) { o.setAttribute("aria-pressed", String(o === b)); });
          state[key] = b.getAttribute("data-" + attr);
          draw();
        });
      });
    }
    bindSeg("measure", "measure"); bindSeg("sample", "sample");
    draw();
    onView(svg, function () { seen = true; draw(); });
    var t1; window.addEventListener("resize", function () { clearTimeout(t1); t1 = setTimeout(function () { draw(true); }, 150); });
  })();

  /* ---------------- the live thing: seat your family ---------------- */
  (function calculator() {
    var own = document.getElementById("own"), fam = document.getElementById("fam");
    if (!own || !fam) return;
    var labels = ["Extremely left wing", "Left wing", "Somewhat left wing", "Neither left nor right", "Somewhat right wing", "Right wing", "Extremely right wing"];
    var b = R.main.b, V = R.main.vcov, sd = R.sample.index_sd;
    var cells = document.querySelectorAll("#strip .cell");
    var dist = {}; (R.family_distribution || []).forEach(function (x) { dist[x.v] = x.share; });
    var maxShare = Math.max.apply(null, Object.keys(dist).map(function (k) { return dist[k]; }).concat([0.01]));
    Array.prototype.forEach.call(cells, function (c, i) {
      var sh = dist[c.getAttribute("data-v")] || 0;
      c.style.setProperty("--h", reduced ? Math.round(sh / maxShare * 100) + "%" : "0%");
      c.querySelector(".bar").style.transitionDelay = i * 70 + "ms";
      c.setAttribute("title", Math.round(sh * 100) + "% of families at " + c.getAttribute("data-v"));
    });
    onView(document.getElementById("strip"), function () {
      Array.prototype.forEach.call(cells, function (c) { c.style.setProperty("--h", Math.round((dist[c.getAttribute("data-v")] || 0) / maxShare * 100) + "%"); });
    });
    var shownEst = null, stopNum = null;
    function side(v, dark) { return v < 3 ? (dark ? C.blueDark : C.blue) : v > 3 ? (dark ? C.redDark : C.red) : ""; }
    function update() {
      var o = Number(own.value), f = Number(fam.value);
      var oo = document.getElementById("own-out"), fo = document.getElementById("fam-out");
      oo.textContent = labels[o]; fo.textContent = labels[f];
      oo.style.color = side(o, true); fo.style.color = side(f, true);
      own.style.setProperty("--thumb", POL[o]); fam.style.setProperty("--thumb", POL[f]);
      Array.prototype.forEach.call(cells, function (c) {
        var v = Number(c.getAttribute("data-v"));
        var pin = v === o && v === f ? "You + family" : v === o ? "You" : v === f ? "Family" : "";
        if (pin) c.setAttribute("data-pin", pin); else c.removeAttribute("data-pin");
      });
      own.setAttribute("aria-valuetext", o + ": " + labels[o]);
      fam.setAttribute("aria-valuetext", f + ": " + labels[f]);
      var g = [1, f, o];
      var est = b.T + b.fam * f + b.self * o;
      var v = 0;
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) v += g[i] * V[i][j] * g[j];
      var se = Math.sqrt(v), lo = est - 1.96 * se, hi = est + 1.96 * se;
      var rf = document.getElementById("res-figure");
      var from = shownEst === null ? est : shownEst;
      if (stopNum) stopNum();
      stopNum = tween(Math.abs(est - from) < 1e-9 ? 0 : 450, function (p) { shownEst = from + (est - from) * ease(p); rf.textContent = fmt(shownEst); });
      rf.classList.remove("bump"); void rf.offsetWidth; if (from !== est) rf.classList.add("bump");
      rf.classList.toggle("to-right", est >= 0.005); rf.classList.toggle("to-left", est <= -0.005);
      var dir = Math.abs(est) < 0.005 ? "would hardly move" : "would move " + Math.abs(est).toFixed(2) + " points to the " + (est > 0 ? "right" : "left");
      var share = Math.round(Math.abs(est) / sd * 100);
      document.getElementById("res-text").textContent = "Your opinions " + dir + " in the Thanksgiving week" + (share >= 1 ? ", about " + share + "% of the typical spread of opinions." : ".");
      var range = "95% range: " + fmt(lo) + " to " + fmt(hi);
      if (lo < 0 && hi > 0) range += ". The range includes zero, so we cannot rule out no change.";
      document.getElementById("res-range").textContent = range;
    }
    own.addEventListener("input", update); fam.addEventListener("input", update);
    update();
    // first visit: the family slider demonstrates itself once (3 -> 6 -> 5), unless the reader is faster
    var touched = false;
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { own.addEventListener(ev, function () { touched = true; }); fam.addEventListener(ev, function () { touched = true; }); });
    var hint = document.createElement("span"); hint.className = "drag-hint"; hint.setAttribute("aria-hidden", "true"); hint.textContent = "Drag me";
    fam.parentNode.appendChild(hint);
    onView(fam, function () {
      if (reduced) return;
      var seq = [6, 5], start = Number(fam.value), k = 0;
      hint.classList.add("show");
      function next() {
        if (touched || k >= seq.length) { hint.classList.remove("show"); return; }
        var a = Number(fam.value), z = seq[k++];
        tween(900, function (p) { if (touched) return; var v = Math.round(a + (z - a) * easeIO(p)); if (v !== Number(fam.value)) { fam.value = v; update(); } }, function () { setTimeout(next, 500); });
      }
      setTimeout(next, 600);
    }, "0px 0px -30% 0px");
  })();

  /* ---------------- robustness: one table with a range plot in every row ---------------- */
  (function robustness() {
    var chips = document.getElementById("chips"), tbody = document.querySelector("#rob-table tbody"), axis = document.getElementById("rob-axis");
    if (!chips || !tbody || !axis) return;
    var rows = R.robustness, unit = "sd", shown = {}, robSeen = false;
    var PAD = 4;   // per cent of the plot cell kept free at each end
    rows.forEach(function (r, i) {
      shown[r.spec] = i < 5;
      if (r.spec === "Baseline") return;          // the baseline is always shown
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = r.spec;
      b.setAttribute("aria-pressed", String(shown[r.spec]));
      b.addEventListener("click", function () {
        shown[r.spec] = !shown[r.spec]; b.setAttribute("aria-pressed", String(shown[r.spec])); draw();
      });
      chips.appendChild(b);
    });
    var ubtns = document.querySelectorAll("[data-unit]");
    Array.prototype.forEach.call(ubtns, function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(ubtns, function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        unit = b.getAttribute("data-unit"); draw();
      });
    });
    function grade(p) { return p < 0.05 ? "yes" : p < 0.10 ? "mid" : "no"; }
    var gradeText = { yes: "reliable", mid: "borderline", no: "not reliable" };
    function draw() {
      var list = rows.filter(function (r) { return shown[r.spec]; });
      var val = function (r) { return unit === "sd" ? [r.b_sd, r.se_sd] : [r.b, r.se]; };
      // one scale shared by every row (and by the axis below), always including zero
      var lo = 0, hi = 0;
      rows.forEach(function (r) { var v = val(r); lo = Math.min(lo, v[0] - 1.96 * v[1]); hi = Math.max(hi, v[0] + 1.96 * v[1]); });
      var step = unit === "sd" ? 0.04 : 0.05;
      lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
      var xs = function (x) { return PAD + (x - lo) / (hi - lo) * (100 - 2 * PAD); };   // in per cent
      tbody.innerHTML = "";
      list.forEach(function (r, i) {
        var v = val(r), g = grade(r.p_wild), tr = document.createElement("tr");
        if (r.spec === "Baseline") tr.className = "is-base";
        var c1 = document.createElement("th"); c1.scope = "row";
        var nm = document.createElement("span"); nm.className = "check-name"; nm.textContent = r.spec; c1.appendChild(nm);
        var ab = document.createElement("span"); ab.className = "check-about"; ab.textContent = r.about; c1.appendChild(ab);
        tr.appendChild(c1);
        var c2 = document.createElement("td"); c2.className = "col-plot";
        var track = document.createElement("div"); track.className = "track"; track.setAttribute("aria-hidden", "true");
        var zero = document.createElement("i"); zero.className = "zero"; zero.style.left = xs(0) + "%"; track.appendChild(zero);
        var bar = document.createElement("i"); bar.className = "bar";
        bar.style.left = xs(v[0] - 1.96 * v[1]) + "%"; bar.style.width = (xs(v[0] + 1.96 * v[1]) - xs(v[0] - 1.96 * v[1])) + "%"; track.appendChild(bar);
        var dot = document.createElement("i"); dot.className = "dot dot-" + g + " plot-dot";
        dot.style.left = xs(v[0]) + "%"; track.appendChild(dot);
        c2.appendChild(track); tr.appendChild(c2);
        if (!reduced) {     // start every range at zero, then let it travel to its estimate
          bar.dataset.l = bar.style.left; bar.dataset.w = bar.style.width; dot.dataset.l = dot.style.left;
          bar.style.left = xs(0) + "%"; bar.style.width = "0%"; dot.style.left = xs(0) + "%";
          tr.style.setProperty("--d", i * 70 + "ms"); tr.classList.add("row-in");
        }
        var c3 = document.createElement("td"); c3.className = "num";
        c3.innerHTML = ""; var eff = document.createElement("strong"); eff.textContent = fmt(v[0], 3); c3.appendChild(eff);
        var gr = document.createElement("span"); gr.className = "grade"; gr.textContent = gradeText[g]; c3.appendChild(gr);
        tr.appendChild(c3);
        var c4 = document.createElement("td"); c4.className = "num col-range"; c4.textContent = fmt(v[0] - 1.96 * v[1], 3) + " to " + fmt(v[0] + 1.96 * v[1], 3); tr.appendChild(c4);
        var c5 = document.createElement("td"); c5.className = "num col-n"; c5.textContent = r.n.toLocaleString("en-US"); tr.appendChild(c5);
        tbody.appendChild(tr);
      });
      axis.innerHTML = "";
      for (var t = lo; t <= hi + 1e-9; t += step) {
        var tv = Math.round(t * 1000) / 1000, s = document.createElement("span");
        s.textContent = tv === 0 ? "0" : (tv > 0 ? "+" : "\u2212") + Math.abs(tv).toFixed(2);
        s.style.left = xs(tv) + "%"; axis.appendChild(s);
      }
      if (!reduced) requestAnimationFrame(function () { requestAnimationFrame(function () {
        if (!robSeen) return;
        Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (tr) {
          tr.classList.add("shown");
          var bb = tr.querySelector(".bar"), dd = tr.querySelector(".plot-dot");
          if (bb && bb.dataset.l) { bb.style.left = bb.dataset.l; bb.style.width = bb.dataset.w; dd.style.left = dd.dataset.l; }
        });
      }); });
      var cap = document.createElement("span"); cap.className = "axis-title";
      cap.textContent = unit === "sd" ? "Effect per point, as a share of the spread of opinions" : "Effect per point, in score points (0\u20136 scale)";
      axis.appendChild(cap);
    }
    draw();
    onView(tbody, function () { robSeen = true; draw(); });
  })();

  /* ---------------- quiz: validation and feedback (nothing is sent) ---------------- */
  (function quiz() {
    var forms = document.querySelectorAll("form[data-quiz]");
    Array.prototype.forEach.call(forms, function (f) {
      var fb = f.querySelector(".feedback"), model = f.querySelector(".model");
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        fb.className = "feedback"; void fb.offsetWidth;   // restarts the feedback animation
        var q = f.getAttribute("data-quiz");
        if (q === "1") {
          var pick = f.querySelector("input[name=q1]:checked");
          if (!pick) { fb.textContent = "Pick one answer first."; fb.classList.add("no"); return; }
          var ok = pick.value === "c";
          fb.textContent = ok ? "Correct." : "Not quite. Think about what happens in the same calendar week in the other country.";
          fb.classList.add(ok ? "ok" : "no");
          if (ok) model.hidden = false;
        } else if (q === "2") {
          var inp = f.querySelector("#q2");
          var raw = inp.value.trim().replace(",", ".").replace("−", "-");
          var x = Number(raw);
          if (raw === "" || !/^[-+]?\d*\.?\d+$/.test(raw) || Math.abs(x) > 6) {
            inp.setAttribute("aria-invalid", "true");
            fb.textContent = "Please enter a number between −6 and 6, for example 0.12.";
            fb.classList.add("no"); inp.focus(); return;
          }
          inp.removeAttribute("aria-invalid");
          var good = Math.abs(x - 0.16) <= 0.011;
          fb.textContent = good ? "Correct: +0.16." : "Not quite. Add up all three parts, each multiplied by its scale value.";
          fb.classList.add(good ? "ok" : "no");
          model.hidden = false;
        } else {
          var ta = f.querySelector("#q3");
          var words = ta.value.trim().split(/\s+/).filter(Boolean).length;
          if (words < 15) {
            ta.setAttribute("aria-invalid", "true");
            fb.textContent = "Write a little more first (at least 15 words), then compare with the model answer.";
            fb.classList.add("no"); ta.focus(); return;
          }
          ta.removeAttribute("aria-invalid");
          fb.textContent = "Here is one possible answer. Did you name the omitted variable, γ, δ and the direction?";
          model.hidden = false;
        }
      });
    });
  })();
})();

/* ---------------- consent-gated analytics (off unless configured) ---------------- */
(function analytics() {
  "use strict";
  var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.analytics) || {};
  if (!cfg.provider || !cfg.code) return;           // nothing to ask about: no banner, no tracking
  var KEY = "dtp-analytics-consent";
  var banner = document.getElementById("consent"), reopen = document.getElementById("consent-reopen");
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: ask again next time */ } }
  function load() {
    if (cfg.provider === "goatcounter") {
      var s = document.createElement("script");
      s.async = true; s.src = "https://gc.zgo.at/count.js";
      s.setAttribute("data-goatcounter", "https://" + cfg.code + ".goatcounter.com/count");
      document.body.appendChild(s);
    }
  }
  if (reopen) { reopen.hidden = false; reopen.addEventListener("click", function () { banner.hidden = false; }); }
  var c = get();
  if (c === "yes") load();
  else if (c !== "no" && banner) banner.hidden = false;
  if (banner) banner.addEventListener("click", function (e) {
    var v = e.target.getAttribute && e.target.getAttribute("data-consent");
    if (!v) return;
    set(v); banner.hidden = true;
    if (v === "yes") load();
  });
})();
