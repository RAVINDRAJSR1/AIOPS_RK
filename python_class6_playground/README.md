# 🐍 Python Playground for Class 6

An interactive, step-by-step Python course for students aged 10–12.
No experience needed. Everything runs in the terminal with plain Python, so there's nothing extra to install.

## ▶️ How to start

1. Install Python 3 from <https://www.python.org/downloads/> (on Windows, tick **"Add Python to PATH"**).
2. Open a terminal (Command Prompt on Windows) inside this folder.
3. Type:

   ```
   python playground.py
   ```

   (On Mac/Linux you may need `python3 playground.py`.)

## 🧭 How every lesson works

Each lesson follows the same 5 steps, so students always know what comes next:

| Step | What happens | Why it helps |
|------|--------------|--------------|
| 1. **READ** | A short explanation using everyday examples (boxes, school bags, recipes) | Connects new ideas to things they already know |
| 2. **SEE** | The example code is shown with line numbers | They look at real code before running it |
| 3. **RUN** | Press Enter and the code runs right there | They see what each instruction does |
| 4. **TRY** | Press `T` to open the sandbox and experiment | Changing the code and breaking it is how you learn |
| 5. **CHECK** | A quiz at the end of the lesson explains every answer, then a coding challenge (with hint and answer) | Checks they understood, and shows why |

Stars for each lesson are saved, so students can stop and continue later.

## 📚 Learning path (do them in order)

| # | Lesson | You will learn |
|---|--------|----------------|
| 1 | Hello, Python! | `print()`, running code top to bottom, comments |
| 2 | Variables | Storing values in labelled "boxes", naming rules |
| 3 | Numbers and Maths | `+ - * /`, quotient `//`, remainder `%`, power `**`, BODMAS |
| 4 | Strings | Joining and repeating text, `len()`, `.upper()`, indexes, f-strings |
| 5 | Input | `input()`, turning text into numbers with `int()` |
| 6 | Decisions | `if / elif / else`, comparisons, `and` / `or` |
| 7 | for Loops | `range()`, times tables, adding up numbers |
| 8 | while Loops | Repeating until something happens, `break` |
| 9 | Lists | Storing many items, `append`, `sum`, `max`, `min` |
| 10 | Functions | `def`, parameters, `return` |

After the lessons, try the **Projects** (press `P` in the menu):

| Project | Uses |
|---------|------|
| Guess the Number | while loops, if/else, random |
| Times Table Quiz | for loops, input, scores |
| Simple Calculator | functions, if/elif |
| Silly Story Maker | strings, input, f-strings |
| Report Card | lists, sum/max/min, functions |
| Turtle Drawing | loops and drawing shapes (opens a window) |

Students can play each project and press `V` to read its code. Every project file ends with
**"TRY THIS"** ideas for changing it, which is where real learning happens.

## 🧰 The Sandbox

Press `S` in the menu (or `T` during a lesson) to open a safe place to type any Python.
When something goes wrong, the playground explains the error in simple words. For example:

```
>>> print(scor)
NameError: name 'scor' is not defined

  HELPER: Python does not know that name. Did you spell it correctly? ...
```

## 👩‍🏫 Notes for teachers and parents

- **Time:** about 30–40 minutes per lesson. Lessons 6–10 may need two sessions.
- **Pair work:** one student types while the other reads the explanation, then they swap.
- **Ask "predict first":** before pressing Enter to run, ask *"What do you think it will print?"*
- **Mistakes are good:** encourage students to break the code on purpose and read the HELPER message.
- **Add your own lessons:** open `lessons.py` and copy one lesson block. The menu updates automatically.
- **Reset progress:** delete the `progress.json` file.

## 📁 Files

```
python_class6_playground/
├── playground.py      ← start here (the interactive playground)
├── lessons.py         ← all lesson text, examples, quizzes, challenges
├── projects/          ← mini programs to play, read and change
└── tests/             ← checks that every example works
```

To check that every lesson example works: `python -m unittest discover -s tests`
