# 🐍 Python Playground for Class 6

An interactive, step-by-step Python course for students aged 10–12.
No experience needed. Everything runs in the terminal with plain Python, so there's nothing extra to install.

## ▶️ How to run the playground

### Step 1: Install Python (one time only)

1. Go to <https://www.python.org/downloads/> and download Python 3 (version 3.8 or newer).
2. Run the installer. **On Windows, tick "Add Python to PATH"** on the first screen, then click *Install Now*.
3. To check it worked, open a terminal and type `python --version` (`python3 --version` on Mac).
   You should see something like `Python 3.12.4`.

### Step 2: Get the playground files

**Option A – Download ZIP (easiest, no Git needed)**
1. Open <https://github.com/RAVINDRAJSR1/AIOPS_RK> in your browser.
2. Click the green **Code** button, then **Download ZIP**.
3. Unzip it (right-click, then *Extract All* on Windows) and open the `python_class6_playground` folder.

**Option B – With Git**
```
git clone https://github.com/RAVINDRAJSR1/AIOPS_RK.git
cd AIOPS_RK/python_class6_playground
```

### Step 3: Start the playground

| Computer | What to do |
|----------|------------|
| **Windows** | Double-click **`run_playground.bat`** |
| **Mac / Linux** | Open Terminal in the folder and type `./run_playground.sh` |
| **Any computer (terminal)** | `python playground.py` (or `python3 playground.py` on Mac/Linux) |

> **Tip (Windows):** to open a terminal inside the folder, click the address bar in File Explorer,
> type `cmd` and press Enter.

### Or: run it in a web browser (no Python install needed)

The `web/` folder has a browser version with the same lessons, quizzes, challenges, sandbox and
projects. Python runs inside the browser using [Pyodide](https://pyodide.org) (real Python
compiled for the web), so it works on school computers, Chromebooks and tablets.

| How | What to do |
|-----|------------|
| **On your computer** | Double-click `web/index.html`. It opens in your browser (needs internet the first time to download Python). |
| **Share a link with the class** | Turn on GitHub Pages: repo **Settings → Pages → Deploy from a branch**, pick the branch and `/ (root)`, then **Save**. The page will be at `https://<your-username>.github.io/AIOPS_RK/python_class6_playground/web/` |

Differences from the terminal version:
- When a program uses `input()`, an answer box appears under the output. The program then runs
  again from the start with your answer filled in, so it looks just like typing in a terminal.
- A loop that never ends is stopped automatically, with a helper message explaining why.
- Progress (quiz stars) is saved in that browser.
- The Turtle Drawing project only works in the terminal version.

**Teachers:** after changing `lessons.py` or a project, run `python build_web.py` to copy the
changes into `web/index.html`.

### Step 4: Use it

1. Type your name when asked.
2. Type `1` and press Enter to start Lesson 1.
3. Keep pressing **Enter** to move forward. Press `T` to try code yourself, or `Q` to go back to the menu.
4. Type `Q` in the main menu to quit. Progress is saved automatically.

### If something goes wrong

| Problem | Fix |
|---------|-----|
| `'python' is not recognized` | Python is not on PATH. Re-run the installer, choose *Modify*, and tick *Add Python to environment variables*. Or try `py playground.py`. |
| `No such file or directory: playground.py` | You are in the wrong folder. `cd` into `python_class6_playground` first. |
| `Permission denied` on `./run_playground.sh` | Run `chmod +x run_playground.sh` once, or use `python3 playground.py`. |
| Program seems stuck | Press **Ctrl + C** to stop it. |
| Turtle project shows an error | It needs a computer with a screen (not an online editor). On Linux run `sudo apt install python3-tk`. |
| Want to start over | Delete the `progress.json` file. |

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

## ✅ Checking challenges

Every challenge has checks that test the student's program. In the browser, press
**Check my program**; in the terminal, write the program with `W`. The playground runs
the program, typing test answers into `input()` where needed, and ticks off each item.
For example, Lesson 6 checks that 5 prints Positive, -3 prints Negative and 0 prints Zero.
Teachers can change the checks in `lessons.py` (see the note at the top of that file).

## 📈 Scorecard (browser version)

- Each student picks their name from the **Learner** menu at the top.
- Finishing a **quiz** or passing a **challenge** logs it automatically.
- Teachers and parents can tap **+ Add a score** to log class tests.
- The **Scorecard** page shows the average score, the trend (recent scores compared with
  earlier ones), challenges passed, a **trend chart** for each learner, and every score.
  Filter by learner to see one student's progress.
- From the shared claude.ai link, scores go to the link's **class database**, so everyone
  sees the same scorecard. From the file or GitHub Pages, scores are saved in that browser.

On phones there is a key bar with `(  )  :  "  =  [  ]` and Tab, because those are hard to
find on a phone keyboard.

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
├── run_playground.bat  ← Windows: double-click to start
├── run_playground.sh   ← Mac/Linux: ./run_playground.sh
├── playground.py      ← the interactive playground
├── lessons.py         ← all lesson text, examples, quizzes, challenges
├── projects/          ← mini programs to play, read and change
├── web/index.html     ← browser version (open it in any browser)
├── web_runner.py      ← runs code for the browser version
├── build_web.py       ← copies lessons into web/index.html
└── tests/             ← checks that every example works
```

To check that every lesson example works: `python -m unittest discover -s tests`
