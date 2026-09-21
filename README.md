# Vidhya Vidhai Study Portal

Free competitive exam notes for students of Sivagangai district.
No login, no app, works on any phone.

---

## How to add an academic note

**Step 1 — write the note.**
Create a file ending in `.md` inside the right folder:

```
notes/neet/physics/lenses.md
```

Write it in plain text. Only two marks matter:

```
# A big heading
## A smaller heading

Plain paragraphs need nothing at all.

- A bullet point
- Another bullet point

**Bold text** goes between two stars.
```

**Step 2 — point the site at it.**
Open `data/syllabus.json`, find the topic, and add the `academic` line:

```json
"lenses": {
  "name": "Lenses, lens formula and power",
  "academic": "notes/neet/physics/lenses.md"
}
```

**Step 3 — publish it.**

```
git add .
git commit -m "Added lenses notes"
git push
```

Wait one minute. It is live.

---

## How to add a PDF instead

Exactly the same, but point at a `.pdf` file:

```json
"academic": "notes/neet/physics/lenses.pdf"
```

The site works out the format from the file ending. Nothing else changes.

---

## How to add teacher notes

Copy the teacher's PDF into `teacher-notes/`, then add it under the topic:

```json
"teacher": [
  {
    "title": "Ray optics class notes",
    "by": "Mrs. R. Kalaiselvi, GHSS Sivagangai",
    "date": "12 September 2026",
    "file": "teacher-notes/neet/physics/ray-optics-kalaiselvi.pdf"
  }
]
```

Then `git add .` / `git commit` / `git push` as usual.

---

## How to add a whole new chapter

Only `data/syllabus.json` changes. Nothing else.

```json
"gravitation": {
  "name": "Gravitation",
  "topics": {
    "keplerlaws": { "name": "Kepler's laws" },
    "escapevelocity": { "name": "Escape velocity" }
  }
}
```

The chapter list, topic list and search pick it up on their own.

---

## Important: do not test by double-clicking

Opening `index.html` directly from your Desktop will show an error. Browsers
block a page from reading files off your hard disk. This is normal and is not a
mistake in the code.

Test it on the live GitHub Pages address instead.

---

## File name rules

- small letters only
- hyphens instead of spaces — `ray-optics.pdf`, not `Ray Optics.pdf`
- the path in `syllabus.json` must match the real file name exactly

Most problems come from a capital letter or a space in a file name.

---

## Folders

```
index.html           the page
style.css            how it looks
app.js               how it works
data/syllabus.json   every exam, subject, chapter and topic
notes/               academic notes you write
teacher-notes/       PDFs teachers give you
assets/              images and logos
```
