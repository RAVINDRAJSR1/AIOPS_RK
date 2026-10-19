"""
Copies the lessons and projects into web/index.html.

Run this after changing lessons.py, playground.py, web_runner.py or a project:

    python build_web.py
"""

import json
import os

from lessons import LESSONS
from playground import HERE, PROJECTS, PROJECTS_DIR

PAGE = os.path.join(HERE, "web", "index.html")
START = "<!-- PLAYGROUND DATA START (made by build_web.py, do not edit) -->"
END = "<!-- PLAYGROUND DATA END -->"
WEB_SKIP = {"turtle_art.py"}  # turtle needs a desktop window


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def page_data():
    projects = []
    for filename, name, uses in PROJECTS:
        if filename not in WEB_SKIP:
            code = read(os.path.join(PROJECTS_DIR, filename))
            projects.append({"name": name, "uses": uses, "code": code})
    python_files = {
        name: read(os.path.join(HERE, name))
        for name in ("lessons.py", "playground.py", "web_runner.py")
    }
    return {"lessons": LESSONS, "projects": projects, "files": python_files}


def build(page_text):
    data = json.dumps(page_data(), ensure_ascii=False).replace("</", "<\\/")
    block = f'{START}\n<script id="playground-data" type="application/json">{data}</script>\n{END}'
    before, rest = page_text.split(START, 1)
    after = rest.split(END, 1)[1]
    return before + block + after


def main():
    new_text = build(read(PAGE))
    with open(PAGE, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("Updated", PAGE)


if __name__ == "__main__":
    main()
