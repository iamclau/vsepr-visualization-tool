// VSEPR Visualization Tool
// Sections: shape data and slot geometry -> chart -> 3D builder (three.js) ->
// facts panel -> Lewis structure solver (one central atom) -> 2D Lewis drawing ->
// solver 3D view -> full screen -> controls.
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const SUBS = { "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆" };
  const axe = (b, e) => "A" + (b ? "X" + (b > 1 ? SUBS[b] : "") : "") + (e ? "E" + (e > 1 ? SUBS[e] : "") : "");

  // ---------- Data ----------
  const EG = { 2: "Linear", 3: "Trigonal planar", 4: "Tetrahedral", 5: "Trigonal bipyramidal", 6: "Octahedral" };
  const HYB = { 2: "sp", 3: "sp²", 4: "sp³", 5: "sp³d", 6: "sp³d²" };
  const EGANG = { 2: "180°", 3: "120°", 4: "109.5°", 5: "90°, 120°", 6: "90°" };
  // key = domains-lonepairs. lab: textbook angle label for each IDEAL angle (rounded)
  const SH = {
    "2-0": { name: "Linear", ang: "180°", lab: { 180: "180°" }, polar: false, ex: [["CO₂", "C", "O"], ["BeCl₂", "Be", "Cl"], ["HCN", "C", ["H", "N"]]] },
    "3-0": { name: "Trigonal planar", ang: "120°", lab: { 120: "120°" }, polar: false, ex: [["BF₃", "B", "F"], ["SO₃", "S", "O"], ["CH₂O", "C", ["O", "H", "H"]]] },
    "3-1": { name: "Bent", ang: "<120° (≈117°)", lab: { 120: "≈117°" }, polar: true, ex: [["SO₂", "S", "O"], ["O₃", "O", "O"], ["NO₂⁻", "N", "O"]] },
    "4-0": { name: "Tetrahedral", ang: "109.5°", lab: { 109: "109.5°" }, polar: false, ex: [["CH₄", "C", "H"], ["CCl₄", "C", "Cl"], ["NH₄⁺", "N", "H"]] },
    "4-1": { name: "Trigonal pyramidal", ang: "<109.5° (≈107°)", lab: { 109: "≈107°" }, polar: true, ex: [["NH₃", "N", "H"], ["PCl₃", "P", "Cl"], ["H₃O⁺", "O", "H"]] },
    "4-2": { name: "Bent", ang: "<109.5° (≈104.5°)", lab: { 109: "≈104.5°" }, polar: true, ex: [["H₂O", "O", "H"], ["OF₂", "O", "F"], ["NH₂⁻", "N", "H"]] },
    "5-0": { name: "Trigonal bipyramidal", ang: "90°, 120°, 180°", lab: { 90: "90°", 120: "120°", 180: "180°" }, polar: false, ex: [["PCl₅", "P", "Cl"], ["PF₅", "P", "F"]] },
    "5-1": { name: "Seesaw", ang: "<90°, <120° (≈87°, ≈102°)", lab: { 90: "≈87°", 120: "≈102°", 180: "≈173°" }, polar: true, ex: [["SF₄", "S", "F"], ["SeF₄", "Se", "F"]] },
    "5-2": { name: "T-shaped", ang: "<90° (≈87.5°)", lab: { 90: "≈87.5°", 180: "≈175°" }, polar: true, ex: [["ClF₃", "Cl", "F"], ["BrF₃", "Br", "F"]] },
    "5-3": { name: "Linear", ang: "180°", lab: { 180: "180°" }, polar: false, ex: [["XeF₂", "Xe", "F"], ["I₃⁻", "I", "I"]] },
    "6-0": { name: "Octahedral", ang: "90°, 180°", lab: { 90: "90°", 180: "180°" }, polar: false, ex: [["SF₆", "S", "F"], ["PF₆⁻", "P", "F"]] },
    "6-1": { name: "Square pyramidal", ang: "<90° (≈85°)", lab: { 90: "≈85–90°", 180: "≈170°" }, polar: true, ex: [["BrF₅", "Br", "F"], ["IF₅", "I", "F"]] },
    "6-2": { name: "Square planar", ang: "90°, 180°", lab: { 90: "90°", 180: "180°" }, polar: false, ex: [["XeF₄", "Xe", "F"], ["ICl₄⁻", "I", "Cl"]] },
    "6-3": { name: "T-shaped", ang: "<90°", lab: { 90: "<90°", 180: "≈180°" }, polar: true, ex: [], rare: true },
    "6-4": { name: "Linear", ang: "180°", lab: { 180: "180°" }, polar: false, ex: [], rare: true }
  };
  const CPK = { H: 0xffffff, B: 0xffb5b5, Be: 0xc2ff00, C: 0x555555, N: 0x3050f8, O: 0xff2a2a, F: 0x90e050, Cl: 0x1ff01f, Br: 0xa62929, I: 0x940094, S: 0xffff30, P: 0xff8000, Xe: 0x429eb0, Se: 0xffa100 };
  const A_COL = 0x9aa4b5, X_COL = 0xe8eef7;

  // Domain directions for each steric number, and the order lone pairs fill them
  const SLOTS = {
    1: [[0, 0, 1]],
    2: [[0, 0, 1], [0, 0, -1]],
    3: [[0, 0, 1], [0.866, 0, -0.5], [-0.866, 0, -0.5]],
    4: [[0, 0, 1], [0.9428, 0, -0.3333], [-0.4714, 0.8165, -0.3333], [-0.4714, -0.8165, -0.3333]],
    5: [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]],
    6: [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]]
  };
  const LPORDER = { 1: [0], 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [2, 3, 4, 0, 1], 6: [0, 1, 2, 3, 4, 5] };
  const EDGES = (() => {
    const all = n => { const e = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) e.push([i, j]); return e; };
    return { 1: [], 2: [[0, 1]], 3: all(3), 4: all(4), 5: [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [4, 2]], 6: all(6).filter(([i, j]) => !((i === 0 && j === 1) || (i === 2 && j === 3) || (i === 4 && j === 5))) };
  })();

  const titleCase = t => t.replace(/(^|[\s-])([a-z])/g, (m, a, c) => a + c.toUpperCase());
  // "Trigonal Bipyramidal – Seesaw": electron geometry, then molecular geometry (one name when they match)
  function viewTitle(b, e) {
    const info = shapeInfo(b, e);
    if (!info.key) return info.name;
    return e ? `${titleCase(EG[b + e])} – ${titleCase(info.name)}` : titleCase(info.name);
  }
  function shapeInfo(b, e) {
    const sn = b + e;
    if (sn === 0) return { name: "Central atom only", key: null };
    if (b === 0) return { name: "No bonded atoms", key: null };
    if (b === 1) return { name: "Linear (two atoms)", key: null, note: "Two atoms always make a straight line." };
    const key = sn + "-" + e;
    return SH[key] ? { ...SH[key], key } : { name: "—", key: null };
  }

  // Lone pairs repel more than bonds: relax domain directions on a sphere
  function relax(dirs, isLP, on) {
    const p = dirs.map(v => v.slice());
    if (!on || !isLP.some(x => x) || p.length < 3) return p;
    const W = [1, 1.25, 1.6];
    for (let it = 0; it < 700; it++) {
      const f = p.map(() => [0, 0, 0]);
      for (let i = 0; i < p.length; i++) for (let j = 0; j < p.length; j++) {
        if (i === j) continue;
        const d = [p[i][0] - p[j][0], p[i][1] - p[j][1], p[i][2] - p[j][2]], r = Math.hypot(d[0], d[1], d[2]) || 1e-6;
        const w = isLP[i] && isLP[j] ? W[2] : (isLP[i] || isLP[j] ? W[1] : W[0]);
        const s = w / Math.pow(r, 3);
        for (let a = 0; a < 3; a++) f[i][a] += s * d[a] / r;
      }
      for (let i = 0; i < p.length; i++) { for (let a = 0; a < 3; a++) p[i][a] += 0.004 * f[i][a]; const n = Math.hypot(p[i][0], p[i][1], p[i][2]); for (let a = 0; a < 3; a++) p[i][a] /= n; }
    }
    return p;
  }

  // ---------- Chart ----------
  const chart = $("chart");
  const cellEls = {};
  function drawThumb(cv, sn, e) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), S = 150 * dpr;
    cv.width = cv.height = S;
    const ctx = cv.getContext("2d"), dark = true;
    const slots = SLOTS[sn], lpSet = new Set(LPORDER[sn].slice(0, e));
    const isLP = slots.map((_, i) => lpSet.has(i));
    const dirs = relax(slots, isLP, true);
    const yaw = -0.75, pitch = 0.32, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const proj = (v, L) => { const x = v[0] * L, y = v[1] * L, z = v[2] * L; const x1 = x * cy - y * sy, y1 = x * sy + y * cy; return [S / 2 + x1 * S * 0.26, S / 2 - (y1 * sp + z * cp) * S * 0.26, y1 * cp - z * sp]; };
    const items = dirs.map((d, i) => ({ d, lp: isLP[i], p: proj(d, isLP[i] ? 1.05 : 1.55) })).sort((a, b) => b.p[2] - a.p[2]);
    const c0 = proj([0, 0, 0], 0);
    const center = () => { ctx.fillStyle = dark ? "#9aa4b5" : "#6b7484"; ctx.beginPath(); ctx.arc(c0[0], c0[1], S * 0.085, 0, 7); ctx.fill(); };
    let drewC = false;
    items.forEach(it => {
      if (!drewC && it.p[2] < 0) { center(); drewC = true; }
      if (it.lp) {
        ctx.fillStyle = "rgba(227,162,26,0.55)"; ctx.beginPath();
        const ang = Math.atan2(it.p[1] - c0[1], it.p[0] - c0[0]);
        ctx.ellipse((it.p[0] + c0[0]) / 2 + (it.p[0] - c0[0]) * 0.25, (it.p[1] + c0[1]) / 2 + (it.p[1] - c0[1]) * 0.25, S * 0.13, S * 0.075, ang, 0, 7); ctx.fill();
      } else {
        ctx.strokeStyle = dark ? "#8fa0b8" : "#7d8798"; ctx.lineWidth = 2.2 * dpr; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(it.p[0], it.p[1]); ctx.stroke();
        ctx.fillStyle = dark ? "#e8eef7" : "#ffffff"; ctx.strokeStyle = dark ? "#b8c4d6" : "#3a4558"; ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath(); ctx.arc(it.p[0], it.p[1], S * 0.07, 0, 7); ctx.fill(); ctx.stroke();
      }
    });
    if (!drewC) center();
  }
  function buildChart() {
    chart.innerHTML = "";
    const corner = document.createElement("div"); corner.className = "corner"; corner.innerHTML = ""; chart.appendChild(corner);
    for (let e = 0; e <= 4; e++) { const h = document.createElement("div"); h.className = "colhead"; h.textContent = e + " lone pair" + (e === 1 ? "" : "s"); chart.appendChild(h); }
    for (let sn = 2; sn <= 6; sn++) {
      const rh = document.createElement("div"); rh.className = "rowhead";
      rh.innerHTML = `<b>${sn} domains</b><span>${EG[sn]}</span>`;
      chart.appendChild(rh);
      for (let e = 0; e <= 4; e++) {
        const key = sn + "-" + e, s = SH[key];
        if (!s) { const em = document.createElement("div"); em.className = "empty";  chart.appendChild(em); continue; }
        const b = sn - e;
        const btn = document.createElement("button"); btn.type = "button"; btn.className = "shape" + (s.rare ? " rare" : "");
        btn.innerHTML = `<canvas></canvas><span class="nm">${s.name}</span>`;
        btn.title = `${s.name} (${axe(b, e)}): ${b} bonded atoms, ${e} lone pair${e === 1 ? "" : "s"}. Click to watch it build.`;
        btn.addEventListener("click", () => choose(b, e, true));
        chart.appendChild(btn);
        drawThumb(btn.querySelector("canvas"), sn, e);
        cellEls[key] = btn;
      }
    }
  }

  // ---------- 3D ----------
  const HAS3 = typeof THREE !== "undefined" && (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (err) { return false; } })();
  const V = { az: -0.9, el: 0.32, dist: 6.3, zoom: 1, auto: true };
  const BOND_L = 1.65;
  let renderer, scene, camera, root, egLines, angGroup;
  const ST = { domains: [], ex: -1, custom: null, pendingCustom: null, opts: { lp: true, eg: true, ang: true, lab: true, sq: true }, anim: null, playTimer: null, caption: "" };

  if (HAS3) {
    const canvas = $("cv");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 1);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); camera.up.set(0, 0, 1);
    scene.add(camera);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(2, 3, 4); camera.add(key);
    const rim = new THREE.DirectionalLight(0x9fb4ff, 0.3); rim.position.set(-3, -1, -2); camera.add(rim);
    root = new THREE.Group(); scene.add(root);
    ST.center = new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 30), new THREE.MeshPhongMaterial({ color: A_COL, shininess: 60 }));
    root.add(ST.center);
    egLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.55, dashSize: 0.12, gapSize: 0.08 }));
    root.add(egLines);
    angGroup = new THREE.Group(); root.add(angGroup);
    const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    new ResizeObserver(resize).observe(canvas); resize();
    let drag = null;
    canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", e => { if (!drag) return; V.az -= (e.clientX - drag.x) * 0.01; V.el = Math.max(-1.5, Math.min(1.5, V.el + (e.clientY - drag.y) * 0.01)); drag = { x: e.clientX, y: e.clientY }; });
    const end = () => { drag = null; }; canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("wheel", e => { e.preventDefault(); V.zoom = Math.max(0.4, Math.min(2.5, V.zoom * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
    V.dragging = () => !!drag;
  } else $("noGL").hidden = false;

  const geo = HAS3 ? {
    atom: new THREE.SphereGeometry(0.3, 32, 24),
    bond: new THREE.CylinderGeometry(0.075, 0.075, 1, 16),
    lobe: new THREE.SphereGeometry(1, 40, 30),
    dot: new THREE.SphereGeometry(0.055, 12, 10)
  } : null;

  // outer symbol for the i-th bonded atom (examples can mix outer atoms, like HCN)
  function outerSym(ex, i) { return Array.isArray(ex[2]) ? ex[2][i % ex[2].length] : ex[2]; }
  function outerColor(i) { const ex = currentExample(); const sym = ex && outerSym(ex, i); return sym && CPK[sym] !== undefined ? CPK[sym] : X_COL; }
  function centerColor() { const ex = currentExample(); return ex && CPK[ex[1]] !== undefined ? CPK[ex[1]] : A_COL; }
  // Atom labels/colors stay generic (A, X) unless the user picks an example molecule.
  function currentExample() {
    if (ST.playTimer) return null;
    if (ST.custom) return ST.custom;
    const info = shapeInfo(nB(), nE()); if (ST.ex < 0 || !info.ex || !info.ex.length) return null;
    return info.ex[Math.min(ST.ex, info.ex.length - 1)];
  }
  const nB = () => ST.domains.filter(d => d.type === "b").length;
  const nE = () => ST.domains.filter(d => d.type === "e").length;

  function makeDomain(type) {
    const d = { type, dir: new THREE.Vector3(0, 0, 1), from: null, to: null, grow: 0, growT: 0 };
    if (!HAS3) return d;
    if (type === "b") {
      d.atom = new THREE.Mesh(geo.atom, new THREE.MeshPhongMaterial({ color: X_COL, shininess: 60 }));
      d.stick = new THREE.Mesh(geo.bond, new THREE.MeshPhongMaterial({ color: 0x8fa0b8, shininess: 40 }));
      root.add(d.atom, d.stick);
    } else {
      d.lobe = new THREE.Mesh(geo.lobe, new THREE.MeshPhongMaterial({ color: 0xffcf5a, transparent: true, opacity: 0.42, depthWrite: false, shininess: 30 }));
      d.dots = [new THREE.Mesh(geo.dot, new THREE.MeshBasicMaterial({ color: 0xfff1c4 })), new THREE.Mesh(geo.dot, new THREE.MeshBasicMaterial({ color: 0xfff1c4 }))];
      root.add(d.lobe, ...d.dots);
    }
    return d;
  }
  function disposeDomain(d) { if (!HAS3) return; [d.atom, d.stick, d.lobe, ...(d.dots || [])].forEach(o => o && root.remove(o)); }

  // assign each domain a slot: lone pairs take the lone-pair slots in order, bonds the nearest remaining slots
  function assign(animate) {
    const sn = ST.domains.length;
    ST.groups = []; ST.edges = [];
    if (!sn) return;
    const slots = SLOTS[sn].map(v => new THREE.Vector3(...v));
    const lps = ST.domains.filter(d => d.type === "e"), bonds = ST.domains.filter(d => d.type === "b");
    const order = LPORDER[sn], used = new Set();
    lps.forEach((d, i) => { d.slot = order[i]; used.add(order[i]); });
    // bonds: greedy nearest
    const free = slots.map((s, i) => i).filter(i => !used.has(i));
    const pending = bonds.slice();
    while (pending.length) {
      let best = null;
      pending.forEach((d, bi) => free.forEach((si, fi) => { const dd = d.placed ? d.dir.distanceTo(slots[si]) : 10; if (!best || dd < best.dd) best = { bi, fi, dd }; }));
      const d = pending.splice(best.bi, 1)[0]; d.slot = free.splice(best.fi, 1)[0];
    }
    const ideal = ST.domains.map(d => SLOTS[sn][d.slot]);
    const relaxed = relax(ideal, ST.domains.map(d => d.type === "e"), ST.opts.sq);
    ST.domains.forEach((d, i) => {
      const target = new THREE.Vector3(...relaxed[i]).normalize();
      if (!d.placed || !animate) { d.from = target.clone(); d.dir.copy(target); }
      else d.from = d.dir.clone();
      d.to = target; d.placed = true;
    });
    ST.anim = animate ? { t: 0, dur: 650 } : null;
    // electron-geometry edges (by slot) and angle groups (by ideal angle)
    const bySlot = {}; ST.domains.forEach(d => { bySlot[d.slot] = d; });
    ST.edges = EDGES[sn].map(([a, b]) => [bySlot[a], bySlot[b]]);
    const info = shapeInfo(bonds.length, lps.length);
    if (bonds.length >= 2) {
      const groups = {};
      for (let i = 0; i < bonds.length; i++) for (let j = i + 1; j < bonds.length; j++) {
        const a = SLOTS[sn][bonds[i].slot], b = SLOTS[sn][bonds[j].slot];
        const ang = Math.round(Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI);
        const k = ang >= 178 ? 180 : ang >= 118 ? 120 : ang >= 108 ? 109 : 90;
        if (!groups[k]) groups[k] = [bonds[i], bonds[j]];
      }
      const ks = Object.keys(groups).map(Number);
      ks.forEach(k => { if (k === 180 && ks.length > 1) return; ST.groups.push({ a: groups[k][0], b: groups[k][1], label: (info.lab && info.lab[k]) || (k === 109 ? "109.5°" : k + "°") }); });
    }
  }

  function setDomains(list, animate) {
    // list: array of 'b' / 'e' in desired order; reuse existing objects when possible
    const keep = [], pool = { b: ST.domains.filter(d => d.type === "b"), e: ST.domains.filter(d => d.type === "e") };
    list.forEach(t => { const d = pool[t].shift(); if (d) keep.push(d); else { const nd = makeDomain(t); nd.grow = animate ? 0 : 1; nd.growT = animate ? 1 : 0; keep.push(nd); } });
    pool.b.concat(pool.e).forEach(disposeDomain);
    ST.domains = keep;
    assign(animate);
    refreshInfo();
  }
  const listFor = (b, e) => Array(b).fill("b").concat(Array(e).fill("e"));
  function add(type) { if (ST.domains.length >= 6) return; stopPlay(); setDomains(ST.domains.map(d => d.type).concat(type), true); caption(type === "b" ? "Bonded atom added." : "Lone pair added. It pushes the bonded atoms closer together."); }
  function remove(type) { const i = ST.domains.map(d => d.type).lastIndexOf(type); if (i < 0) return; stopPlay(); const l = ST.domains.map(d => d.type); l.splice(i, 1); setDomains(l, true); caption(""); }

  // ---------- Build animation ----------
  function stopPlay() { if (ST.playTimer) { clearTimeout(ST.playTimer); ST.playTimer = null; } $("play").textContent = "▶ Watch it build"; }
  function playBuild(b, e) {
    stopPlay();
    setDomains([], false);
    const steps = [];
    for (let i = 1; i <= b; i++) steps.push(["b", i, 0]);
    for (let j = 1; j <= e; j++) steps.push(["e", b, j]);
    caption("Start with the central atom.");
    $("play").textContent = "■ Stop";
    let k = 0;
    const next = () => {
      if (k >= steps.length) { const info = shapeInfo(b, e); caption(e ? `${b + e} domains → ${EG[b + e].toLowerCase()} arrangement. ${e} lone pair${e === 1 ? "" : "s"} → ${info.name.toLowerCase()} shape.` : `${b} domains → ${info.name.toLowerCase()} shape.`); stopPlay(); if (ST.pendingCustom) { ST.custom = ST.pendingCustom; ST.pendingCustom = null; } refreshInfo(); return; }
      const [t, bb, ee] = steps[k++];
      setDomains(listFor(bb, ee), true);
      const info = shapeInfo(bb, ee);
      caption(t === "b" ? `Step ${k}: add bonded atom ${bb} → ${info.name.toLowerCase()}` : `Step ${k}: add lone pair ${ee} → ${info.name.toLowerCase()}`);
      ST.playTimer = setTimeout(next, 1100);
    };
    ST.playTimer = setTimeout(next, 700);
  }
  function caption(t) { ST.caption = t; }

  // ---------- Selection / info ----------
  let target = { b: 2, e: 2 };
  function choose(b, e, animate) { target = { b, e }; ST.ex = -1; ST.custom = null; ST.pendingCustom = null; if (animate) playBuild(b, e); else { stopPlay(); setDomains(listFor(b, e), false); caption(""); } }

  function refreshInfo() {
    const b = nB(), e = nE(), sn = b + e, info = shapeInfo(b, e);
    Object.values(cellEls).forEach(c => c.classList.remove("sel"));
    if (info.key && cellEls[info.key]) cellEls[info.key].classList.add("sel");
    const ex = currentExample();
    $("oName").textContent = viewTitle(b, e);
    $("oAx").textContent = sn ? `${sn} domain${sn === 1 ? "" : "s"} (${b} bond${b === 1 ? "" : "s"}, ${e} lone pair${e === 1 ? "" : "s"})` + (ex ? ` · ${ex[0]}` : "") : "";
    const facts = [
      ["Electron domains", sn],
      ["Bonded atoms (X)", b],
      ["Lone pairs (E)", e],
      ["Notation", axe(b, e)],
      ["Electron geometry", EG[sn] || "—"],
      ["Molecular geometry", info.name],
      ["Bond angle", info.ang || (b === 1 ? "—" : "—")],
      ["Hybridization", HYB[sn] || "—"]
    ];
    $("factGrid").innerHTML = facts.map(([k, v]) => `<div class="fact"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("") +
      `<div class="fact"><div class="k">Polarity*</div><div class="v">${info.key ? (info.polar ? "Polar" : "Nonpolar") : "—"}</div></div>`;
    let why = "";
    if (sn === 0) why = "Add bonded atoms and lone pairs to the central atom.";
    else if (!info.key) why = info.note || "Add more domains to make a VSEPR shape.";
    else {
      why = `${sn} domains → <b>${EG[sn].toLowerCase()}</b> electron geometry. `;
      if (!e) why += `No lone pairs, so the molecular shape is also <b>${info.name.toLowerCase()}</b>.`;
      else {
        why += `${e} ${e === 1 ? "is a lone pair" : "are lone pairs"}. The shape is named from the atoms only, so it is <b>${info.name.toLowerCase()}</b>. `;
        if (sn === 5) why += "Lone pairs take the equatorial (middle) positions, which have more room.";
        else if (sn === 6 && e === 2) why += "The two lone pairs sit opposite each other, 180° apart.";
        else if (sn === 6 && e > 2) why += "Lone pairs fill opposite positions first.";
        else why += "Lone pairs take up more room than bonds, so the bond angles are smaller than " + EGANG[sn] + ".";
      }
    }
    $("why").innerHTML = why;
    const list = info.ex || [];
    $("exs").innerHTML = list.length ? `<span class="tag" style="color:var(--muted);font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Examples</span>` + list.map((x, i) => `<button type="button" data-i="${i}" class="${!ST.custom && i === ST.ex ? "on" : ""}">${x[0]}</button>`).join("") + `<span style="color:var(--muted);font-size:.75rem">Click one to label and color the atoms. *Polarity assumes all outer atoms are the same.</span>` : (info.rare ? `<span style="color:var(--muted)">Rare: very few real molecules have this shape.</span>` : "");
    $("exs").querySelectorAll("button").forEach(bt => bt.addEventListener("click", () => { ST.custom = null; ST.ex = ST.ex === +bt.dataset.i ? -1 : +bt.dataset.i; refreshInfo(); }));
    $("addB").disabled = $("addE").disabled = sn >= 6;
    $("remB").disabled = b === 0; $("remE").disabled = e === 0;
    // colors
    if (HAS3) {
      ST.center.material.color.setHex(centerColor());
      ST.domains.filter(d => d.type === "b").forEach((d, i) => d.atom.material.color.setHex(outerColor(i)));
    }
  }

  // ---------- Render loop ----------
  const UP = HAS3 ? new THREE.Vector3(0, 1, 0) : null;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (ST.anim) {
      ST.anim.t += dt * 1000; const k = ease(Math.min(1, ST.anim.t / ST.anim.dur));
      ST.domains.forEach(d => { d.dir.copy(d.from).lerp(d.to, k); if (d.dir.lengthSq() < 1e-6) d.dir.copy(d.to); d.dir.normalize(); });
      if (k >= 1) ST.anim = null;
    }
    ST.domains.forEach(d => { if (d.grow < 1) d.grow = Math.min(1, d.grow + dt * 2.4); });
    if (HAS3) {
      const o = ST.opts, tmp = new THREE.Vector3(), perp = new THREE.Vector3();
      ST.domains.forEach(d => {
        const g = d.grow, s = g < 1 ? 1 + 2.70158 * Math.pow(g - 1, 3) + 1.70158 * Math.pow(g - 1, 2) : 1;
        if (d.type === "b") {
          d.atom.position.copy(d.dir).multiplyScalar(BOND_L); d.atom.scale.setScalar(Math.max(0.001, s));
          d.stick.position.copy(d.dir).multiplyScalar(BOND_L / 2); d.stick.quaternion.setFromUnitVectors(UP, d.dir); d.stick.scale.set(1, BOND_L * Math.max(0.001, Math.min(1, g * 1.2)), 1);
        } else {
          const vis = o.lp;
          d.lobe.visible = vis; d.dots.forEach(x => { x.visible = vis; });
          d.lobe.position.copy(d.dir).multiplyScalar(0.72); d.lobe.quaternion.setFromUnitVectors(UP, d.dir);
          const sc = Math.max(0.001, s); d.lobe.scale.set(0.34 * sc, 0.55 * sc, 0.34 * sc);
          perp.set(0, 0, 1); if (Math.abs(d.dir.z) > 0.9) perp.set(1, 0, 0); perp.cross(d.dir).normalize().multiplyScalar(0.1 * sc);
          d.dots[0].position.copy(d.dir).multiplyScalar(0.85).add(perp); d.dots[1].position.copy(d.dir).multiplyScalar(0.85).sub(perp);
        }
      });
      // electron geometry wireframe
      const pts = [];
      if (o.eg) ST.edges.forEach(([a, b]) => { if (!a || !b) return; pts.push(a.dir.clone().multiplyScalar(BOND_L * Math.min(a.grow, 1)), b.dir.clone().multiplyScalar(BOND_L * Math.min(b.grow, 1))); });
      egLines.geometry.dispose(); egLines.geometry = new THREE.BufferGeometry().setFromPoints(pts); egLines.computeLineDistances();
      // angle arcs
      while (angGroup.children.length) { const c = angGroup.children.pop(); c.geometry.dispose(); }
      const labels = [];
      if (o.ang && !ST.anim) ST.groups.forEach(gp => {
        const u = gp.a.dir, v = gp.b.dir, arc = [], R = 0.78, ang = u.angleTo(v);
        for (let i = 0; i <= 24; i++) { const t = i / 24; const p = u.clone().multiplyScalar(Math.sin((1 - t) * ang)).add(v.clone().multiplyScalar(Math.sin(t * ang))).divideScalar(Math.sin(ang) || 1).normalize().multiplyScalar(R); arc.push(p); }
        if (ang > 3.1) { arc.length = 0; perp.set(0, 0, 1); if (Math.abs(u.z) > 0.9) perp.set(1, 0, 0); const w = perp.cross(u).normalize(); for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; arc.push(u.clone().multiplyScalar(Math.cos(t)).add(w.clone().multiplyScalar(Math.sin(t))).multiplyScalar(R)); } }
        angGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arc), new THREE.LineBasicMaterial({ color: 0x9fe3ff })));
        labels.push({ p: arc[12].clone().multiplyScalar(1.32), t: gp.label, cls: "ang" });
      });
      if (o.lab) {
        const ex = currentExample();
        labels.push({ p: new THREE.Vector3(0, 0, 0), t: ex ? ex[1] : "A" });
        let bi = -1; ST.domains.forEach(d => { if (d.type === "b") bi++; if (d.grow < 0.6) return; if (d.type === "b") labels.push({ p: d.dir.clone().multiplyScalar(BOND_L), t: ex ? outerSym(ex, bi) : "X" }); else if (o.lp) labels.push({ p: d.dir.clone().multiplyScalar(1.22), t: "E", cls: "lp" }); });
      }
      if (V.auto && !V.dragging()) V.az += dt * 0.3;
      V.dist += (6.3 * V.zoom - V.dist) * Math.min(1, dt * 6);
      const c = Math.cos(V.el);
      camera.position.set(V.dist * c * Math.cos(V.az), V.dist * c * Math.sin(V.az), V.dist * Math.sin(V.el));
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      const cv = $("cv"), w = cv.clientWidth, h = cv.clientHeight, pv = new THREE.Vector3();
      $("labels").innerHTML = labels.map(l => { pv.copy(l.p).project(camera); return `<span class="${l.cls || ""}" style="left:${((pv.x + 1) / 2 * w).toFixed(1)}px;top:${((1 - pv.y) / 2 * h).toFixed(1)}px">${l.t}</span>`; }).join("");
    }
    requestAnimationFrame(frame);
  }

  // =====================================================================
  // LEWIS STRUCTURE SOLVER (one central atom), then VSEPR
  // =====================================================================
  Object.assign(CPK, { Al: 0xbfa6a6, Si: 0xf0c8a0, As: 0xbd80e3, Te: 0xd47a00, Kr: 0x5cb8d1 });
  const VAL = { H: 1, Be: 2, B: 3, Al: 3, C: 4, Si: 4, N: 5, P: 5, As: 5, O: 6, S: 6, Se: 6, Te: 6, F: 7, Cl: 7, Br: 7, I: 7, Kr: 8, Xe: 8 };
  const ENEG = { H: 2.20, Be: 1.57, B: 2.04, Al: 1.61, C: 2.55, Si: 1.90, N: 3.04, P: 2.19, As: 2.18, O: 3.44, S: 2.58, Se: 2.55, Te: 2.10, F: 3.98, Cl: 3.16, Br: 2.96, I: 2.66, Kr: 3.00, Xe: 2.60 };
  const PERIOD = { H: 1, Be: 2, B: 2, C: 2, N: 2, O: 2, F: 2, Al: 3, Si: 3, P: 3, S: 3, Cl: 3, As: 4, Se: 4, Br: 4, Kr: 4, Te: 5, I: 5, Xe: 5 };
  const GROUP = { H: 1, Be: 2, B: 13, Al: 13, C: 14, Si: 14, N: 15, P: 15, As: 15, O: 16, S: 16, Se: 16, Te: 16, F: 17, Cl: 17, Br: 17, I: 17, Kr: 18, Xe: 18 };
  const HALO = new Set(["F", "Cl", "Br", "I"]);
  const SUBD = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
  const SUPD = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁺": "+", "⁻": "-" };
  const toSub = n => n > 1 ? String(n).split("").map(c => "₀₁₂₃₄₅₆₇₈₉"[c]).join("") : "";
  const supCharge = q => q === 0 ? "" : (Math.abs(q) > 1 ? String(Math.abs(q)).split("").map(c => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c]).join("") : "") + (q > 0 ? "⁺" : "⁻");

  function parseFormula(raw) {
    // superscript charges (CO₃²⁻) -> "^2-"; subscripts -> digits
    let t = raw.trim().replace(/[−–]/g, "-")
      .replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])\s*$/, (m, d, sg) => "^" + d.split("").map(c => SUPD[c]).join("") + SUPD[sg])
      .replace(/[₀-₉]/g, c => SUBD[c]);
    let charge = 0, mm0;
    if ((mm0 = t.match(/(?:\^|\s+|\()(\d*)([+-])\)?\s*$/))) { charge = (mm0[2] === "+" ? 1 : -1) * (mm0[1] ? parseInt(mm0[1], 10) : 1); t = t.slice(0, mm0.index); }
    else if ((mm0 = t.match(/([+-]+)$/))) { charge = (mm0[1][0] === "+" ? 1 : -1) * mm0[1].length; t = t.slice(0, mm0.index); }
    t = t.replace(/\s/g, "");
    const atoms = {}; const order = [];
    const re = /([A-Z][a-z]?)(\d*)/g; let mm, consumed = 0;
    while ((mm = re.exec(t))) {
      if (mm.index !== consumed) return { err: `I couldn't read "${raw}". Use element symbols and numbers, like SF4 or NO3-.` };
      consumed = re.lastIndex;
      const el = mm[1], n = mm[2] ? parseInt(mm[2], 10) : 1;
      if (!(el in VAL)) return { err: `${el} isn't supported here. Try molecules made of H, B, C, N, O, F, P, S, Cl, Br, I, Xe and similar main-group elements.` };
      if (!(el in atoms)) order.push(el);
      atoms[el] = (atoms[el] || 0) + n;
    }
    if (consumed !== t.length || !order.length) return { err: `I couldn't read "${raw}". Use element symbols and numbers, like SF4 or NO3-.` };
    return { atoms, order, charge };
  }

  function solveLewis(raw) {
    const p = parseFormula(raw); if (p.err) return p;
    const { atoms, order, charge } = p;
    const total = order.reduce((s, el) => s + atoms[el], 0);
    if (total < 2) return { err: "That's a single atom. Enter a molecule with at least two atoms." };
    if (total > 7) return { err: "That has too many atoms for one central atom. This solver handles molecules like AX₂ through AX₆." };
    // central atom
    let central, why;
    const nonH = order.filter(el => el !== "H");
    if (order.length === 1) { central = order[0]; why = `All the atoms are ${central}, so one ${central} goes in the middle.`; }
    else if (nonH.length === 0) return { err: "Hydrogen can't be a central atom." };
    else {
      const singles = nonH.filter(el => atoms[el] === 1);
      if (!singles.length) return { err: "No atom appears just once, so this molecule has more than one central atom (like C₂H₆). This solver handles one central atom." };
      central = singles.sort((a, b) => ENEG[a] - ENEG[b])[0];
      const lowerMulti = nonH.filter(el => el !== central && atoms[el] > 1 && ENEG[el] < ENEG[central]);
      if (lowerMulti.length) return { err: `This molecule probably has more than one central atom (a chain of ${lowerMulti[0]} atoms). This solver handles one central atom.` };
      if (atoms.H && atoms.O && central !== "C" && central !== "O" && central !== "N") return { err: "In acids like H₂SO₄ or HOCl, H bonds to O, not to the central atom, so there is more than one \"center.\" Try a molecule where every atom bonds to one central atom." };
      const others = nonH.filter(el => el !== central);
      why = nonH.length === 1 ? `H is never central (it makes only one bond), so ${central} is the central atom.` :
        `${central} is the least electronegative atom (${ENEG[central]}) other than H${others.length ? `, compared with ${others.map(o => `${o} ${ENEG[o]}`).join(", ")}` : ""}. The least electronegative atom goes in the middle.`;
    }
    const outer = [];
    order.forEach(el => { const n = atoms[el] - (el === central ? 1 : 0); for (let i = 0; i < n; i++) outer.push(el); });
    // order outer: put non-H first then H, keep grouping
    // 1. count
    const counts = order.map(el => ({ el, n: atoms[el], v: VAL[el], sub: atoms[el] * VAL[el] }));
    const V = counts.reduce((s, c) => s + c.sub, 0) - charge;
    if (V % 2) return { err: `${raw} has ${V} valence electrons, an odd number. Molecules with an unpaired electron (radicals like NO₂) aren't covered by the simple method.` };
    const nb = outer.length;
    const st = { bonds: outer.map(() => 1), lp: outer.map(() => 0), clp: 0 };
    const snaps = [];
    const snap = (extra = {}) => JSON.parse(JSON.stringify({ ...st, ...extra }));
    let left = V;
    const steps = [];
    // step 1
    steps.push({ name: "Count the valence electrons", draw: { phase: "atoms" }, tally: `Total valence electrons: ${V}`,
      text: `<table>${counts.map(c => `<tr><td>${c.el}</td><td>group ${GROUP[c.el]} → ${c.v} e⁻ × ${c.n}</td><td>= ${c.sub}</td></tr>`).join("")}${charge ? `<tr><td>charge</td><td>${charge < 0 ? "−" + (-charge) + " charge → add " + (-charge) : "+" + charge + " charge → subtract " + charge}</td><td>${charge < 0 ? "+ " + (-charge) : "− " + charge}</td></tr>` : ""}<tr class="tot"><td>total</td><td></td><td>${V}</td></tr></table>${charge ? "A negative ion has extra electrons; a positive ion is missing some." : ""}` });
    // step 2
    steps.push({ name: "Find the central atom", draw: { phase: "central" }, tally: `Total valence electrons: ${V}`, text: why + ` The other atoms go around it.` });
    // step 3
    left -= 2 * nb;
    if (left < 0) return { err: "There aren't enough electrons to connect every atom to the center, so this can't be drawn with one central atom." };
    steps.push({ name: "Connect each outer atom with a single bond", draw: { phase: "bonds", st: snap() }, tally: `Electrons left: ${V} − ${2 * nb} = ${left}`,
      text: `Draw a single bond from ${central} to each outer atom. Each bond uses 2 electrons: ${nb} bond${nb > 1 ? "s" : ""} × 2 = ${2 * nb} e⁻.` });
    // step 4: outer octets
    let used4 = 0, hNote = false;
    outer.forEach((el, i) => {
      if (el === "H") { hNote = true; return; }
      const want = 3; const give = Math.min(want, Math.floor(left / 2));
      st.lp[i] = give; left -= give * 2; used4 += give * 2;
    });
    const nonHouter = outer.filter(el => el !== "H").length;
    steps.push({ name: "Fill the outer atoms' octets", draw: { phase: "outer", st: snap() }, tally: `Electrons left: ${left + used4} − ${used4} = ${left}`,
      text: (nonHouter ? `Give each outer atom (except H) 3 lone pairs so it has 8 electrons: ${nonHouter} × 6 = ${used4} e⁻.` : "") + (hNote ? ` ${nonHouter ? "" : "The outer atoms are all H. "}Hydrogen only needs 2 electrons, and its bond already gives it 2, so it gets no lone pairs.` : "") });
    // step 5: leftovers to central
    const leftover = left; st.clp = left / 2; left = 0;
    steps.push({ name: "Put leftover electrons on the central atom", draw: { phase: "center", st: snap() }, tally: `Electrons left: ${leftover} − ${leftover} = 0`,
      text: leftover ? `${leftover} electrons are left, so ${central} gets ${leftover / 2} lone pair${leftover / 2 > 1 ? "s" : ""}.` : `No electrons are left, so ${central} gets no lone pairs.` });
    // step 6: central octet
    const cE = () => 2 * st.bonds.reduce((a, b) => a + b, 0) + 2 * st.clp;
    const target = central === "H" ? 2 : central === "Be" ? 4 : (central === "B" || central === "Al") ? 6 : 8;
    let t6 = `Count the electrons around ${central}: ${st.bonds.reduce((a, b) => a + b, 0)} bond pair${nb > 1 ? "s" : ""} and ${st.clp} lone pair${st.clp === 1 ? "" : "s"} = <b>${cE()} e⁻</b>. `;
    const moved = [];
    if (cE() < 8 && target === 8) {
      t6 += `${central} needs 8, so move lone pairs from the outer atoms into bonds, making double or triple bonds. Each move gives ${central} 2 more electrons without changing the total. `;
      let guard = 0;
      while (cE() < 8 && guard++ < 10) {
        const cand = outer.map((el, i) => ({ el, i })).filter(o => o.el !== "H" && st.lp[o.i] > 0);
        if (!cand.length) break;
        cand.sort((a, b) => (HALO.has(a.el) - HALO.has(b.el)) || (st.bonds[a.i] - st.bonds[b.i]) || (ENEG[a.el] - ENEG[b.el]));
        const c = cand[0]; st.lp[c.i]--; st.bonds[c.i]++; moved.push(c.i);
      }
      const dbl = st.bonds.filter(b => b === 2).length, tri = st.bonds.filter(b => b === 3).length;
      t6 += `Now ${central} has ${cE()} e⁻ ${cE() >= 8 ? '<span class="ok">✓</span>' : '<span class="warn">(still short)</span>'}: ${[dbl ? dbl + " double bond" + (dbl > 1 ? "s" : "") : "", tri ? tri + " triple bond" + (tri > 1 ? "s" : "") : ""].filter(Boolean).join(" and ")}.`;
    } else if (cE() < target) t6 += `<span class="warn">${central} stays short of 8.</span>`;
    else if (target < 8) t6 += `${central} is an exception: ${central === "Be" ? "beryllium is stable with 4 electrons" : central === "H" ? "hydrogen only holds 2" : (central === "B" ? "boron" : "aluminum") + " is stable with only 6 electrons"}, so no double bonds are needed <span class="ok">✓</span>.`;
    else if (cE() === 8) t6 += `${central} has a full octet <span class="ok">✓</span>. No changes needed.`;
    else t6 += `${central} has more than 8: an <b>expanded octet</b>. That's allowed because ${central} is in period ${PERIOD[central]}; atoms in period 3 and below can hold more than 8. <span class="ok">✓</span>`;
    steps.push({ name: "Check the central atom's octet", draw: { phase: "fix", st: snap(), moved }, tally: `Electrons around ${central}: ${cE()}`, text: t6 });
    // step 7: verify totals + formal charge
    const bondE = 2 * st.bonds.reduce((a, b) => a + b, 0), lpE = 2 * (st.lp.reduce((a, b) => a + b, 0) + st.clp);
    const fc = { c: VAL[central] - 2 * st.clp - st.bonds.reduce((a, b) => a + b, 0), o: outer.map((el, i) => VAL[el] - 2 * st.lp[i] - st.bonds[i]) };
    const fcList = [[central + " (center)", fc.c]].concat(outer.map((el, i) => [el, fc.o[i]]));
    const nonzero = fcList.filter(x => x[1] !== 0);
    const res = (() => { const eq = {}; outer.forEach((el, i) => { (eq[el] = eq[el] || []).push(st.bonds[i]); }); return Object.entries(eq).some(([el, arr]) => new Set(arr).size > 1) ? Object.entries(eq).find(([el, arr]) => new Set(arr).size > 1)[0] : null; })();
    const octOK = outer.every((el, i) => el === "H" ? true : 2 * st.lp[i] + 2 * st.bonds[i] === 8);
    let t7 = `<b>Count every electron in the drawing:</b> ${bondE} in bonds + ${lpE} in lone pairs = ${bondE + lpE}. Step 1 said ${V} ${bondE + lpE === V ? '<span class="ok">✓ they match</span>' : '<span class="warn">✗ mismatch</span>'}.<br>`;
    t7 += `<b>Octets:</b> ${outer.some(e => e !== "H") ? `every outer ${[...new Set(outer.filter(e => e !== "H"))].join("/")} has 8 ${octOK ? '<span class="ok">✓</span>' : '<span class="warn">✗</span>'}` : ""}${outer.includes("H") ? `${outer.some(e => e !== "H") ? "; " : ""}each H has 2 <span class="ok">✓</span>` : ""}; ${central} has ${cE()}.<br>`;
    t7 += `<b>Formal charges</b> (valence − lone-pair e⁻ − bonds): ${nonzero.length ? nonzero.map(([a, q]) => `${a} ${q > 0 ? "+" : "−"}${Math.abs(q)}`).join(", ") + (charge ? `; they add up to ${charge > 0 ? "+" : "−"}${Math.abs(charge)}, the ion's charge` : "; they add up to 0 because the molecule is neutral") : "all zero"}.`;
    if (res) t7 += `<br><b>Resonance:</b> the double bond could be on any of the ${outer.filter(e => e === res).length} ${res} atoms, so the real molecule is a blend of these drawings.`;
    if (charge) t7 += `<br>Because it's an ion, draw brackets around it with the charge (${supCharge(charge)}).`;
    if (Math.abs(fc.c) >= 2 && PERIOD[central] >= 3) t7 += `<br><b>Note:</b> ${central} has a large formal charge (${fc.c > 0 ? "+" : "−"}${Math.abs(fc.c)}). Some textbooks redraw this with double bonds to O (an expanded octet on ${central}) to bring the formal charges closer to zero. The VSEPR shape is the same either way.`;
    steps.push({ name: "Check your work", draw: { phase: "final", st: snap(), fc }, tally: `${bondE + lpE} e⁻ drawn = ${V} e⁻ counted`, text: t7 });
    // steps 8-10: VSEPR
    const e = st.clp, b = nb, sn = b + e, info = shapeInfo(b, e);
    const multi = st.bonds.some(x => x > 1);
    const pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    steps.push({ name: "Count the electron domains", draw: { phase: "final", st: snap(), fc, hl: "domains" }, tally: `Electron domains on ${central}: ${sn}`,
      text: `Circle everything attached to the central atom, ${central}. Each <b>bonded atom</b> is one domain${multi ? " (a double or triple bond still counts as just one)" : ""}, and each <b>lone pair</b> on ${central} is one domain. Lone pairs on the outer atoms don't count.<br><br>${central}: ${pl(b, "bonded atom")} + ${pl(e, "lone pair")} = <b>${pl(sn, "domain")}</b>.` });
    const egRows = [2, 3, 4, 5, 6].map(k => `<tr${k === sn ? ' style="font-weight:700;color:var(--sel)"' : ""}><td>${k} domains</td><td>→ ${EG[k]}</td></tr>`).join("");
    steps.push({ name: "Domains → first name (electron geometry)", draw: { phase: "final", st: snap(), fc, hl: "domains" }, view: "eg",
      tally: sn >= 2 ? `First name: ${titleCase(EG[sn])}` : "Only two atoms",
      text: sn >= 2 ? `The domains spread out as far apart as possible. The number of domains gives the <b>electron geometry</b>, the first name:<table>${egRows}</table>${central} has ${sn} domains, so the first name is <b>${EG[sn].toLowerCase()}</b>. It describes where <i>all</i> the domains point, lone pairs included. In 3D, the faint spheres mark where the lone pairs point.` : `With only one domain there is no arrangement to name: two atoms always make a straight line.` });
    let t10;
    if (b < 2) t10 = `There are only two atoms, so the molecule is <b>linear</b>. Any two points make a straight line.`;
    else if (!e) t10 = `Split the domains: ${pl(b, "bonded atom")} (X) and no lone pairs (E), so it's <b>${axe(b, e)}</b>.<br><br>With no lone pairs, the atoms sit at every domain, so the second name matches the first: <b>${info.name.toLowerCase()}</b>.<br>Bond angle: ${info.ang}. Hybridization: ${HYB[sn]}.`;
    else t10 = `Split the domains: ${pl(b, "bonded atom")} (X, circled blue) and ${pl(e, "lone pair")} (E, circled gold), so it's <b>${axe(b, e)}</b>.<br><br>Lone pairs push on the bonds but aren't part of the shape's name, so name the shape from the <b>atoms only</b>: <b>${info.name.toLowerCase()}</b>.<br>Bond angle: ${info.ang}. Hybridization: ${HYB[sn]}.${sn === 5 ? " Lone pairs take the middle (equatorial) positions." : sn === 6 && e === 2 ? " The two lone pairs sit opposite each other." : ""}`;
    steps.push({ name: "Lone pairs vs. atoms → second name (shape)", draw: { phase: "final", st: snap(), fc, hl: "split" }, view: "shape", vsepr: true,
      tally: b < 2 ? "Linear (two atoms)" : `${axe(b, e)} → ${viewTitle(b, e)}`, text: t10 });
    const pretty = order.map(el => el + toSub(atoms[el])).join("") + supCharge(charge);
    return { steps, central, outer, charge, pretty, b, e, bonds: st.bonds, raw };
  }

  // ---------- 2D Lewis drawing ----------
  const OUT_ANG = { 1: [0], 2: [180, 0], 3: [90, 210, 330], 4: [90, 0, 270, 180], 5: [90, 18, -54, -126, 162], 6: [90, 30, -30, -90, -150, 150] };
  // Textbook-style layouts: lone pair(s) on the central atom go up; atoms fill left, right, down first
  function layoutAngles(n, clp) {
    if (n === 1) return [0];
    if (n === 2) return [180, 0];
    if (n === 3) return clp ? [180, 0, 270] : [90, 210, 330];
    if (n === 4) return [90, 0, 270, 180];
    if (n === 5) return [90, 18, -54, -126, 162];
    return [90, 30, -30, -90, -150, 150];
  }
  const angDist = (a, b) => { const d = Math.abs(((a - b) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); return d; };
  // direction (radians, y up) farthest from every used direction; prefers straight up/down/left/right on ties
  function freeDir(used, prefs) {
    const cands = prefs || [90, 270, 0, 180, 45, 135, 225, 315, 60, 120, 240, 300, 30, 150, 210, 330].map(d => d * Math.PI / 180);
    let best = cands[0], bestD = -1;
    // score: nearest neighbor first, then total spread (so a second lone pair goes opposite the first)
    cands.forEach(c => { const m = used.length ? Math.min(...used.map(u => angDist(c, u))) + 0.001 * used.reduce((t, u) => t + angDist(c, u), 0) : 9; if (m > bestD + 1e-6) { bestD = m; best = c; } });
    return best;
  }
  function drawLewis(sol, d) {
    const svg = $("svSvg"), R = 100, ink = getComputedStyle(document.body).color;
    const acc = getComputedStyle(document.documentElement).getPropertyValue("--sel").trim() || "#6d95ff";
    const st = d.st, phase = d.phase;
    const finalClp = sol.e;
    const n = sol.outer.length, angs = layoutAngles(n, finalClp);
    const pos = sol.outer.map((el, i) => { const a = angs[i] * Math.PI / 180; return [R * Math.cos(a), -R * Math.sin(a)]; });
    const font = "Atkinson Hyperlegible, Arial";
    let g = "";
    const atomTxt = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="700" font-size="26" fill="${ink}">${t}</text>`;
    const dots = (x, y, ang, r, color = ink) => { const ox = x + r * Math.cos(ang), oy = y - r * Math.sin(ang), px = -Math.sin(ang) * 5.5, py = -Math.cos(ang) * 5.5; return `<circle cx="${(ox + px).toFixed(1)}" cy="${(oy + py).toFixed(1)}" r="3.2" fill="${color}"/><circle cx="${(ox - px).toFixed(1)}" cy="${(oy - py).toFixed(1)}" r="3.2" fill="${color}"/>`; };
    const showBonds = !["atoms", "central"].includes(phase);
    if (showBonds) sol.outer.forEach((el, i) => {
      const order = st.bonds[i], [x, y] = pos[i], L = Math.hypot(x, y), ux = x / L, uy = y / L, px = -uy, py = ux;
      const moved = d.moved && d.moved.includes(i) && phase === "fix";
      const offs = order === 1 ? [0] : order === 2 ? [-4, 4] : [-6.5, 0, 6.5];
      offs.forEach(o => { g += `<line x1="${(ux * 21 + px * o).toFixed(1)}" y1="${(uy * 21 + py * o).toFixed(1)}" x2="${(x - ux * 21 + px * o).toFixed(1)}" y2="${(y - uy * 21 + py * o).toFixed(1)}" stroke="${moved ? acc : ink}" stroke-width="2.6" stroke-linecap="round"/>`; });
    });
    g += atomTxt(0, 0, sol.central);
    if (phase === "central") g += `<circle cx="0" cy="0" r="24" fill="none" stroke="${acc}" stroke-width="3" stroke-dasharray="5 4"/>`;
    sol.outer.forEach((el, i) => { g += atomTxt(pos[i][0], pos[i][1], el); });
    if (phase === "atoms") {
      [[0, 0, sol.central]].concat(sol.outer.map((el, i) => [pos[i][0], pos[i][1], el])).forEach(([x, y, el]) => { g += `<text x="${x}" y="${y + 28}" text-anchor="middle" font-size="12" font-family="IBM Plex Mono, monospace" fill="${acc}">${VAL[el]} e⁻</text>`; });
    }
    // directions used around each atom (for placing lone pairs and charge labels)
    const bondDirC = sol.outer.map((el, i) => Math.atan2(-pos[i][1], pos[i][0]));
    const outerUsed = sol.outer.map((el, i) => [Math.atan2(pos[i][1], -pos[i][0])]); // back toward the center
    if (st && ["outer", "center", "fix", "final"].includes(phase)) sol.outer.forEach((el, i) => {
      const back = outerUsed[i][0] + Math.PI;
      const cand = [back, back + Math.PI / 2, back - Math.PI / 2];
      for (let k = 0; k < st.lp[i]; k++) { g += dots(pos[i][0], pos[i][1], cand[k], 21); outerUsed[i].push(cand[k]); }
    });
    const centerUsed = showBonds ? bondDirC.slice() : [];
    if (st && st.clp && ["center", "fix", "final"].includes(phase)) {
      // fixed textbook spots for crowded cases (XeF2-type and ClF3-type); otherwise the emptiest direction
      const preset = n === 2 && st.clp === 3 ? [90, 230, 310] : n === 3 && finalClp >= 1 && st.clp === 2 ? [60, 120] : null;
      for (let k = 0; k < st.clp; k++) { const a = preset ? preset[k] * Math.PI / 180 : freeDir(centerUsed); centerUsed.push(a); g += dots(0, 0, a, 30, phase === "center" ? acc : ink); }
    }
    if (d.fc && phase === "final") {
      const lab = (x, y, q, used) => { if (!q) return ""; const a = freeDir(used, [45, 135, 315, 225, 90, 270, 0, 180].map(t => t * Math.PI / 180)); return `<text x="${(x + 27 * Math.cos(a)).toFixed(1)}" y="${(y - 27 * Math.sin(a)).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="700" fill="${acc}" font-family="${font}">${q > 0 ? "+" : "−"}${Math.abs(q) > 1 ? Math.abs(q) : ""}</text>`; };
      g += lab(0, 0, d.fc.c, centerUsed); sol.outer.forEach((el, i) => { g += lab(pos[i][0], pos[i][1], d.fc.o[i], outerUsed[i]); });
    }
    // VSEPR highlights: circle each domain on the central atom
    if (d.hl && st) {
      const bondCol = "#5b9bd5", lpCol = "#e3a21a", allCol = acc;
      const tag = (x, y, t, c) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="700" fill="${c}" font-family="${font}">${t}</text>`;
      let k = 0;
      sol.outer.forEach((el, i) => {
        const [x, y] = pos[i], ang = Math.atan2(y, x) * 180 / Math.PI, L = Math.hypot(x, y);
        const c = d.hl === "split" ? bondCol : allCol; k++;
        g += `<ellipse cx="${(x / 2).toFixed(1)}" cy="${(y / 2).toFixed(1)}" rx="${(L / 2 - 24).toFixed(1)}" ry="12" transform="rotate(${ang.toFixed(1)} ${(x / 2).toFixed(1)} ${(y / 2).toFixed(1)})" fill="${c}" fill-opacity="0.10" stroke="${c}" stroke-width="2"/>`;
        const px = -y / L * 24, py = x / L * 24;
        g += tag(x / 2 + px, y / 2 + py, d.hl === "split" ? "X" : String(k), c);
      });
      const lpAngles = centerUsed.slice(showBonds ? bondDirC.length : 0);
      lpAngles.forEach(a => {
        const c = d.hl === "split" ? lpCol : allCol; k++;
        const ox = 30 * Math.cos(a), oy = -30 * Math.sin(a);
        g += `<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="11" fill="${c}" fill-opacity="0.15" stroke="${c}" stroke-width="2"/>`;
        g += tag(ox + 20 * Math.cos(a), oy - 20 * Math.sin(a), d.hl === "split" ? "E" : String(k), c);
      });
    }
    // center the molecule and fit the ion brackets to it
    const xs = [0, ...pos.map(p => p[0])], ys = [0, ...pos.map(p => p[1])];
    const pad = d.hl ? 46 : 34; const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    if (sol.charge && phase === "final") {
      const bx0 = minX - 6, bx1 = maxX + 6, by0 = minY - 4, by1 = maxY + 4;
      g += `<path d="M ${bx0 + 10} ${by0} h -10 v ${by1 - by0} h 10 M ${bx1 - 10} ${by0} h 10 v ${by1 - by0} h -10" fill="none" stroke="${ink}" stroke-width="2.4"/>`;
      g += `<text x="${bx1 + 5}" y="${by0 + 4}" font-size="20" font-weight="700" fill="${ink}" font-family="${font}">${supCharge(sol.charge)}</text>`;
    }
    svg.innerHTML = `<g transform="translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})">${g}</g>`;
  }

  // ---------- mini 3D viewer for the solver ----------
  const M = { ok: false, az: -0.9, el: 0.3, objs: [], labels: [] };
  if (HAS3) {
    const cv = $("sv3");
    M.r = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); M.r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); M.r.setClearColor(0x000000, 1);
    M.s = new THREE.Scene(); M.c = new THREE.PerspectiveCamera(35, 1, 0.1, 100); M.c.up.set(0, 0, 1); M.s.add(M.c);
    M.s.add(new THREE.AmbientLight(0xffffff, 0.5)); const k = new THREE.DirectionalLight(0xffffff, 0.8); k.position.set(2, 3, 4); M.c.add(k);
    M.g = new THREE.Group(); M.s.add(M.g);
    const rs = () => { const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return; M.r.setSize(w, h, false); M.c.aspect = w / h; M.c.updateProjectionMatrix(); };
    new ResizeObserver(rs).observe(cv); rs();
    new IntersectionObserver(es => { M.vis = es[0].isIntersecting; }).observe(cv);
    let drag = null;
    cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => { if (!drag) return; M.az -= (e.clientX - drag.x) * 0.01; M.el = Math.max(-1.5, Math.min(1.5, M.el + (e.clientY - drag.y) * 0.01)); drag = { x: e.clientX, y: e.clientY }; });
    cv.addEventListener("pointerup", () => { drag = null; });
    M.drag = () => !!drag;
    M.ok = true;
  }
  function build3D(sol, view) {
    if (!M.ok) return;
    while (M.g.children.length) M.g.remove(M.g.children[0]);
    M.labels = [];
    const b = sol.b, e = sol.e, sn = b + e;
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.42, 36, 28), new THREE.MeshPhongMaterial({ color: CPK[sol.central] ?? A_COL, shininess: 60 }));
    M.g.add(center); M.labels.push({ p: new THREE.Vector3(), t: sol.central });
    if (!sn) return;
    const slots = SLOTS[sn], lpIdx = new Set(LPORDER[sn].slice(0, e));
    const order = slots.map((_, i) => i);
    const bondSlots = order.filter(i => !lpIdx.has(i));
    const dirs = relax(slots, slots.map((_, i) => lpIdx.has(i)), true).map(v => new THREE.Vector3(...v).normalize());
    const UPV = new THREE.Vector3(0, 1, 0);
    bondSlots.forEach((si, k) => {
      const el = sol.outer[k], ord = sol.bonds[k], d = dirs[si];
      const atom = new THREE.Mesh(new THREE.SphereGeometry(el === "H" ? 0.22 : 0.3, 28, 20), new THREE.MeshPhongMaterial({ color: CPK[el] ?? X_COL, shininess: 60 }));
      atom.position.copy(d).multiplyScalar(BOND_L); M.g.add(atom); M.labels.push({ p: atom.position.clone(), t: el });
      const perp = new THREE.Vector3(0, 0, 1); if (Math.abs(d.z) > 0.9) perp.set(1, 0, 0); perp.cross(d).normalize();
      const offs = ord === 1 ? [0] : ord === 2 ? [-0.07, 0.07] : [-0.11, 0, 0.11];
      offs.forEach(o => {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(ord === 1 ? 0.075 : 0.045, ord === 1 ? 0.075 : 0.045, BOND_L, 14), new THREE.MeshPhongMaterial({ color: 0x8fa0b8 }));
        cyl.position.copy(d).multiplyScalar(BOND_L / 2).addScaledVector(perp, o); cyl.quaternion.setFromUnitVectors(UPV, d); M.g.add(cyl);
      });
    });
    // electron-geometry view: dashed outline joining every domain, plus a ghost sphere where each lone pair points
    if (view === "eg" && EDGES[sn] && EDGES[sn].length) {
      const pts = []; EDGES[sn].forEach(([i, j]) => { pts.push(dirs[i].clone().multiplyScalar(BOND_L), dirs[j].clone().multiplyScalar(BOND_L)); });
      const ln = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.7, dashSize: 0.12, gapSize: 0.08 }));
      ln.computeLineDistances(); M.g.add(ln);
      [...lpIdx].forEach(si => { const gh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 18), new THREE.MeshBasicMaterial({ color: 0xffcf5a, transparent: true, opacity: 0.35, depthWrite: false })); gh.position.copy(dirs[si]).multiplyScalar(BOND_L); M.g.add(gh); });
    }
    [...lpIdx].forEach(si => {
      const d = dirs[si];
      const lobe = new THREE.Mesh(geo.lobe, new THREE.MeshPhongMaterial({ color: 0xffcf5a, transparent: true, opacity: 0.42, depthWrite: false }));
      lobe.position.copy(d).multiplyScalar(0.72); lobe.quaternion.setFromUnitVectors(UPV, d); lobe.scale.set(0.34, 0.55, 0.34); M.g.add(lobe);
      const perp = new THREE.Vector3(0, 0, 1); if (Math.abs(d.z) > 0.9) perp.set(1, 0, 0); perp.cross(d).normalize().multiplyScalar(0.1);
      [1, -1].forEach(sg => { const dot = new THREE.Mesh(geo.dot, new THREE.MeshBasicMaterial({ color: 0xfff1c4 })); dot.position.copy(d).multiplyScalar(0.85).addScaledVector(perp, sg); M.g.add(dot); });
    });
    // one angle label (shape view only)
    if (b >= 2 && view !== "eg") {
      const info = shapeInfo(b, e);
      let pick = null;
      for (let i = 0; i < bondSlots.length; i++) for (let j = i + 1; j < bondSlots.length; j++) {
        const dd = SLOTS[sn][bondSlots[i]].reduce((s, v, q) => s + v * SLOTS[sn][bondSlots[j]][q], 0);
        if (!pick || dd > pick.dd) pick = { dd, i: bondSlots[i], j: bondSlots[j] };
      }
      const a = dirs[pick.i], c = dirs[pick.j];
      const ideal = Math.round(Math.acos(Math.max(-1, Math.min(1, pick.dd))) * 180 / Math.PI);
      const kk = ideal >= 178 ? 180 : ideal >= 118 ? 120 : ideal >= 108 ? 109 : 90;
      const ang = a.angleTo(c), arc = [];
      if (ang < 3.1) {
        for (let i = 0; i <= 20; i++) { const t = i / 20; arc.push(a.clone().multiplyScalar(Math.sin((1 - t) * ang)).add(c.clone().multiplyScalar(Math.sin(t * ang))).divideScalar(Math.sin(ang)).normalize().multiplyScalar(0.78)); }
        M.g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arc), new THREE.LineBasicMaterial({ color: 0x9fe3ff })));
        M.labels.push({ p: arc[10].clone().multiplyScalar(1.35), t: (info.lab && info.lab[kk]) || kk + "°", cls: "ang" });
      }
    }
  }
  function frame3D() {
    if (M.ok && M.vis && M.show) {
      if (!M.drag()) M.az += 0.005;
      const c = Math.cos(M.el), D = 7.6;
      M.c.position.set(D * c * Math.cos(M.az), D * c * Math.sin(M.az), D * Math.sin(M.el)); M.c.lookAt(0, 0, 0);
      M.r.render(M.s, M.c);
      const cv = $("sv3"), w = cv.clientWidth, h = cv.clientHeight, pv = new THREE.Vector3();
      $("sv3lab").innerHTML = M.labels.map(l => { pv.copy(l.p).project(M.c); return `<span class="${l.cls || ""}" style="left:${((pv.x + 1) / 2 * w).toFixed(1)}px;top:${((1 - pv.y) / 2 * h).toFixed(1)}px">${l.t}</span>`; }).join("");
    }
    requestAnimationFrame(frame3D);
  }
  requestAnimationFrame(frame3D);

  // ---------- solver UI ----------
  const SV = { sol: null, i: 0 };
  function solve(f) {
    if (!f.trim()) { svEmpty(); $("svErr").textContent = "Type a molecule first, like SF4."; return; }
    const sol = solveLewis(f);
    if (sol.err) { svEmpty(); $("svErr").textContent = sol.err; return; }
    $("svErr").textContent = "";
    SV.sol = sol; SV.i = 0;
    $("svList").innerHTML = sol.steps.map((s, k) => `<li><button type="button" data-k="${k}"><span class="n">${k + 1}</span>${s.name}</button></li>`).join("");
    $("svList").querySelectorAll("button").forEach(b => b.addEventListener("click", () => showStep(+b.dataset.k)));
    M.view = null;
    showStep(0);
  }
  function showStep(k) {
    const sol = SV.sol; if (!sol) return;
    SV.i = Math.max(0, Math.min(sol.steps.length - 1, k));
    const s = sol.steps[SV.i];
    $("svList").querySelectorAll("li").forEach((li, j) => { li.className = j < SV.i ? "done" : j === SV.i ? "cur" : "later"; });
    $("svName").textContent = `Step ${SV.i + 1} of ${sol.steps.length}: ${s.name}`;
    $("svText").innerHTML = s.text;
    $("svTally").textContent = `${sol.pretty} · ${s.tally}`;
    drawLewis(sol, s.draw);
    const view = s.view || null, last = !!s.vsepr, sn = sol.b + sol.e;
    M.show = !!view; $("sv3wait").hidden = !!view; $("svOpen").disabled = !last;
    if (view && M.view !== view + sol.raw) { build3D(sol, view); M.view = view + sol.raw; }
    const sub = `<span>${sn} domain${sn === 1 ? "" : "s"} (${sol.b} bond${sol.b === 1 ? "" : "s"}, ${sol.e} lone pair${sol.e === 1 ? "" : "s"}) · ${sol.pretty}</span>`;
    $("sv3over").innerHTML = !view ? "" : view === "eg" ? (sn >= 2 ? `${titleCase(EG[sn])}` : "Linear") + sub : viewTitle(sol.b, sol.e) + sub;
    if (!view && M.ok) { $("sv3lab").innerHTML = ""; M.r.clear(); }
    $("svPrev").disabled = SV.i === 0; $("svNext").disabled = SV.i === sol.steps.length - 1; $("svAll").disabled = false;
  }
  // plain button + Enter key (a <form> submit is blocked inside sandboxed frames like Schoology's)
  $("svGo").addEventListener("click", () => solve($("svIn").value));
  $("svIn").addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); solve($("svIn").value); } });
  $("svPrev").addEventListener("click", () => showStep(SV.i - 1));
  $("svNext").addEventListener("click", () => showStep(SV.i + 1));
  $("svAll").addEventListener("click", () => SV.sol && showStep(SV.sol.steps.length - 1));
  $("svOpen").addEventListener("click", () => {
    const sol = SV.sol; if (!sol) return;
    stopPlay(); target = { b: sol.b, e: sol.e }; ST.ex = -1; ST.custom = null; ST.pendingCustom = [sol.pretty, sol.central, sol.outer.slice()]; playBuild(sol.b, sol.e);
    document.getElementById("dash").scrollIntoView({ behavior: "smooth" });
  });
  // empty state (at start, and after an entry that can't be solved)
  function svEmpty() {
    SV.sol = null;
    $("svList").innerHTML = ""; $("svSvg").innerHTML = ""; $("sv3over").innerHTML = ""; $("sv3lab").innerHTML = "";
    M.show = false; if (M.ok) M.r.clear(); $("sv3wait").hidden = false;
    $("svName").textContent = "Enter a molecule to begin";
    $("svText").innerHTML = "Type a formula above and press <b>Solve</b> (or Enter). Each step of the Lewis structure appears here, then the 3D shape below.";
    $("svTally").textContent = "—";
    ["svPrev", "svNext", "svAll", "svOpen"].forEach(id => { $(id).disabled = true; });
  }
  svEmpty();



  // ---------- Full screen (browser full screen, or fill the window if the page isn't allowed to) ----------
  function fsLabel() {
    document.querySelectorAll(".fsbtn").forEach(b => {
      const el = $(b.dataset.fs), on = document.fullscreenElement === el || el.classList.contains("maxed");
      b.textContent = on ? "✕ Exit full screen" : "⛶ Full screen";
    });
  }
  function unmax(el) { el.classList.remove("maxed"); document.body.classList.remove("noscroll"); fsLabel(); }
  function maxi(el) { el.classList.add("maxed"); document.body.classList.add("noscroll"); fsLabel(); }
  function fsToggle(el) {
    if (document.fullscreenElement === el) { document.exitFullscreen().catch(() => {}); return; }
    if (el.classList.contains("maxed")) { unmax(el); return; }
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) { maxi(el); return; }
    try { const p = req.call(el); if (p && p.catch) p.catch(() => maxi(el)); } catch (err) { maxi(el); }
  }
  document.querySelectorAll(".fsbtn").forEach(b => b.addEventListener("click", ev => { ev.stopPropagation(); fsToggle($(b.dataset.fs)); }));
  document.addEventListener("fullscreenchange", fsLabel);
  document.addEventListener("keydown", ev => { if (ev.key === "Escape") document.querySelectorAll(".maxed").forEach(unmax); });

  // ---------- Wire up ----------
  buildChart();
  $("addB").addEventListener("click", () => add("b"));
  $("addE").addEventListener("click", () => add("e"));
  $("remB").addEventListener("click", () => remove("b"));
  $("remE").addEventListener("click", () => remove("e"));
  $("clear").addEventListener("click", () => { stopPlay(); setDomains([], false); caption(""); });
  $("play").addEventListener("click", () => { if (ST.playTimer) { stopPlay(); return; } const b = nB(), e = nE(); playBuild(b + e ? b : target.b, b + e ? e : target.e); });
  [["tLP", "lp"], ["tEG", "eg"], ["tAng", "ang"], ["tLab", "lab"]].forEach(([id, k]) => $(id).addEventListener("change", ev => { ST.opts[k] = ev.target.checked; }));
  $("tSq").addEventListener("change", ev => { ST.opts.sq = ev.target.checked; assign(true); });
  $("tRot").addEventListener("change", ev => { V.auto = ev.target.checked; });
  $("zin").addEventListener("click", () => { V.zoom = Math.max(0.4, V.zoom / 1.25); });
  $("zout").addEventListener("click", () => { V.zoom = Math.min(2.5, V.zoom * 1.25); });
  $("vreset").addEventListener("click", () => { V.az = -0.9; V.el = 0.32; V.zoom = 1; });
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { V.auto = false; $("tRot").checked = false; }

  function fit() {
    const dash = $("dash"), wide = innerWidth >= 1000;
    dash.classList.toggle("fit", wide);
    if (wide) dash.style.setProperty("--dashH", Math.max(560, innerHeight - $("topbar").offsetHeight - 30) + "px");
  }
  fit(); addEventListener("resize", fit);
  choose(2, 2, false);
  caption("Click a shape in the chart to watch it build.");
  requestAnimationFrame(frame);
})();
