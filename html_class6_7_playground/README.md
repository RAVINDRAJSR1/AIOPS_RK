# HTML Playground for Class 6–7

A step-by-step HTML course for students aged 11–13. It is one web page that works on
computers, Chromebooks, tablets and phones (including iPhone and iPad on iOS 17 and later).
There is nothing to install.

## How to open it

| Where | What to do |
|-------|------------|
| **On a computer** | Double-click `index.html`. It opens in your browser. |
| **On a phone or tablet** | Open the GitHub Pages link (below) in Safari or Chrome. On iPhone, tap **Share → Add to Home Screen** to open it like an app. |
| **Share with the class** | Turn on GitHub Pages: repo **Settings → Pages → Deploy from a branch**, choose the branch and `/ (root)`, then **Save**. The course is then at `https://<your-username>.github.io/AIOPS_RK/html_class6_7_playground/` |

## How each lesson works

1. **Read** a short explanation with everyday examples (school timetable, science formulas, class marks).
2. **Edit** the example code. The **live preview** updates as you type.
3. **Quiz:** tap an answer to see right or wrong and why.
4. **Challenge:** build something yourself, then press **Check my page**. The page looks
   inside your HTML and ticks off each requirement (✓ / ✗). Hints and a model answer are available.

On phones there is a key bar with `<  >  /  =  "  Tab` and **Close tag**, because those are
hard to find on a phone keyboard.

## Lessons

| # | Lesson | You will learn |
|---|--------|----------------|
| 1 | Hello, HTML! | Tags, elements, nesting |
| 2 | Headings and Paragraphs | `<h1>`–`<h6>`, `<p>`, `<br>`, `<hr>`, comments |
| 3 | Bold, Italic and More | `<b>`, `<i>`, `<mark>`, `<sub>` (H₂O), `<sup>` (5²) |
| 4 | Lists | `<ul>`, `<ol>`, `<li>`, nested lists |
| 5 | Links | `<a href>`, `target="_blank"`, jumping inside a page |
| 6 | Pictures | `<img src alt>`, size, `<figure>` and captions |
| 7 | Tables | `<table>`, `<tr>`, `<th>`, `<td>`, `colspan` |
| 8 | Colours and Style | The `style` attribute, colour names and hex, a first look at CSS |
| 9 | Forms | Text boxes, radio buttons, checkboxes, drop-downs, buttons |
| 10 | A Complete Web Page | `<!DOCTYPE>`, `<head>`, `<body>`, `<header>`, `<nav>`, `<main>`, `<footer>` |

Plus **Free practice**, a blank editor that remembers your work. Built-in pictures you can
use anywhere: `cat.svg`, `sun.svg`, `tree.svg`, `rocket.svg`, `book.svg`.

## Scorecard

- Each student picks their name from the **Learner** menu at the top. On a shared computer,
  each student picks their own name before starting.
- Finishing a **quiz** or passing a **challenge** logs it automatically.
- Teachers and parents can tap **+ Add a score** to log class tests or worksheets
  (learner, what it was, score, out of, date).
- The scorecard shows the average score, the trend (recent scores compared with earlier
  ones), challenges passed, a **trend chart** for each learner, and a table of every score.
  Filter by learner to see one student's progress.

**Where scores are saved**

| Opened from | Scores are saved |
|-------------|------------------|
| The shared claude.ai link | In the link's **class database**: everyone using the link sees the same scorecard, live. Only editors can delete scores. |
| The file, or GitHub Pages | **In that browser on that device.** Each device keeps its own scorecard. |

## For teachers

- Add or change lessons by editing the `LESSONS` list near the top of the `<script>` in
  `index.html`. Copy one lesson block; the menu updates automatically.
- Challenge checks are CSS selectors, for example `{ sel: "ol > li", min: 4, msg: "..." }`.
- Run the browser tests: `pip install playwright && playwright install chromium`, then
  `python -m unittest discover -s tests`.
