"""
Runs student code for the web version of the playground (web/index.html).

The browser runs Python with Pyodide, which cannot pause a program to wait
for typing. So input() works by REPLAYING: when the program asks a question
we have no answer for yet, we stop and show the question. When the student
answers, the program runs again from the start with that answer filled in.
random is seeded the same way each time, so a replay behaves exactly the same.
"""

import contextlib
import io
import random
import sys
import traceback

from playground import error_hint

FILENAME = "<your code>"
MAX_LINES = 1_000_000  # stops loops that never end, so the page cannot freeze


class NeedInput(BaseException):
    """Raised when the program asks for more answers than we have.

    It is a BaseException so a student's own `except Exception:` cannot catch it.
    """


def run(source, answers=(), seed=0):
    """Run source and return what it printed.

    Returns a dict with:
      output  - everything printed (questions and answers included)
      error   - the error message, or "" if it worked
      hint    - a simple explanation of the error
      waiting - True if the program stopped to wait for an answer
    """
    answers = list(answers)
    out = io.StringIO()
    result = {"output": "", "error": "", "hint": "", "waiting": False}

    def fake_input(prompt=""):
        out.write(str(prompt))
        if not answers:
            raise NeedInput()
        answer = str(answers.pop(0))
        out.write(answer + "\n")
        return answer

    lines_run = 0

    def count_lines(frame, event, arg):
        nonlocal lines_run
        if event == "line":
            lines_run += 1
            if lines_run > MAX_LINES:
                raise TimeoutError("Your program ran for too long.")
        return count_lines

    def trace_student_code(frame, event, arg):
        return count_lines if frame.f_code.co_filename == FILENAME else None

    random.seed(seed)
    namespace = {"__name__": "__main__", "input": fake_input}
    with contextlib.redirect_stdout(out):
        try:
            program = compile(source, FILENAME, "exec")
            sys.settrace(trace_student_code)
            try:
                exec(program, namespace)
            finally:
                sys.settrace(None)
        except NeedInput:
            result["waiting"] = True
        except Exception as error:
            result["error"] = "".join(traceback.format_exception_only(type(error), error)).rstrip()
            result["hint"] = error_hint(type(error))
    result["output"] = out.getvalue()
    return result
