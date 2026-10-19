"""Checks that every lesson example, quiz and project works. Run with:

    python -m unittest discover -s tests
"""

import builtins
import contextlib
import io
import os
import runpy
import sys
import unittest
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import playground  # noqa: E402
from lessons import LESSONS  # noqa: E402


def fake_input(answers):
    replies = iter(answers)
    return lambda prompt="": next(replies)


def run_quietly(source, answers):
    out = io.StringIO()
    with mock.patch.object(builtins, "input", fake_input(answers)), contextlib.redirect_stdout(out):
        exec(compile(source, "<lesson>", "exec"), {"__name__": "__main__"})
    return out.getvalue()


class LessonTests(unittest.TestCase):
    def test_every_example_runs(self):
        for number, lesson in enumerate(LESSONS, start=1):
            for step in lesson["steps"]:
                with self.subTest(lesson=number, code=step["code"][:30]):
                    run_quietly(step["code"], ["7", "5", "python"])

    def test_every_solution_runs(self):
        for number, lesson in enumerate(LESSONS, start=1):
            with self.subTest(lesson=number):
                run_quietly(lesson["challenge"]["solution"], ["2014", "5"])

    def test_quiz_answers_are_valid(self):
        for number, lesson in enumerate(LESSONS, start=1):
            self.assertTrue(lesson["quiz"], f"lesson {number} has no quiz")
            for item in lesson["quiz"]:
                with self.subTest(lesson=number, q=item["q"]):
                    self.assertLessEqual(len(item["options"]), 4)
                    self.assertIn(item["answer"], range(len(item["options"])))

    def test_example_output(self):
        self.assertEqual(run_quietly(LESSONS[0]["steps"][2]["code"], []), "2 + 3\n5\n")
        self.assertIn("Sum of 1 to 10 is 55", run_quietly(LESSONS[6]["steps"][4]["code"], []))


class ProjectTests(unittest.TestCase):
    def run_project(self, name, answers):
        out = io.StringIO()
        with mock.patch.object(builtins, "input", fake_input(answers)), contextlib.redirect_stdout(out):
            runpy.run_path(os.path.join(playground.PROJECTS_DIR, name), run_name="__main__")
        return out.getvalue()

    def test_projects_are_listed(self):
        for filename, _, _ in playground.PROJECTS:
            self.assertTrue(os.path.exists(os.path.join(playground.PROJECTS_DIR, filename)))

    def test_guess_the_number(self):
        with mock.patch("random.randint", return_value=20):
            out = self.run_project("guess_the_number.py", ["10", "30", "20"])
        self.assertIn("in 3 tries", out)

    def test_times_table_quiz(self):
        with mock.patch("random.randint", return_value=3):
            out = self.run_project("times_table_quiz.py", ["9", "9", "9", "9", "1"])
        self.assertIn("You scored 4 out of 5", out)

    def test_calculator(self):
        self.assertIn("Answer: 12.0", self.run_project("simple_calculator.py", ["3", "*", "4"]))
        self.assertIn("Cannot divide", self.run_project("simple_calculator.py", ["3", "/", "0"]))

    def test_story_and_report(self):
        self.assertIn("The end.", self.run_project("story_maker.py", ["Raj", "cat", "rice", "Goa", "3"]))
        out = self.run_project("report_card.py", ["90", "80", "70", "95", "85"])
        self.assertIn("Grade:      A", out)


class PlaygroundTests(unittest.TestCase):
    def test_full_lesson_walkthrough(self):
        # Press Enter through every step, answer the quiz, then finish.
        lesson = LESSONS[0]
        answers = []
        for _ in lesson["steps"]:
            answers += ["", ""]
        answers += [chr(65 + q["answer"]) for q in lesson["quiz"]]
        answers += ["h", "", ""]
        progress = {"name": "Test", "stars": {}}
        out = io.StringIO()
        with mock.patch.object(builtins, "input", fake_input(answers)), \
                mock.patch.object(playground, "save_progress"), \
                contextlib.redirect_stdout(out):
            playground.run_lesson(1, progress)
        self.assertEqual(progress["stars"]["1"], len(lesson["quiz"]))
        self.assertIn("PERFECT SCORE", out.getvalue())

    def test_friendly_error(self):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            playground.run_source("print(score)")
        self.assertIn("HELPER: Python does not know that name", out.getvalue())

    def test_indentation_hint_is_specific(self):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            playground.run_source("if True:\nprint('x')")
        self.assertIn("spaces at the start", out.getvalue())


if __name__ == "__main__":
    unittest.main()
