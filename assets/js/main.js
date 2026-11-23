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
    ".cut", ".try-head > *", ".calc > *", ".sure-head > *", ".sure-body > *", ".quiz-pic",
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
        node.classList.add("rise");
        node.style.setProperty("--d", Math.min(i, 8) * 70 + "ms");
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
      el("rect", { x: x.toFixed(1), y: y.toFixed(1), width: s + 2, height: s + 2, fill: fill }, g);
    }
    if (narrow) svg.setAttribute("viewBox", "0 0 900 200");
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
        el("rect", { x: x, y: y, width: cw - 3, height: ch - 3, fill: on ? C.ink : "rgba(0,0,0,0.18)" }, g);
      }
    }
    // 2022: October starts on Saturday (Canadian Thanksgiving Mon 10 Oct); November starts Tuesday (US Thu 24 Nov)
    month(18, "October", 5, 31, 10);
    month(160, "November", 1, 30, 24);
    txt(g, 18, 186, "Canada", { "font-size": 14, fill: C.ink });
    txt(g, 160, 186, "United States", { "font-size": 14, fill: C.ink });
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
    function draw() {
      clear(svg);
      var d = R[state.measure][state.sample];
      var small = svg.getBoundingClientRect().width < 520;
      var W = small ? 420 : 720, H = small ? 340 : 380, L = small ? 58 : 70, Rr = small ? 8 : 20, T = 30, B = 60;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var lo = Math.min.apply(null, d.b.map(function (b, i) { return b - 1.96 * d.se[i]; }));
      var hi = Math.max.apply(null, d.b.map(function (b, i) { return b + 1.96 * d.se[i]; }));
      var pad = (hi - lo) * 0.08; lo = Math.min(lo - pad, -0.02); hi = Math.max(hi + pad, 0.02);
      var xs = function (i) { return L + (i + 0.5) * (W - L - Rr) / d.week.length; };
      var ys = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
      var pct = state.measure === "discussion";
      // axis ticks
      var step = (hi - lo) > 0.25 ? 0.1 : 0.05;
      for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
        var lab = pct ? Math.round(v * 100) + " pp" : v.toFixed(2);
        txt(svg, L - 12, ys(v) + 5, lab.replace("-", "−"), { "text-anchor": "end", "font-size": 14 });
      }
      el("rect", { x: L, y: ys(0) - 1, width: W - L - Rr, height: 2, fill: C.ink }, svg);
      // Thanksgiving week band
      var bw = (W - L - Rr) / d.week.length;
      el("rect", { x: xs(2) - bw / 2, y: T, width: bw, height: H - T - B, fill: C.mint }, svg);
      txt(svg, xs(2), T - 10, "Thanksgiving week", { "text-anchor": "middle", "font-size": 14, "font-weight": 600 });
      d.week.forEach(function (w, i) {
        var b = d.b[i], se = d.se[i], x = xs(i);
        if (se > 0) el("rect", { x: x - 2, y: ys(b + 1.96 * se), width: 4, height: Math.max(2, ys(b - 1.96 * se) - ys(b + 1.96 * se)), fill: C.ink }, svg);
        var c = el("circle", { class: "mark", style: "--md:" + i * 60 + "ms", cx: x, cy: ys(b), r: i === 2 ? 9 : 7, fill: i === 2 ? C.orange : C.ink, stroke: C.ink, "stroke-width": 2 }, svg);
        var tl = el("title", {}, c);
        tl.textContent = "Week " + w + ": " + (pct ? (b * 100).toFixed(1) + " percentage points" : b.toFixed(3)) + (se > 0 ? " (95% range " + (pct ? ((b - 1.96 * se) * 100).toFixed(1) + " to " + ((b + 1.96 * se) * 100).toFixed(1) : (b - 1.96 * se).toFixed(3) + " to " + (b + 1.96 * se).toFixed(3)) + ")" : " (reference week)");
        var wl = w === -2 ? (small ? "−2+" : "−2 or earlier") : w === 3 ? (small ? "+3+" : "+3 or later") : (w > 0 ? "+" : w < 0 ? "−" : "") + Math.abs(w);
        txt(svg, x, H - B + 26, wl, { "text-anchor": "middle", "font-size": 14 });
      });
      txt(svg, L + (W - L - Rr) / 2, H - 8, "Weeks relative to Thanksgiving", { "text-anchor": "middle", "font-size": 14 });
      caption.textContent = captions[state.measure];
      var live = document.getElementById("chart-data");
      if (live) live.textContent = state.sample + ", " + (pct ? "talking politics" : "pull of the family") + ": " + d.week.map(function (w, i) {
        return "week " + w + " " + (pct ? (d.b[i] * 100).toFixed(1) + " percentage points" : d.b[i].toFixed(3));
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
    var t1; window.addEventListener("resize", function () { clearTimeout(t1); t1 = setTimeout(draw, 150); });
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
    Array.prototype.forEach.call(cells, function (c) {
      var sh = dist[c.getAttribute("data-v")] || 0;
      c.style.setProperty("--h", Math.round(sh / maxShare * 100) + "%");
      c.setAttribute("title", Math.round(sh * 100) + "% of families at " + c.getAttribute("data-v"));
    });
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
      rf.textContent = fmt(est);
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
  })();

  /* ---------------- robustness: checks, unit, chart and table ---------------- */
  (function robustness() {
    var box = document.getElementById("checks"), svg = document.getElementById("forest");
    var tbody = document.querySelector("#rob-table tbody");
    if (!box || !svg || !tbody) return;
    var rows = R.robustness;
    var unit = "sd";
    var shown = {};
    rows.forEach(function (r, i) {
      shown[r.spec] = i < 5;
      var id = "chk-" + i;
      var lab = document.createElement("label");
      lab.setAttribute("for", id);
      var inp = document.createElement("input");
      inp.type = "checkbox"; inp.id = id; inp.checked = shown[r.spec]; inp.disabled = r.spec === "Baseline";
      inp.addEventListener("change", function () { shown[r.spec] = inp.checked; draw(); });
      lab.appendChild(inp);
      lab.appendChild(document.createTextNode(r.spec));
      box.appendChild(lab);
    });
    var ubtns = document.querySelectorAll("[data-unit]");
    Array.prototype.forEach.call(ubtns, function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(ubtns, function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        unit = b.getAttribute("data-unit"); draw();
      });
    });
    function verdict(p) { return p < 0.05 ? "Yes" : p < 0.10 ? "Borderline" : "No"; }
    function draw() {
      var list = rows.filter(function (r) { return shown[r.spec]; });
      var val = function (r) { return unit === "sd" ? [r.b_sd, r.se_sd] : [r.b, r.se]; };
      var d = unit === "sd" ? 3 : 3;
      // table
      tbody.innerHTML = "";
      list.forEach(function (r) {
        var v = val(r), tr = document.createElement("tr");
        var c1 = document.createElement("td");
        var nm = document.createElement("strong"); nm.textContent = r.spec; c1.appendChild(nm);
        var ab = document.createElement("span"); ab.className = "about-check"; ab.textContent = r.about; c1.appendChild(ab);
        tr.appendChild(c1);
        [fmt(v[0], d), fmt(v[0] - 1.96 * v[1], d) + " to " + fmt(v[0] + 1.96 * v[1], d), verdict(r.p_wild), r.n.toLocaleString("en-US")].forEach(function (s) {
          var td = document.createElement("td"); td.textContent = s; tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      // forest chart
      clear(svg);
      var small = svg.getBoundingClientRect().width < 520;
      var W = small ? 400 : 640, rowH = 38, T = 20, B = 44, L = small ? 128 : 170, Rr = small ? 10 : 24;
      var H = T + B + rowH * list.length; svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var lo = 0, hi = 0;
      list.forEach(function (r) { var v = val(r); lo = Math.min(lo, v[0] - 1.96 * v[1]); hi = Math.max(hi, v[0] + 1.96 * v[1]); });
      var pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
      var xs = function (x) { return L + (x - lo) / (hi - lo) * (W - L - Rr); };
      el("rect", { x: xs(0) - 1, y: T - 6, width: 2, height: rowH * list.length + 6, fill: C.ink }, svg);
      list.forEach(function (r, i) {
        var v = val(r), y = T + rowH * i + rowH / 2;
        txt(svg, 0, y + 5, r.spec, { "font-size": 14, "font-weight": r.spec === "Baseline" ? 600 : 400 });
        el("rect", { x: xs(v[0] - 1.96 * v[1]), y: y - 3, width: Math.max(2, xs(v[0] + 1.96 * v[1]) - xs(v[0] - 1.96 * v[1])), height: 6, fill: C.mid }, svg);
        var c = el("circle", { class: "mark", style: "--md:" + i * 60 + "ms", cx: xs(v[0]), cy: y, r: 8, fill: r.spec === "Placebo week" ? C.bg : r.p_wild < 0.05 ? C.ink : C.mid, stroke: C.ink, "stroke-width": 2 }, svg);
        el("title", {}, c).textContent = r.spec + ": " + fmt(v[0], 3);
      });
      var ticks = unit === "sd" ? [-0.04, 0, 0.04, 0.08] : [-0.04, 0, 0.04, 0.08];
      ticks.forEach(function (t) {
        if (t < lo || t > hi) return;
        txt(svg, xs(t), H - B + 26, t === 0 ? "0" : (t > 0 ? "+" : "−") + Math.abs(t).toFixed(2), { "text-anchor": "middle", "font-size": 14 });
      });
      txt(svg, L + (W - L - Rr) / 2, H - 6, unit === "sd" ? (small ? "Share of the spread of opinions" : "Effect per point, as a share of the spread of opinions") : (small ? "Score points (0–6 scale)" : "Effect per point, in score points (0–6 scale)"), { "text-anchor": "middle", "font-size": 14 });
    }
    draw();
    var t2; window.addEventListener("resize", function () { clearTimeout(t2); t2 = setTimeout(draw, 150); });
  })();

  /* ---------------- quiz: validation and feedback (nothing is sent) ---------------- */
  (function quiz() {
    var forms = document.querySelectorAll("form[data-quiz]");
    Array.prototype.forEach.call(forms, function (f) {
      var fb = f.querySelector(".feedback"), model = f.querySelector(".model");
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        fb.className = "feedback";
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
