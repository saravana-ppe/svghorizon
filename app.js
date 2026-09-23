/* ============================================================
   SVG Horizon — app logic

   You should not need to edit this file to add content.
   To add a note:  put the file in notes/ or teacher-notes/,
                   then add one line in data/syllabus.json
   ============================================================ */

let DATA = null;
let SITE = {};
let state = { view: "home" };
const app = document.getElementById("app");

const count = o => Object.keys(o || {}).length;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const chev = `<svg class="chev" width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true"><path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

/* ---------- start up ---------- */
fetch("data/syllabus.json")
  .then(r => r.json())
  .then(json => { DATA = json.exams; SITE = json.site || {}; route(); })
  .catch(() => {
    app.innerHTML = `<div class="empty"><strong>Could not load the syllabus</strong>
      If you opened index.html by double-clicking it, that is the reason. The browser blocks
      file loading from your hard disk. Push the site to GitHub and open it from the live
      address instead.</div>`;
  });

/* ---------- addresses: the part after # in the address bar ----------
   Every screen has its own address, for example
     #/neet                                   NEET (list of subjects)
     #/neet/biology                           Biology (list of units)
     #/neet/biology/unit-05                   one unit (list of topics)
     #/neet/biology/unit-05/ecosystem         one topic (the two buttons)
     #/neet/biology/unit-05/ecosystem/notes   academic notes
     #/neet/biology/unit-05/ecosystem/teacher teacher notes
   The words are the IDs from data/syllabus.json. A click changes the
   address, and the address decides what is shown. That is what makes
   Back, refresh and shared links work.
   RULE: once links are shared, do not rename IDs in syllabus.json. */

const LEVELS = ["exam", "subject", "chapter", "topic"];
const ENDING = { academic: "notes", teacher: "teacher" };
const scrollMemory = {};        // where the page was scrolled, per address
let clicked = false;            // true when a click (not Back) caused the change
let wantScroll = 0;             // scroll position to show once the page is drawn
history.scrollRestoration = "manual";

// build the address for a screen
function addressFor(view, p) {
  const parts = LEVELS.filter(k => p[k]).map(k => encodeURIComponent(p[k]));
  if (ENDING[view]) parts.push(ENDING[view]);
  return "#/" + parts.join("/");
}

// every click in the site calls go(); it only changes the address
function go(view, p = {}) {
  const next = addressFor(view, p);
  clicked = true;
  if (location.hash === next) route();   // already here: just redraw
  else location.hash = next;             // new address: browser records it, then route() runs
}
window.go = go;

// read the address, check it against the syllabus, and show that screen
function route() {
  if (!DATA) return;
  const has = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const s = { view: "home" };

  if (parts.length) {
    const [exam, subject, chapter, topic, ending] = parts;
    if (!has(DATA, exam)) return notFound();
    Object.assign(s, { view: "exam", exam });
    if (subject !== undefined) {
      if (!has(DATA[exam].subjects, subject)) return notFound();
      Object.assign(s, { view: "subject", subject });
    }
    if (chapter !== undefined) {
      if (!has(DATA[exam].subjects[subject].chapters, chapter)) return notFound();
      Object.assign(s, { view: "chapter", chapter });
    }
    if (topic !== undefined) {
      if (!has(DATA[exam].subjects[subject].chapters[chapter].topics, topic)) return notFound();
      Object.assign(s, { view: "topic", topic });
    }
    if (ending !== undefined) {
      const view = Object.keys(ENDING).find(v => ENDING[v] === ending);
      if (!view || parts.length > 5) return notFound();
      s.view = view;
    }
  }

  state = s;
  const key = location.hash || "#/";
  wantScroll = clicked ? 0 : (scrollMemory[key] || 0);   // Back/Forward returns to where you were
  clicked = false;
  render();
  setTitle();
  window.scrollTo(0, wantScroll);
}

// a shared link that no longer matches anything in the syllabus
function notFound() {
  clicked = false;
  document.title = "Page not found · " + (SITE.title || "SVG Horizon");
  app.innerHTML = `<div class="empty" style="margin-top:32px"><strong>This link does not open any page</strong>
    The chapter or topic may have been renamed or removed. Start from the home page to find it.</div>
    <button class="back" onclick="go('home')">Go to the home page</button>`;
  window.scrollTo(0, 0);
}

// the name shown on the browser tab
function setTitle() {
  const s = state, site = SITE.title || "SVG Horizon";
  if (s.view === "home") { document.title = site; return; }
  const ex = DATA[s.exam], sub = s.subject && ex.subjects[s.subject];
  const ch = s.chapter && sub.chapters[s.chapter], tp = s.topic && ch.topics[s.topic];
  document.title = (tp || ch || sub || ex).name + " · " + site;
}

// remember the scroll position of the page being left
window.addEventListener("hashchange", e => {
  scrollMemory[new URL(e.oldURL).hash || "#/"] = window.scrollY;
  route();
});

function crumbs(parts) {
  return `<nav class="crumb">` + parts.map((p, i) =>
    i === parts.length - 1
      ? `<span>${esc(p.label)}</span>`
      : `<button onclick='${p.action}'>${esc(p.label)}</button><span class="sep">/</span>`
  ).join("") + `</nav>`;
}

function render() {
  if (!DATA) return;
  const s = state;
  if (s.view === "home") return renderHome();
  const ex = DATA[s.exam];
  if (s.view === "exam") return renderExam(ex);
  const sub = ex.subjects[s.subject];
  if (s.view === "subject") return renderSubject(ex, sub);
  const ch = sub.chapters[s.chapter];
  if (s.view === "chapter") return renderChapter(ex, sub, ch);
  const tp = ch.topics[s.topic];
  if (s.view === "topic") return renderTopic(ex, sub, ch, tp);
  if (s.view === "academic") return renderAcademic(ex, sub, ch, tp);
  if (s.view === "teacher") return renderTeacher(ex, sub, ch, tp);
}

/* ---------- home ---------- */
function renderHome() {
  app.innerHTML = `
  <section class="hero">
    <h1>Every chapter, every subject, in one place.</h1>
    <p>Notes written to the exam syllabus, plus the notes your own teachers have shared. Free, and no sign-in needed.</p>
  </section>
  <div class="search">
    <input id="q" type="search" placeholder="Search a topic, e.g. reflection" autocomplete="off" aria-label="Search topics">
    <div id="res"></div>
  </div>
  <div class="sec-head">Choose your exam</div>
  <div class="exams">` +
  Object.entries(DATA).map(([id, e]) => {
    let tops = 0;
    Object.values(e.subjects).forEach(s => Object.values(s.chapters).forEach(c => tops += count(c.topics)));
    return `<button class="exam" onclick="go('exam',{exam:'${id}'})">
      <span class="ta">${esc(e.tamil || "")}</span>
      <span class="en">${esc(e.name)}</span>
      <span class="sub">${esc(e.desc)} · ${count(e.subjects)} subjects · ${tops} topics</span>
    </button>`;
  }).join("") + `</div>`;

  const q = document.getElementById("q"), res = document.getElementById("res");
  q.addEventListener("input", () => {
    const v = q.value.trim().toLowerCase();
    if (v.length < 2) { res.innerHTML = ""; return; }
    const hits = [];
    for (const [ei, e] of Object.entries(DATA))
      for (const [si, s] of Object.entries(e.subjects))
        for (const [ci, c] of Object.entries(s.chapters))
          for (const [ti, t] of Object.entries(c.topics))
            if (t.name.toLowerCase().includes(v) && hits.length < 8)
              hits.push({ ei, si, ci, ti, t, path: `${e.name} · ${s.name} · ${c.name}` });
    res.innerHTML = hits.length
      ? `<div class="results">` + hits.map(h =>
          `<button onclick="go('topic',{exam:'${h.ei}',subject:'${h.si}',chapter:'${h.ci}',topic:'${h.ti}'})">
            <div class="rt">${esc(h.t.name)}</div><div class="rp">${esc(h.path)}</div></button>`).join("") + `</div>`
      : `<div class="results"><button style="cursor:default"><div class="rt">Nothing found</div>
         <div class="rp">Try a shorter word, like "motion" or "cell"</div></button></div>`;
  });
}

/* ---------- exam ---------- */
function renderExam(ex) {
  app.innerHTML = crumbs([{ label: "Home", action: "go('home')" }, { label: ex.name }]) +
  `<h1 class="page-h">${esc(ex.name)}</h1>
   <p class="page-sub">${esc(ex.desc)} · pick a subject to see its chapters</p>
   <div class="list">` +
   Object.entries(ex.subjects).map(([id, s]) => {
     let t = 0; Object.values(s.chapters).forEach(c => t += count(c.topics));
     return `<button class="row" onclick="go('subject',{exam:'${state.exam}',subject:'${id}'})">
       <div class="body"><div class="t">${esc(s.name)}</div>
       <div class="m">${count(s.chapters)} chapters · ${t} topics</div></div>${chev}</button>`;
   }).join("") + `</div>
   <button class="back" onclick="go('home')">All exams</button>`;
}

/* ---------- subject ---------- */
function renderSubject(ex, sub) {
  app.innerHTML = crumbs([
    { label: "Home", action: "go('home')" },
    { label: ex.name, action: `go('exam',{exam:'${state.exam}'})` },
    { label: sub.name }]) +
  `<h1 class="page-h">${esc(sub.name)}</h1>
   <p class="page-sub">Chapters follow the ${esc(ex.name)} syllabus order</p>
   <div class="list">` +
   Object.entries(sub.chapters).map(([id, c], i) =>
     `<button class="row" onclick="go('chapter',{exam:'${state.exam}',subject:'${state.subject}',chapter:'${id}'})">
       <div class="num">${i + 1}</div>
       <div class="body"><div class="t">${esc(c.name)}</div><div class="m">${count(c.topics)} topics</div></div>${chev}</button>`
   ).join("") + `</div>
   <button class="back" onclick="go('exam',{exam:'${state.exam}'})">Back to ${esc(ex.name)}</button>`;
}

/* ---------- chapter ---------- */
function renderChapter(ex, sub, ch) {
  app.innerHTML = crumbs([
    { label: "Home", action: "go('home')" },
    { label: ex.name, action: `go('exam',{exam:'${state.exam}'})` },
    { label: sub.name, action: `go('subject',{exam:'${state.exam}',subject:'${state.subject}'})` },
    { label: ch.name }]) +
  `<h1 class="page-h">${esc(ch.name)}</h1>
   <p class="page-sub">Choose a topic to open its notes</p>
   <div class="list">` +
   Object.entries(ch.topics).map(([id, t]) =>
     `<button class="row" onclick="go('topic',{exam:'${state.exam}',subject:'${state.subject}',chapter:'${state.chapter}',topic:'${id}'})">
       <div class="body"><div class="t">${esc(t.name)}${t.academic ? `<span class="pill">notes ready</span>` : ""}</div></div>${chev}</button>`
   ).join("") + `</div>
   <button class="back" onclick="go('subject',{exam:'${state.exam}',subject:'${state.subject}'})">Back to ${esc(sub.name)}</button>`;
}

/* ---------- topic: the two buttons ---------- */
function renderTopic(ex, sub, ch, tp) {
  const teachers = tp.teacher || [];
  const base = `{exam:'${state.exam}',subject:'${state.subject}',chapter:'${state.chapter}',topic:'${state.topic}'}`;
  app.innerHTML = crumbs([
    { label: ex.name, action: `go('exam',{exam:'${state.exam}'})` },
    { label: sub.name, action: `go('subject',{exam:'${state.exam}',subject:'${state.subject}'})` },
    { label: ch.name, action: `go('chapter',{exam:'${state.exam}',subject:'${state.subject}',chapter:'${state.chapter}'})` },
    { label: tp.name }]) +
  `<h1 class="page-h">${esc(tp.name)}</h1>
   <p class="page-sub">Two ways to study this topic</p>
   <div class="gate">
     <button class="academic" onclick="go('academic',${base})">
       <span class="ic">&#128218;</span>
       <span><span class="gt">Academic notes</span>
       <span class="gd">The full explanation written to the ${esc(ex.name)} syllabus, with previous year questions.</span>
       <span class="tag">${tp.academic ? "Ready to read" : "Being written"}</span></span>
     </button>
     <button class="teacher" onclick="go('teacher',${base})">
       <span class="ic">&#9997;</span>
       <span><span class="gt">Teacher notes</span>
       <span class="gd">Notes and worked problems shared by government school teachers of Sivagangai.</span>
       <span class="tag">${teachers.length ? teachers.length + " shared" : "None shared yet"}</span></span>
     </button>
   </div>
   <button class="back" onclick="go('chapter',{exam:'${state.exam}',subject:'${state.subject}',chapter:'${state.chapter}'})">Back to ${esc(ch.name)}</button>`;
}

/* ---------- academic notes: markdown or pdf ---------- */
function renderAcademic(ex, sub, ch, tp) {
  const base = `{exam:'${state.exam}',subject:'${state.subject}',chapter:'${state.chapter}',topic:'${state.topic}'}`;
  const head = crumbs([
    { label: ch.name, action: `go('chapter',{exam:'${state.exam}',subject:'${state.subject}',chapter:'${state.chapter}'})` },
    { label: tp.name, action: `go('topic',${base})` },
    { label: "Academic notes" }]) +
    `<h1 class="page-h">${esc(tp.name)}</h1>
     <p class="page-sub">Academic notes · ${esc(ex.name)} syllabus</p>`;
  const backBtn = `<button class="back" onclick="go('topic',${base})">Back to the topic</button>`;

  if (!tp.academic) {
    app.innerHTML = head + `<div class="empty"><strong>These notes are being written</strong>
      Tell the Vidhya Vidhai team which chapters your students need first and we will write those next.</div>` + backBtn;
    return;
  }
  showFile(tp.academic, head, backBtn);
}

/* ---------- teacher notes ---------- */
function renderTeacher(ex, sub, ch, tp) {
  const list = tp.teacher || [];
  const base = `{exam:'${state.exam}',subject:'${state.subject}',chapter:'${state.chapter}',topic:'${state.topic}'}`;
  const head = crumbs([
    { label: ch.name, action: `go('chapter',{exam:'${state.exam}',subject:'${state.subject}',chapter:'${state.chapter}'})` },
    { label: tp.name, action: `go('topic',${base})` },
    { label: "Teacher notes" }]) +
    `<h1 class="page-h">${esc(tp.name)}</h1>
     <p class="page-sub">Teacher notes · shared by teachers in the district</p>`;
  const backBtn = `<button class="back" onclick="go('topic',${base})">Back to the topic</button>`;

  if (!list.length) {
    app.innerHTML = head + `<div class="empty"><strong>No teacher has shared notes for this topic yet</strong>
      When a teacher sends a PDF or a scanned notebook page for this topic, it appears here for every student.</div>` + backBtn;
    return;
  }
  const cards = list.map(d => `<div class="doc"><span class="dic">&#128196;</span>
     <span><span class="dt">${esc(d.title)}</span>
     <span class="dm">${esc(d.by || "")}${d.date ? " · " + esc(d.date) : ""}</span></span></div>`).join("");
  showFile(list[0].file, head + cards, backBtn);
}

/* ---------- the one function that opens any file ---------- */
function showFile(path, head, backBtn) {
  if (path.toLowerCase().endsWith(".pdf")) {
    app.innerHTML = head +
      `<a class="dl" href="${path}" download>Download this PDF</a>
       <object class="pdfbox" data="${path}" type="application/pdf">
         <div class="empty"><strong>Your phone cannot show PDFs inside the page</strong>
         Use the download button above to open it.</div>
       </object>` + backBtn;
    return;
  }
  app.innerHTML = head + `<p class="loading">Opening the notes…</p>` + backBtn;
  fetch(path)
    .then(r => { if (!r.ok) throw new Error(); return r.text(); })
    .then(md => {
      app.innerHTML = head + `<article class="note">${marked.parse(md)}</article>` + backBtn;
      prepareNote(app.querySelector(".note"));
      window.scrollTo(0, wantScroll);    // notes load a moment later, so scroll again
    })
    .catch(() => {
      app.innerHTML = head + `<div class="empty"><strong>That file could not be opened</strong>
        Check that the path in syllabus.json matches the real file name exactly, including capital letters.</div>` + backBtn;
    });
}

/* ---------- inside a note: contents list and jump links ----------
   Each heading gets a label (id) made from its text, for example
   "## 3. Blood Groups" gets "3-blood-groups". Notes with three or more
   main sections get a "Contents" list at the top that jumps to them.
   Wide tables get their own sideways scroll so phones show them fully. */
function slug(text) {
  return text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-");
}

function prepareNote(note) {
  const used = {};
  const heads = [...note.querySelectorAll("h2, h3, h4")];
  heads.forEach(h => {
    let id = slug(h.textContent) || "section";
    if (used[id]) id += "-" + used[id]++; else used[id] = 1;
    h.id = id;
  });

  const main = heads.filter(h => h.tagName === "H2");
  if (main.length >= 3) {
    const box = document.createElement("details");
    box.className = "toc";
    box.innerHTML = `<summary>Contents (${main.length} sections)</summary><ul>` +
      main.map(h => `<li><a href="#${h.id}">${esc(h.textContent)}</a></li>`).join("") + `</ul>`;
    note.prepend(box);
  }

  note.querySelectorAll("table").forEach(t => {
    const holder = document.createElement("div");
    holder.className = "table-scroll";
    t.replaceWith(holder);
    holder.appendChild(t);
  });
}

// links like "#3-blood-groups" scroll within the note instead of changing the page
app.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute("href").startsWith("#/")) return;   // "#/..." are page addresses
  e.preventDefault();
  const target = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
  if (!target) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
});

/* ---------- theme ---------- */
const tb = document.getElementById("themeBtn");
tb.onclick = () => {
  const dark = document.documentElement.getAttribute("data-theme") === "dark"
    || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
  tb.textContent = dark ? "Dark" : "Light";
};
