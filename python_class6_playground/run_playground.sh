#!/bin/sh
# Start the Python Playground on Mac or Linux:  ./run_playground.sh
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
    exec python3 playground.py
elif command -v python >/dev/null 2>&1; then
    exec python playground.py
else
    echo "Python is not installed yet. Download it from https://www.python.org/downloads/"
    exit 1
fi
