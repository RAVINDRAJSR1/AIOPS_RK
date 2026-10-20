"""Browser tests for the HTML playground. Run with:

    pip install playwright && playwright install chromium
    python -m unittest discover -s tests

Skipped when Playwright is not installed.
"""

import os
import pathlib
import unittest

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover
    sync_playwright = None

PAGE = pathlib.Path(__file__).resolve().parent.parent / "index.html"
CHROMIUM = os.environ.get("CHROMIUM_PATH")  # optional: a local Chromium binary

# A stand-in for the claude.ai viewer's database, so the shared-scorecard
# code path can be tested outside the viewer.
FAKE_VIEWER = """
window.__added = [];
(function () {
  const rows = [];
  let listener = null;
  const notify = () => listener && listener({ docs: rows.map(r => ({ id: r.id, data: () => r.data })) });
  const collection = {
    orderBy() { return this; }, limit() { return this; },
    onSnapshot(next) { listener = next; setTimeout(notify, 0); return () => {}; },
    async add(data) { const id = "d" + rows.length; rows.unshift({ id, data }); window.__added.push(data); setTimeout(notify, 0); return { id }; },
    doc(id) { return { delete: async () => { rows.splice(rows.findIndex(r => r.id === id), 1); notify(); } }; },
  };
  const db = { collection: () => collection };
  const user = { id: async () => "u_test", can: async () => true, canEdit: async () => true };
  window.claude = { use: async name => name === "db" ? db : name === "user" ? user : null };
})();
"""


@unittest.skipIf(sync_playwright is None, "Playwright is not installed")
class PageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def open(self, viewport=None, fake_db=False):
        context = self.browser.new_context(viewport=viewport or {"width": 1280, "height": 900}, has_touch=bool(viewport))
        # Fonts come from Google; don't let a slow network hold up the tests.
        context.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        if fake_db:
            context.add_init_script(FAKE_VIEWER)
        page = context.new_page()
        self.errors = []
        page.on("pageerror", lambda e: self.errors.append(str(e)))
        page.goto(PAGE.as_uri())
        self.addCleanup(context.close)
        return page

    def preview(self, page, index=0):
        return page.frame_locator("iframe.preview").nth(index)

    def finish_quiz_lesson1(self, page):
        page.click("nav >> text=Hello, HTML!")
        for _ in range(4):
            page.click("text=/Next step|Quiz time/")
        for answer in ["HyperText Markup Language", "</p>", "<p><b>Hi</b></p>"]:
            page.locator(".opt", has_text=answer).first.click()

    def test_live_preview_and_keys(self):
        page = self.open()
        self.assertEqual(self.preview(page).locator("h1").inner_text(), "Hello, World!")
        editor = page.locator("#editor-step")
        editor.fill("<h2>Changed</h2>")
        self.preview(page).locator("h2", has_text="Changed").wait_for()
        editor.fill("<p><b>bold")
        editor.press("End")
        page.click("text=Close tag")
        self.assertEqual(editor.input_value(), "<p><b>bold</b>")
        self.assertEqual(self.errors, [])

    def test_every_lesson_example_renders(self):
        page = self.open()
        count = page.evaluate("LESSONS.length")
        for i in range(count):
            steps = page.evaluate(f"LESSONS[{i}].steps.length")
            for s in range(steps):
                page.evaluate(f"go({{kind:'lesson', lesson:{i}, stage:'step', step:{s}}})")
                self.preview(page).locator("body").wait_for()
        self.assertEqual(self.errors, [])

    def test_every_solution_passes_its_checks(self):
        page = self.open()
        failures = page.evaluate("""async () => {
          const bad = [];
          for (const [i, lesson] of LESSONS.entries()) {
            const results = await runChecks(lesson.challenge.solution, lesson.challenge.checks);
            results.filter(r => !r.ok).forEach(r => bad.push((i + 1) + ': ' + r.msg));
            const empty = await runChecks('<p>nothing</p>', lesson.challenge.checks);
            if (empty.every(r => r.ok)) bad.push((i + 1) + ': checks pass on an empty page');
          }
          return bad;
        }""")
        self.assertEqual(failures, [])

    def test_quiz_challenge_and_scorecard_on_device(self):
        page = self.open()
        self.finish_quiz_lesson1(page)
        page.fill("#save-name", "Riya")
        page.click("form.savebox button")
        page.locator(".saved", has_text="Riya").wait_for()
        page.click("text=Your challenge →")
        page.click("text=Check my page")
        page.locator(".checks .no").first.wait_for()
        page.click("text=Show an answer")
        page.click("text=Put this answer in the editor")
        page.click("text=Check my page")
        page.locator(".saved", has_text="Challenge complete").wait_for()
        self.assertIn("done", page.locator("nav .nav-item").first.get_attribute("class"))

        page.click("nav >> text=Scorecard")
        self.assertIn("Saved on this device", page.inner_text(".badge"))
        self.assertEqual(page.inner_text(".tile >> nth=0 >> .value"), "100%")
        page.click("text=+ Add a score")
        page.fill("#add-title", "Class test: Lists")
        page.fill("#add-score", "6")
        page.fill("#add-total", "10")
        page.click("text=Save score")
        page.locator("table.log tbody tr", has_text="Class test: Lists").wait_for()
        self.assertEqual(page.locator("table.log tbody tr").count(), 3)
        self.assertEqual(page.locator("svg.chart circle[fill^='var(--s']").count(), 2)
        page.locator("table.log tbody tr", has_text="Class test").locator("button").click()
        page.locator("table.log tbody tr", has_text="Class test").locator("button", has_text="Tap to confirm").click()
        page.wait_for_function("document.querySelectorAll('table.log tbody tr').length === 2")
        self.assertEqual(self.errors, [])

    def test_scores_go_to_database_in_viewer(self):
        page = self.open(fake_db=True)
        page.evaluate("setStudent('Arjun')")
        self.finish_quiz_lesson1(page)
        page.locator(".saved", has_text="class database").wait_for()
        added = page.evaluate("window.__added")
        self.assertEqual(added[0]["student"], "Arjun")
        self.assertEqual((added[0]["score"], added[0]["total"], added[0]["kind"]), (3, 3, "quiz"))
        page.click("nav >> text=Scorecard")
        self.assertIn("Class database: live", page.inner_text(".badge"))
        self.assertEqual(page.locator("table.log tbody tr").count(), 1)

    def test_phone_layout(self):
        page = self.open(viewport={"width": 390, "height": 844})
        page.evaluate("setStudent('Sara')")
        for view in ["{kind:'lesson', lesson:6, stage:'step', step:1}", "{kind:'lesson', lesson:8, stage:'challenge'}",
                     "{kind:'lesson', lesson:2, stage:'quiz'}", "{kind:'scorecard'}"]:
            page.evaluate(f"go({view})")
            self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 390, view)
        # iOS zooms into text boxes smaller than 16px; make sure none are.
        small = page.evaluate("""[...document.querySelectorAll('input, select, textarea')]
            .filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).length""")
        self.assertEqual(small, 0)


if __name__ == "__main__":
    unittest.main()
