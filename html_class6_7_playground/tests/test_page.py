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
class BrowserTest(unittest.TestCase):
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


@unittest.skipIf(sync_playwright is None, "Playwright is not installed")
class PageTests(BrowserTest):
    def test_live_preview_and_keys(self):
        page = self.open()
        page.click("nav >> text=Hello, HTML!")
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
        self.assertIn("done", page.locator("nav .nav-item", has_text="Hello, HTML!").get_attribute("class"))

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


# One passing answer for each Chapter 9 mission (required checks only).
MISSION_ANSWERS = {
    "lists": '<ol type="1"><li>a</li><li>b</li><li>c</li><li>d</li></ol><ul type="square"><li>x</li></ul>',
    "images": '<img src="tree.svg" alt="A green tree" width="100" height="90">',
    "links": '<h2 id="top">Top</h2><a href="https://www.wikipedia.org">Wiki</a> <a href="#top">Up</a> <a href="page2.html">Next</a>',
    "marquee": '<marquee behavior="alternate">Hi</marquee>',
    "build": '<ol type="A"><li>Chess</li><li>Cricket</li><li>Kho-kho</li></ol><ul type="square"><li>Bat</li></ul>'
             '<img src="football.svg" alt="Football" width="80" height="80"><a href="https://fifa.com">FIFA</a>',
    "fix": '<img src="rocket.svg" alt="A red rocket" width="120" height="120">'
           '<p>Visit <a href="https://en.wikipedia.org/wiki/Rocket">the rocket page</a></p>'
           '<ol type="a"><li>Three</li><li>Two</li><li>One</li></ol>',
    "exit": '<h2>Cities</h2><ol type="1"><li>Mumbai</li><li>Chennai</li><li>Pune</li></ol>'
            '<h2>States</h2><ul type="square"><li>Kerala</li><li>Punjab</li><li>Bihar</li></ul>'
            '<h2>Union territories</h2><ol type="i"><li>Ladakh</li><li>Puducherry</li><li>Chandigarh</li></ol>',
}


@unittest.skipIf(sync_playwright is None, "Playwright is not installed")
class Chapter9Tests(BrowserTest):
    def test_page_starts_with_the_hook(self):
        page = self.open()
        self.assertIn("Hook", page.inner_text("main h2"))
        self.assertEqual(page.locator(".hook iframe").count(), 2)
        self.assertIn("My Favorite Things", page.frame_locator(".hook iframe").nth(1).locator("h2").inner_text())
        self.assertIn("Chapter 9", page.text_content("nav .nav-label >> nth=0"))
        self.assertEqual(self.errors, [])

    def test_every_mission_answer_passes_and_starters_do_not(self):
        page = self.open()
        result = page.evaluate("""answers => MISSIONS.filter(m => m.checks.length).map(m => {
            const run = code => { const d = new DOMParser().parseFromString(code, 'text/html');
              return m.checks.filter(c => !c.opt).every(c => c.test(d, code)); };
            return [m.id, run(answers[m.id] || ''), run(m.starter)];
        })""", MISSION_ANSWERS)
        for mission_id, answer_ok, starter_ok in result:
            self.assertTrue(answer_ok, mission_id)
            self.assertFalse(starter_ok, mission_id)

    def test_predict_run_and_complete_a_mission(self):
        page = self.open()
        page.evaluate("setStudent('Kabir')")
        page.locator("nav .nav-item", has_text="Lists").first.click()
        self.assertTrue(page.locator(".veil").is_visible())
        lock = page.locator("text=Lock prediction and run")
        self.assertTrue(lock.is_disabled())
        page.fill("#predict-lists", "Letters become roman numerals")
        lock.click()
        self.assertFalse(page.locator(".veil").is_visible())
        page.get_by_role("button", name='ol type="i"', exact=True).click()
        self.assertIn('<ol type="i">', page.input_value("#editor-mission"))
        page.get_by_role("button", name='ul type="square"', exact=True).click()
        page.locator("#editor-mission").fill(page.input_value("#editor-mission").replace("</ol>", "  <li>Sleep</li>\n</ol>"))
        page.locator(".saved", has_text="Kabir").wait_for()
        self.assertEqual(page.locator(".checklist li.ok").count(), 3)
        self.assertIn("done", page.locator("nav .nav-item", has_text="Lists").first.get_attribute("class"))
        self.assertEqual(self.errors, [])

    def test_links_explain_where_they_go(self):
        page = self.open()
        page.click("nav >> text=Links & colors")
        page.fill("#predict-links", "It opens Wikipedia")
        page.click("text=Lock prediction and run")
        page.frame_locator("iframe.preview").locator("a", has_text="More information").click()
        page.locator(".preview-note", has_text="Global link").wait_for()

    def test_chapter_test(self):
        page = self.open()
        page.evaluate("setStudent('Meera')")
        page.click("nav >> text=Chapter test")
        check = page.locator("text=Check my answers")
        self.assertTrue(check.is_disabled())
        answers = page.evaluate("CH9_QUIZ.map(q => q.a)")
        for i, a in enumerate(answers):
            page.locator(f"input[name=ch9q{i}][value='{a}']").check()
        check.click()
        page.locator(".big-score", has_text="Score: 12 of 12").wait_for()
        page.locator(".saved", has_text="Meera").wait_for()
        self.assertIn("done", page.locator("nav .nav-item", has_text="Chapter test").get_attribute("class"))


if __name__ == "__main__":
    unittest.main()
