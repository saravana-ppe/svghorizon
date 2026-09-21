/* ============================================================
   Vidhya Vidhai Study Portal — app logic

   You should not need to edit this file to add content.
   To add a note:  put the file in notes/ or teacher-notes/,
                   then add one line in data/syllabus.json
   ============================================================ */

let DATA = null;
let state = { view: "home" };
const app = document.getElementById("app");

const count = o => Object.keys(o || {}).length;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const chev = `<svg class="chev" width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true"><path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

/* ---------- start up ---------- */
fetch("data/syllabus.json")
  .then(r => r.json())
  .then(json => { DATA = json.exams; render(); })
  .catch(() => {
    app.innerHTML = `<div class="empty"><strong>Could not load the syllabus</strong>
      If you opened index.html by double-clicking it, that is the reason. The browser blocks
      file loading from your hard disk. Push the site to GitHub and open it from the live
      address instead.</div>`;
  });

function go(view, p = {}) { state = { view, ...p }; window.scrollTo(0, 0); render(); }
window.go = go;

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
    .then(md => { app.innerHTML = head + `<article class="note">${marked.parse(md)}</article>` + backBtn; })
    .catch(() => {
      app.innerHTML = head + `<div class="empty"><strong>That file could not be opened</strong>
        Check that the path in syllabus.json matches the real file name exactly, including capital letters.</div>` + backBtn;
    });
}

/* ---------- theme ---------- */
const tb = document.getElementById("themeBtn");
tb.onclick = () => {
  const dark = document.documentElement.getAttribute("data-theme") === "dark"
    || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
  tb.textContent = dark ? "Dark" : "Light";
};
