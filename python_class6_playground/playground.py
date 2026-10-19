"""
PYTHON PLAYGROUND FOR CLASS 6
=============================

Start it by typing this in a terminal:

    python playground.py

Then just follow the instructions on the screen!
"""

import code
import json
import os
import runpy
import sys
import traceback

from lessons import LESSONS

HERE = os.path.dirname(os.path.abspath(__file__))
PROGRESS_FILE = os.path.join(HERE, "progress.json")
PROJECTS_DIR = os.path.join(HERE, "projects")

PROJECTS = [
    ("guess_the_number.py", "Guess the Number game", "while loops, if/else, random"),
    ("times_table_quiz.py", "Times Table Quiz", "for loops, input, scores"),
    ("simple_calculator.py", "Simple Calculator", "functions, if/elif"),
    ("story_maker.py", "Silly Story Maker", "strings, input, f-strings"),
    ("report_card.py", "Report Card", "lists, sum, max, min, functions"),
    ("turtle_art.py", "Turtle Drawing (opens a window)", "loops + drawing"),
]

# Simple explanations for the most common mistakes beginners make.
ERROR_HINTS = {
    "SyntaxError": "Python could not understand the grammar. Check for missing quotes \" \", "
                   "brackets ( ), or a colon : at the end of if / for / while / def lines.",
    "IndentationError": "The spaces at the start of a line are wrong. Lines inside if / for / "
                        "while / def must be pushed right by 4 spaces.",
    "NameError": "Python does not know that name. Did you spell it correctly? Did you create "
                 "the variable before using it? Did you forget quotes around text?",
    "TypeError": "You mixed types that don't fit together, like text + number. "
                 "Use str() to turn a number into text, or int() to turn text into a number.",
    "ValueError": "The value was not what Python expected. For example int(\"hello\") fails "
                  "because 'hello' is not a number.",
    "ZeroDivisionError": "You tried to divide by zero. Nobody can do that, not even Python!",
    "IndexError": "That position does not exist. Remember positions start at 0, so a list of "
                  "3 items has positions 0, 1 and 2.",
    "AttributeError": "That thing does not have that method. Check the spelling after the dot.",
    "TimeoutError": "Your program ran for too long. Is there a loop that never stops? "
                    "Check that something inside the loop changes so it can end.",
}


# ----------------------------------------------------------------- helpers
def line(char="=", width=60):
    print(char * width)


def title(text):
    print()
    line()
    print("  " + text)
    line()


def pause(message="Press Enter to continue..."):
    try:
        return input("\n" + message).strip().lower()
    except EOFError:
        print()
        return ""


def ask(prompt):
    try:
        return input(prompt).strip()
    except EOFError:
        print()
        return "q"


def show_code(source):
    print("\n  +--- CODE " + "-" * 44)
    for number, text in enumerate(source.splitlines(), start=1):
        print(f"  | {number:>2}  {text}")
    print("  +" + "-" * 53)


def error_hint(error_type):
    # Check the most specific error first (IndentationError is a kind of SyntaxError).
    for kind in getattr(error_type, "__mro__", ()):
        if kind.__name__ in ERROR_HINTS:
            return ERROR_HINTS[kind.__name__]
    return "Read the last line of the red message, it tells you what went wrong."


def explain_error(error_type):
    print(f"\n  HELPER: {error_hint(error_type)}")


def run_source(source):
    """Run some Python code and show its output (or a friendly error)."""
    print("\n  >>> OUTPUT:")
    try:
        exec(compile(source, "<your code>", "exec"), {"__name__": "__main__"})
    except KeyboardInterrupt:
        print("\n  (Stopped with Ctrl + C)")
    except Exception:
        error_type = sys.exc_info()[0]
        traceback.print_exc(limit=0, file=sys.stdout)
        explain_error(error_type)
    print("  <<< END OF OUTPUT")


# --------------------------------------------------------------- progress
def load_progress():
    try:
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"name": "", "stars": {}}


def save_progress(progress):
    try:
        with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
            json.dump(progress, f, indent=2)
    except OSError:
        pass  # Not being able to save should never stop the lesson.


# ---------------------------------------------------------------- sandbox
class FriendlyConsole(code.InteractiveConsole):
    """A normal Python console that also explains errors in simple words."""

    def showsyntaxerror(self, filename=None, **kwargs):
        super().showsyntaxerror(filename, **kwargs)
        explain_error(sys.exc_info()[0])

    def showtraceback(self):
        super().showtraceback()
        explain_error(sys.exc_info()[0])


def sandbox():
    title("SANDBOX - try anything you like!")
    print("  Type Python code and press Enter to run it.")
    print("  For if / for / while / def: type the lines, then press Enter on an")
    print("  empty line to finish.  Type  done  to go back to the menu.\n")
    console = FriendlyConsole()
    more = False
    while True:
        try:
            text = input("... " if more else ">>> ")
        except EOFError:
            print()
            break
        except KeyboardInterrupt:
            print("\n  (Cleared)")
            console.resetbuffer()
            more = False
            continue
        if not more and text.strip().lower() in ("done", "exit", "quit", "exit()", "quit()"):
            break
        try:
            more = console.push(text)
        except SystemExit:
            break


def write_program():
    """Let the student type a whole program, then run it."""
    print("\n  Type your program line by line. Use 4 spaces for indentation.")
    print("  When you are finished, type  run  on its own line.\n")
    lines = []
    while True:
        try:
            text = input(f"  {len(lines) + 1:>2} | ")
        except EOFError:
            print()
            break
        if text.strip().lower() == "run":
            break
        lines.append(text)
    if lines:
        run_source("\n".join(lines))


# ---------------------------------------------------------------- lessons
def run_quiz(lesson):
    title("QUIZ TIME!")
    score = 0
    for number, item in enumerate(lesson["quiz"], start=1):
        print(f"\n  Q{number}. {item['q']}")
        for i, option in enumerate(item["options"]):
            print(f"      {chr(65 + i)}) {option}")
        letters = [chr(65 + i) for i in range(len(item["options"]))]
        while True:
            reply = ask("  Your answer (A/B/C/D): ").upper()
            if reply in letters or reply == "Q":
                break
            print("  Please type one of:", ", ".join(letters))
        if reply == "Q":
            break
        if letters.index(reply) == item["answer"]:
            score += 1
            print("  CORRECT! Well done!")
        else:
            right = letters[item["answer"]]
            print(f"  Not quite. The answer is {right}) {item['options'][item['answer']]}")
        print(f"  Why: {item['why']}")
    total = len(lesson["quiz"])
    print(f"\n  You scored {score} out of {total}.")
    if score == total:
        print("  PERFECT SCORE! You are a Python star!")
    elif score >= total / 2:
        print("  Good job! Look again at the ones you missed.")
    else:
        print("  That's okay - every programmer learns by making mistakes. Try the lesson again!")
    return score


def run_challenge(lesson):
    challenge = lesson["challenge"]
    title("YOUR CHALLENGE")
    print("  " + challenge["task"])
    while True:
        print("\n  W = write and run your program   H = hint")
        print("  S = show the answer               Enter = finish lesson")
        choice = ask("  Choose: ").lower()
        if choice == "w":
            write_program()
        elif choice == "h":
            print("\n  HINT: " + challenge["hint"])
        elif choice == "s":
            print("\n  One possible answer (yours may be different and still correct!):")
            show_code(challenge["solution"])
            if ask("  Run it? (y/n): ").lower() == "y":
                run_source(challenge["solution"])
        else:
            return


def run_lesson(number, progress):
    lesson = LESSONS[number - 1]
    title(f"LESSON {number}: {lesson['title']}")
    print(f"  GOAL: {lesson['goal']}")
    steps = lesson["steps"]
    for step_number, step in enumerate(steps, start=1):
        print()
        line("-")
        print(f"  STEP {step_number} of {len(steps)}")
        line("-")
        print(step["explain"])
        show_code(step["code"])
        if pause("Press Enter to RUN this code (or Q to go back to menu): ") == "q":
            return
        run_source(step["code"])
        print("\n  Enter = next step   T = try it yourself in the sandbox   Q = menu")
        choice = pause("  Choose: ")
        if choice == "t":
            sandbox()
        elif choice == "q":
            return

    score = run_quiz(lesson)
    run_challenge(lesson)

    key = str(number)
    progress["stars"][key] = max(score, progress["stars"].get(key, 0))
    save_progress(progress)
    print(f"\n  Lesson {number} complete! Progress saved.")
    pause()


# --------------------------------------------------------------- projects
def projects_menu():
    while True:
        title("MINI PROJECTS - real programs made from what you learnt")
        for i, (_, name, uses) in enumerate(PROJECTS, start=1):
            print(f"  {i}. {name:<34} uses: {uses}")
        print("\n  Type a number to PLAY it, V + number to VIEW its code (e.g. V1),")
        print("  or press Enter to go back.")
        choice = ask("  Choose: ").lower()
        if not choice or choice == "q":
            return
        view = choice.startswith("v")
        digits = choice[1:] if view else choice
        if not digits.isdigit() or not 1 <= int(digits) <= len(PROJECTS):
            print("  Please choose a number from the list.")
            continue
        path = os.path.join(PROJECTS_DIR, PROJECTS[int(digits) - 1][0])
        if view:
            with open(path, encoding="utf-8") as f:
                show_code(f.read())
            print(f"  (This file is at: {path} - open it in an editor and change it!)")
            pause()
            continue
        print()
        try:
            runpy.run_path(path, run_name="__main__")
        except KeyboardInterrupt:
            print("\n  (Stopped)")
        except Exception:
            traceback.print_exc(limit=0, file=sys.stdout)
            explain_error(sys.exc_info()[0])
        pause()


# ------------------------------------------------------------------ menu
def main_menu(progress):
    while True:
        title(f"PYTHON PLAYGROUND - Welcome, {progress['name']}!")
        print("  Do the lessons in order. Each one builds on the one before.\n")
        for i, lesson in enumerate(LESSONS, start=1):
            stars = progress["stars"].get(str(i))
            if stars is None:
                badge = "[ ]"
            else:
                badge = "[*] " + "*" * stars
            print(f"  {i:>2}. {badge:<9} {lesson['title']}")
        print()
        print("   S. Sandbox  - type any Python and see what happens")
        print("   P. Projects - play and read real mini programs")
        print("   Q. Quit")
        choice = ask("\n  Type a lesson number or a letter: ").lower()
        if choice == "q":
            print(f"\n  Bye {progress['name']}! Keep coding every day!\n")
            return
        if choice == "s":
            sandbox()
        elif choice == "p":
            projects_menu()
        elif choice.isdigit() and 1 <= int(choice) <= len(LESSONS):
            run_lesson(int(choice), progress)
        else:
            print("  Hmm, I don't know that one. Try again!")


def main():
    progress = load_progress()
    title("HELLO, FUTURE PROGRAMMER!")
    print("  This playground teaches Python step by step.")
    print("  You will READ a little, SEE the code, RUN it, and then TRY it yourself.")
    if not progress["name"]:
        progress["name"] = ask("\n  What is your name? ") or "Coder"
        if progress["name"].lower() == "q":
            progress["name"] = "Coder"
        save_progress(progress)
    try:
        main_menu(progress)
    except KeyboardInterrupt:
        print("\n\n  Bye! Your progress is saved.\n")


if __name__ == "__main__":
    main()
