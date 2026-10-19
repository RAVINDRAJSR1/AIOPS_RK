"""
All the lessons for the Python Playground.

Each lesson has:
  - title      : name of the lesson
  - goal       : what you will be able to do after the lesson
  - steps      : small steps, each with an explanation and a code example
  - quiz       : questions to check you understood
  - challenge  : a small task to try on your own (with a hint and an answer)

Teachers: you can add your own lessons by copying one block below.
"""

LESSONS = [
    # ------------------------------------------------------------------ 1
    {
        "title": "Hello, Python!",
        "goal": "Make the computer show messages on the screen using print().",
        "steps": [
            {
                "explain": (
                    "A computer is very fast but it cannot think on its own.\n"
                    "We give it INSTRUCTIONS. A list of instructions is called a PROGRAM.\n"
                    "Python is a language we use to write those instructions.\n\n"
                    "The first instruction we learn is print(). It shows a message.\n"
                    "The message goes inside the brackets, inside quotes \" \"."
                ),
                "code": 'print("Hello, World!")',
            },
            {
                "explain": (
                    "Python runs the lines one by one, from TOP to BOTTOM,\n"
                    "just like you read a book."
                ),
                "code": (
                    'print("Good morning!")\n'
                    'print("My name is Python.")\n'
                    'print("I love to help students.")'
                ),
            },
            {
                "explain": (
                    "print() can also do maths! Numbers do NOT need quotes.\n"
                    "Look at the difference: with quotes Python shows the text as it is,\n"
                    "without quotes Python calculates the answer."
                ),
                "code": (
                    'print("2 + 3")\n'
                    "print(2 + 3)"
                ),
            },
            {
                "explain": (
                    "Lines starting with # are COMMENTS. Python ignores them.\n"
                    "We write comments to leave notes for humans."
                ),
                "code": (
                    "# This line is a note. Python skips it.\n"
                    'print("Comments are invisible to Python!")'
                ),
            },
        ],
        "quiz": [
            {
                "q": "Which instruction shows a message on the screen?",
                "options": ["show()", "print()", "write()", "say()"],
                "answer": 1,
                "why": "print() is Python's way of showing things on the screen.",
            },
            {
                "q": 'What will print(4 + 4) show?',
                "options": ["4 + 4", "44", "8", "Error"],
                "answer": 2,
                "why": "No quotes, so Python does the maths: 4 + 4 = 8.",
            },
            {
                "q": 'What will print("4 + 4") show?',
                "options": ["4 + 4", "8", "44", "Error"],
                "answer": 0,
                "why": "With quotes it is just text, so Python shows it exactly.",
            },
        ],
        "challenge": {
            "task": "Write a program that prints your name on one line and your school on the next line.",
            "hint": "Use print() two times. Put your words inside quotes.",
            "solution": 'print("Riya Sharma")\nprint("Green Valley School")',
        },
    },
    # ------------------------------------------------------------------ 2
    {
        "title": "Variables - Boxes with Labels",
        "goal": "Store information in variables and use it later.",
        "steps": [
            {
                "explain": (
                    "Imagine a box with a LABEL on it. You can keep something inside the box\n"
                    "and later find it using the label. In Python this box is called a VARIABLE.\n\n"
                    "   name = \"Aarav\"\n\n"
                    "means: make a box labelled  name  and put \"Aarav\" inside it.\n"
                    "The = sign means 'put into', NOT 'is equal to' like in maths."
                ),
                "code": (
                    'name = "Aarav"\n'
                    "age = 11\n"
                    "print(name)\n"
                    "print(age)"
                ),
            },
            {
                "explain": (
                    "You can change what is inside the box. The old value is thrown away\n"
                    "and the new value is kept."
                ),
                "code": (
                    'favourite_fruit = "Mango"\n'
                    "print(favourite_fruit)\n"
                    'favourite_fruit = "Banana"\n'
                    "print(favourite_fruit)"
                ),
            },
            {
                "explain": (
                    "print() can show many things together. Separate them with commas.\n"
                    "Python puts a space between each one automatically."
                ),
                "code": (
                    'name = "Meera"\n'
                    "marks = 95\n"
                    'print(name, "scored", marks, "marks")'
                ),
            },
            {
                "explain": (
                    "Rules for naming boxes (variables):\n"
                    "  - Use letters, numbers and _ (underscore)\n"
                    "  - Do NOT start with a number      (2cats is wrong, cats2 is OK)\n"
                    "  - No spaces                       (my age is wrong, my_age is OK)\n"
                    "  - Capital letters matter          (Age and age are DIFFERENT boxes)\n"
                    "Choose names that tell you what is inside!"
                ),
                "code": (
                    "number_of_students = 40\n"
                    "class_name = \"6-B\"\n"
                    'print("Class", class_name, "has", number_of_students, "students")'
                ),
            },
        ],
        "quiz": [
            {
                "q": "In  score = 10  what does the = sign do?",
                "options": [
                    "Checks if score is 10",
                    "Puts 10 into the box called score",
                    "Prints 10",
                    "Adds 10 to score",
                ],
                "answer": 1,
                "why": "= means 'store this value in this variable'.",
            },
            {
                "q": "Which is a CORRECT variable name?",
                "options": ["my name", "2nd_place", "total_marks", "class-6"],
                "answer": 2,
                "why": "total_marks uses only letters and _, and does not start with a number.",
            },
            {
                "q": "x = 5, then x = 9. What does print(x) show?",
                "options": ["5", "9", "14", "5 9"],
                "answer": 1,
                "why": "The box keeps only the newest value, which is 9.",
            },
        ],
        "challenge": {
            "task": "Make variables for your pet's name and its age, then print: 'Tommy is 3 years old'.",
            "hint": "pet = \"Tommy\" and pet_age = 3, then print(pet, \"is\", pet_age, \"years old\")",
            "solution": 'pet = "Tommy"\npet_age = 3\nprint(pet, "is", pet_age, "years old")',
        },
    },
    # ------------------------------------------------------------------ 3
    {
        "title": "Numbers and Maths",
        "goal": "Use Python as a super calculator.",
        "steps": [
            {
                "explain": (
                    "Python knows maths! These are the maths signs (OPERATORS):\n"
                    "   +   add\n"
                    "   -   subtract\n"
                    "   *   multiply   (a star, not x)\n"
                    "   /   divide"
                ),
                "code": (
                    "print(10 + 5)\n"
                    "print(10 - 5)\n"
                    "print(10 * 5)\n"
                    "print(10 / 5)"
                ),
            },
            {
                "explain": (
                    "Two more useful ones you learnt in division:\n"
                    "   //  QUOTIENT   (how many whole times it goes in)\n"
                    "   %   REMAINDER  (what is left over)\n"
                    "   **  POWER      (2 ** 3 means 2 x 2 x 2)\n\n"
                    "Example: 17 sweets shared among 5 friends."
                ),
                "code": (
                    'print("Each friend gets:", 17 // 5)\n'
                    'print("Sweets left over:", 17 % 5)\n'
                    'print("2 to the power 3 is:", 2 ** 3)'
                ),
            },
            {
                "explain": (
                    "Python follows BODMAS, just like your maths class.\n"
                    "Brackets are solved first, then multiply/divide, then add/subtract."
                ),
                "code": (
                    "print(2 + 3 * 4)\n"
                    "print((2 + 3) * 4)"
                ),
            },
            {
                "explain": (
                    "Numbers in variables can be used for maths too.\n"
                    "Let's find the area and perimeter of a rectangle."
                ),
                "code": (
                    "length = 8\n"
                    "breadth = 5\n"
                    "area = length * breadth\n"
                    "perimeter = 2 * (length + breadth)\n"
                    'print("Area =", area)\n'
                    'print("Perimeter =", perimeter)'
                ),
            },
            {
                "explain": (
                    "Two kinds of numbers:\n"
                    "   int   = whole numbers   like 7, 100, -3\n"
                    "   float = decimal numbers like 3.5, 99.9\n"
                    "Normal division / always gives a float."
                ),
                "code": (
                    "price = 45.50\n"
                    "quantity = 2\n"
                    'print("Total cost:", price * quantity)\n'
                    "print(9 / 3)"
                ),
            },
        ],
        "quiz": [
            {
                "q": "What does 20 % 6 give?",
                "options": ["3", "2", "14", "120"],
                "answer": 1,
                "why": "20 divided by 6 is 3 with remainder 2. % gives the remainder.",
            },
            {
                "q": "What is 3 + 2 * 5 in Python?",
                "options": ["25", "13", "30", "10"],
                "answer": 1,
                "why": "Multiply first (BODMAS): 2*5 = 10, then 3+10 = 13.",
            },
            {
                "q": "Which sign is used to MULTIPLY in Python?",
                "options": ["x", "X", "*", "."],
                "answer": 2,
                "why": "Python uses the star * for multiplication.",
            },
        ],
        "challenge": {
            "task": "A box has 7 rows of 12 chocolates. Store rows and per_row in variables and print the total.",
            "hint": "total = rows * per_row",
            "solution": 'rows = 7\nper_row = 12\ntotal = rows * per_row\nprint("Total chocolates:", total)',
        },
    },
    # ------------------------------------------------------------------ 4
    {
        "title": "Strings - Playing with Text",
        "goal": "Join, repeat and change text.",
        "steps": [
            {
                "explain": (
                    "Text in Python is called a STRING (like letters on a string of beads).\n"
                    "A string is always inside quotes. You can use \" \" or ' '."
                ),
                "code": (
                    'city = "Delhi"\n'
                    "river = 'Ganga'\n"
                    "print(city)\n"
                    "print(river)"
                ),
            },
            {
                "explain": (
                    "+ with strings JOINS them (stick them together).\n"
                    "* with strings REPEATS them."
                ),
                "code": (
                    'first = "Ice"\n'
                    'second = "cream"\n'
                    "print(first + second)\n"
                    'print("Ha" * 3)\n'
                    'print("-" * 20)'
                ),
            },
            {
                "explain": (
                    "Strings have built-in tricks called METHODS. We use a dot to call them.\n"
                    "   .upper()  -> CAPITAL LETTERS\n"
                    "   .lower()  -> small letters\n"
                    "   len()     -> counts the characters (letters, spaces, everything)"
                ),
                "code": (
                    'word = "Python"\n'
                    "print(word.upper())\n"
                    "print(word.lower())\n"
                    "print(len(word))"
                ),
            },
            {
                "explain": (
                    "Each letter has a position number called an INDEX.\n"
                    "IMPORTANT: counting starts at 0, not 1!\n\n"
                    "    P  y  t  h  o  n\n"
                    "    0  1  2  3  4  5"
                ),
                "code": (
                    'word = "Python"\n'
                    "print(word[0])\n"
                    "print(word[3])\n"
                    "print(word[-1])   # -1 means the LAST letter"
                ),
            },
            {
                "explain": (
                    "An f-string is the easiest way to mix text and variables.\n"
                    "Put f before the quotes and put variables inside { }."
                ),
                "code": (
                    'name = "Kabir"\n'
                    "age = 12\n"
                    'print(f"Hi, I am {name} and I am {age} years old.")'
                ),
            },
        ],
        "quiz": [
            {
                "q": 'What does "Hi" + "Hi" give?',
                "options": ["Hi Hi", "HiHi", "2Hi", "Error"],
                "answer": 1,
                "why": "+ sticks strings together with no space in between.",
            },
            {
                "q": 'What is len("cat")?',
                "options": ["2", "3", "4", "cat"],
                "answer": 1,
                "why": "c, a, t = 3 characters.",
            },
            {
                "q": 'word = "India". What is word[0]?',
                "options": ["n", "I", "a", "d"],
                "answer": 1,
                "why": "Index starts at 0, so word[0] is the first letter, I.",
            },
        ],
        "challenge": {
            "task": "Store your name in a variable. Print it in CAPITALS and print how many letters it has.",
            "hint": "Use .upper() and len().",
            "solution": 'name = "Ananya"\nprint(name.upper())\nprint(len(name))',
        },
    },
    # ------------------------------------------------------------------ 5
    {
        "title": "Input - Talking to the Computer",
        "goal": "Ask the user questions and use their answers.",
        "steps": [
            {
                "explain": (
                    "So far our programs only TALK. Now they will LISTEN too!\n"
                    "input() shows a question, waits for you to type, and gives back your answer.\n"
                    "We usually store the answer in a variable.\n\n"
                    "When you run this, type your name and press Enter."
                ),
                "code": (
                    'name = input("What is your name? ")\n'
                    'print("Nice to meet you,", name)'
                ),
            },
            {
                "explain": (
                    "input() ALWAYS gives back a STRING (text), even if you type a number.\n"
                    "\"5\" + \"5\" joins text and gives \"55\" - not what we want for maths!\n"
                    "Use int() to change text into a whole number.\n\n"
                    "Type two numbers when asked."
                ),
                "code": (
                    'a = int(input("Enter first number: "))\n'
                    'b = int(input("Enter second number: "))\n'
                    'print("Sum is", a + b)'
                ),
            },
            {
                "explain": (
                    "Converting types:\n"
                    "   int(\"12\")    -> 12     (text to whole number)\n"
                    "   float(\"2.5\") -> 2.5    (text to decimal)\n"
                    "   str(12)      -> \"12\"   (number to text)"
                ),
                "code": (
                    'print("5" + "5")\n'
                    'print(int("5") + int("5"))\n'
                    'print("I have " + str(3) + " pencils")'
                ),
            },
        ],
        "quiz": [
            {
                "q": "What type of value does input() give back?",
                "options": ["Always a number", "Always a string (text)", "A list", "Nothing"],
                "answer": 1,
                "why": "input() always gives text. Use int() or float() for numbers.",
            },
            {
                "q": 'What does int("7") + 3 give?',
                "options": ["73", "10", "Error", "7 3"],
                "answer": 1,
                "why": 'int("7") is the number 7, and 7 + 3 = 10.',
            },
        ],
        "challenge": {
            "task": "Ask the user for their birth year and print how old they will be in 2030.",
            "hint": "year = int(input(...)) then age = 2030 - year",
            "solution": 'year = int(input("Which year were you born? "))\nprint("In 2030 you will be", 2030 - year)',
        },
    },
    # ------------------------------------------------------------------ 6
    {
        "title": "Decisions with if / elif / else",
        "goal": "Make the program choose what to do.",
        "steps": [
            {
                "explain": (
                    "Every day you make decisions:\n"
                    "   IF it is raining, take an umbrella.\n"
                    "Python can do this too, using  if.\n\n"
                    "To compare things we use these signs:\n"
                    "   ==  equal to        (TWO = signs! One = means 'store')\n"
                    "   !=  not equal to\n"
                    "   >   greater than     <   less than\n"
                    "   >=  greater or equal <=  less or equal\n"
                    "A comparison gives True or False."
                ),
                "code": (
                    "print(5 > 3)\n"
                    "print(5 < 3)\n"
                    "print(10 == 10)\n"
                    'print("cat" != "dog")'
                ),
            },
            {
                "explain": (
                    "The if line ends with a colon  :\n"
                    "The lines that belong to it are pushed right (INDENTED) by 4 spaces.\n"
                    "Those lines run ONLY if the condition is True."
                ),
                "code": (
                    "temperature = 38\n"
                    "if temperature > 35:\n"
                    '    print("It is very hot! Drink water.")\n'
                    'print("Have a nice day!")'
                ),
            },
            {
                "explain": (
                    "else = what to do when the condition is False.\n"
                    "Let's check if a number is even or odd (remember % gives remainder)."
                ),
                "code": (
                    "number = 7\n"
                    "if number % 2 == 0:\n"
                    '    print(number, "is EVEN")\n'
                    "else:\n"
                    '    print(number, "is ODD")'
                ),
            },
            {
                "explain": (
                    "elif means 'else if'. It lets us check many choices one after another.\n"
                    "Python stops at the FIRST one that is True."
                ),
                "code": (
                    "marks = 82\n"
                    "if marks >= 90:\n"
                    '    print("Grade A+")\n'
                    "elif marks >= 75:\n"
                    '    print("Grade A")\n'
                    "elif marks >= 50:\n"
                    '    print("Grade B")\n'
                    "else:\n"
                    '    print("Keep practising!")'
                ),
            },
            {
                "explain": (
                    "Join conditions with  and  /  or :\n"
                    "   and -> BOTH must be True\n"
                    "   or  -> at least ONE must be True"
                ),
                "code": (
                    "age = 12\n"
                    "has_ticket = True\n"
                    "if age >= 10 and has_ticket:\n"
                    '    print("You can enter the science show!")\n'
                    'day = "Sunday"\n'
                    'if day == "Saturday" or day == "Sunday":\n'
                    '    print("Holiday!")'
                ),
            },
        ],
        "quiz": [
            {
                "q": "Which sign CHECKS if two things are equal?",
                "options": ["=", "==", "===", "=>"],
                "answer": 1,
                "why": "== compares. A single = stores a value in a variable.",
            },
            {
                "q": "What must come at the end of an if line?",
                "options": [". (dot)", "; (semicolon)", ": (colon)", "Nothing"],
                "answer": 2,
                "why": "if, elif and else lines always end with a colon :",
            },
            {
                "q": "x = 4.  if x > 10: print('Big')  else: print('Small').  What is shown?",
                "options": ["Big", "Small", "Big Small", "Nothing"],
                "answer": 1,
                "why": "4 > 10 is False, so the else part runs.",
            },
        ],
        "challenge": {
            "task": "Ask for a number. Print 'Positive', 'Negative' or 'Zero'.",
            "hint": "Use if n > 0, elif n < 0, else.",
            "solution": (
                'n = int(input("Enter a number: "))\n'
                "if n > 0:\n"
                '    print("Positive")\n'
                "elif n < 0:\n"
                '    print("Negative")\n'
                "else:\n"
                '    print("Zero")'
            ),
        },
    },
    # ------------------------------------------------------------------ 7
    {
        "title": "for Loops - Repeat Without Getting Tired",
        "goal": "Repeat instructions many times with a for loop.",
        "steps": [
            {
                "explain": (
                    "Your teacher says: 'Write I will not talk in class 5 times.'\n"
                    "Boring! A LOOP repeats instructions for us.\n\n"
                    "range(5) gives the numbers 0, 1, 2, 3, 4  (5 numbers, starting at 0).\n"
                    "The indented lines run once for each number."
                ),
                "code": (
                    "for i in range(5):\n"
                    '    print("I will practise Python!")'
                ),
            },
            {
                "explain": (
                    "The variable (here  i ) holds the current number each time round.\n"
                    "range(1, 6) starts at 1 and stops BEFORE 6."
                ),
                "code": (
                    "for i in range(1, 6):\n"
                    '    print("Round number", i)'
                ),
            },
            {
                "explain": (
                    "A third number in range is the STEP (how much to jump).\n"
                    "range(2, 21, 2) gives 2, 4, 6 ... 20  (even numbers)."
                ),
                "code": (
                    "for n in range(2, 21, 2):\n"
                    '    print(n, end=" ")\n'
                    "print()\n"
                    "# Counting down for a rocket!\n"
                    "for n in range(5, 0, -1):\n"
                    "    print(n)\n"
                    'print("Blast off!")'
                ),
            },
            {
                "explain": (
                    "Let's make a multiplication table - in just 2 lines!"
                ),
                "code": (
                    "number = 7\n"
                    "for i in range(1, 11):\n"
                    '    print(number, "x", i, "=", number * i)'
                ),
            },
            {
                "explain": (
                    "Loops can ADD UP numbers. We start a 'total' box at 0\n"
                    "and add to it every time round. Sum of 1 to 10:"
                ),
                "code": (
                    "total = 0\n"
                    "for i in range(1, 11):\n"
                    "    total = total + i\n"
                    'print("Sum of 1 to 10 is", total)'
                ),
            },
            {
                "explain": (
                    "A for loop can also go through each letter of a string."
                ),
                "code": (
                    'for letter in "SCHOOL":\n'
                    "    print(letter)"
                ),
            },
        ],
        "quiz": [
            {
                "q": "Which numbers does range(4) give?",
                "options": ["1, 2, 3, 4", "0, 1, 2, 3", "0, 1, 2, 3, 4", "4"],
                "answer": 1,
                "why": "range starts at 0 and stops BEFORE the number given.",
            },
            {
                "q": "How many times will this print? for i in range(3, 8): print(i)",
                "options": ["8", "5", "3", "6"],
                "answer": 1,
                "why": "3, 4, 5, 6, 7 = 5 numbers (8 is not included).",
            },
            {
                "q": "What does range(10, 0, -2) start with?",
                "options": ["0", "10", "8", "-2"],
                "answer": 1,
                "why": "It starts at 10 and jumps down by 2: 10, 8, 6, 4, 2.",
            },
        ],
        "challenge": {
            "task": "Print the squares of numbers from 1 to 10 (1, 4, 9, ... 100).",
            "hint": "for i in range(1, 11): print(i * i)",
            "solution": "for i in range(1, 11):\n    print(i, \"squared is\", i * i)",
        },
    },
    # ------------------------------------------------------------------ 8
    {
        "title": "while Loops - Repeat Until...",
        "goal": "Repeat something as long as a condition is True.",
        "steps": [
            {
                "explain": (
                    "A for loop is good when we KNOW how many times to repeat.\n"
                    "A while loop keeps going AS LONG AS a condition is True.\n"
                    "Like: 'keep eating WHILE you are hungry'."
                ),
                "code": (
                    "count = 1\n"
                    "while count <= 5:\n"
                    '    print("Count is", count)\n'
                    "    count = count + 1\n"
                    'print("Done!")'
                ),
            },
            {
                "explain": (
                    "WARNING: Always change something inside the loop so it can stop!\n"
                    "If count never grows, the loop runs FOREVER (an infinite loop).\n"
                    "If that ever happens, press Ctrl + C to stop it.\n\n"
                    "Here: how many times can we double 1 before it is bigger than 100?"
                ),
                "code": (
                    "number = 1\n"
                    "steps = 0\n"
                    "while number <= 100:\n"
                    "    number = number * 2\n"
                    "    steps = steps + 1\n"
                    'print("It took", steps, "doublings to reach", number)'
                ),
            },
            {
                "explain": (
                    "while is great for asking again until the answer is right.\n"
                    "Try a wrong password first, then type: python"
                ),
                "code": (
                    'password = ""\n'
                    'while password != "python":\n'
                    '    password = input("Enter the secret password: ")\n'
                    'print("Access granted!")'
                ),
            },
            {
                "explain": (
                    "break jumps OUT of a loop immediately.\n"
                    "Here we search for the first number divisible by 7 after 50."
                ),
                "code": (
                    "n = 51\n"
                    "while True:\n"
                    "    if n % 7 == 0:\n"
                    "        break\n"
                    "    n = n + 1\n"
                    'print("First multiple of 7 after 50 is", n)'
                ),
            },
        ],
        "quiz": [
            {
                "q": "When does a while loop stop?",
                "options": [
                    "After 10 times",
                    "When its condition becomes False",
                    "Never",
                    "When it prints something",
                ],
                "answer": 1,
                "why": "while keeps repeating only as long as the condition is True.",
            },
            {
                "q": "Which key combination stops a program stuck in an infinite loop?",
                "options": ["Ctrl + S", "Ctrl + C", "Alt + F4 only", "Enter"],
                "answer": 1,
                "why": "Ctrl + C interrupts a running Python program.",
            },
        ],
        "challenge": {
            "task": "Use a while loop to print 10, 9, 8 ... 1 and then 'Happy New Year!'.",
            "hint": "Start n = 10, loop while n >= 1, and do n = n - 1 inside.",
            "solution": 'n = 10\nwhile n >= 1:\n    print(n)\n    n = n - 1\nprint("Happy New Year!")',
        },
    },
    # ------------------------------------------------------------------ 9
    {
        "title": "Lists - A Bag of Many Things",
        "goal": "Keep many values together in one list.",
        "steps": [
            {
                "explain": (
                    "A variable is one box. A LIST is like a school bag with many items.\n"
                    "We write a list with square brackets [ ] and commas."
                ),
                "code": (
                    'fruits = ["apple", "banana", "mango"]\n'
                    "marks = [78, 92, 85, 64]\n"
                    "print(fruits)\n"
                    "print(marks)"
                ),
            },
            {
                "explain": (
                    "Just like letters in a string, items in a list have an INDEX starting at 0."
                ),
                "code": (
                    'planets = ["Mercury", "Venus", "Earth", "Mars"]\n'
                    "print(planets[0])\n"
                    "print(planets[2])\n"
                    'print("Number of planets in list:", len(planets))'
                ),
            },
            {
                "explain": (
                    "Lists can CHANGE:\n"
                    "   .append(x)  -> add x at the end\n"
                    "   .remove(x)  -> take x out\n"
                    "   list[i] = x -> replace the item at position i"
                ),
                "code": (
                    'bag = ["book", "pencil"]\n'
                    'bag.append("eraser")\n'
                    "print(bag)\n"
                    'bag.remove("pencil")\n'
                    "print(bag)\n"
                    'bag[0] = "notebook"\n'
                    "print(bag)"
                ),
            },
            {
                "explain": (
                    "Loop over a list with for - Python gives you each item one by one."
                ),
                "code": (
                    'friends = ["Riya", "Arjun", "Sara"]\n'
                    "for friend in friends:\n"
                    '    print("Happy birthday,", friend + "!")'
                ),
            },
            {
                "explain": (
                    "Python has handy helpers for lists of numbers:\n"
                    "   sum()  max()  min()  sorted()"
                ),
                "code": (
                    "marks = [78, 92, 85, 64, 88]\n"
                    'print("Total:", sum(marks))\n'
                    'print("Highest:", max(marks))\n'
                    'print("Lowest:", min(marks))\n'
                    'print("Average:", sum(marks) / len(marks))\n'
                    'print("Sorted:", sorted(marks))'
                ),
            },
            {
                "explain": (
                    "Use  in  to check if something is inside a list."
                ),
                "code": (
                    'colours = ["red", "green", "blue"]\n'
                    'if "green" in colours:\n'
                    '    print("Yes, green is there!")\n'
                    'print("pink" in colours)'
                ),
            },
        ],
        "quiz": [
            {
                "q": 'nums = [5, 10, 15]. What is nums[1]?',
                "options": ["5", "10", "15", "1"],
                "answer": 1,
                "why": "Index 0 is 5, index 1 is 10.",
            },
            {
                "q": "Which method adds an item at the END of a list?",
                "options": [".add()", ".push()", ".append()", ".insert_end()"],
                "answer": 2,
                "why": ".append() adds to the end.",
            },
            {
                "q": "What does len([3, 6, 9, 12]) give?",
                "options": ["3", "4", "12", "30"],
                "answer": 1,
                "why": "There are 4 items in the list.",
            },
        ],
        "challenge": {
            "task": "Make a list of 5 of your favourite foods. Add one more, then print each on its own line.",
            "hint": "foods = [...], foods.append(...), then a for loop.",
            "solution": (
                'foods = ["dosa", "pizza", "paneer", "momos", "kheer"]\n'
                'foods.append("idli")\n'
                "for food in foods:\n"
                "    print(food)"
            ),
        },
    },
    # ------------------------------------------------------------------ 10
    {
        "title": "Functions - Your Own Commands",
        "goal": "Create your own reusable instructions.",
        "steps": [
            {
                "explain": (
                    "A FUNCTION is a set of instructions with a name - like a recipe.\n"
                    "Write the recipe once, then use (CALL) it as many times as you like.\n\n"
                    "We create one with  def  (short for 'define')."
                ),
                "code": (
                    "def say_hello():\n"
                    '    print("Hello!")\n'
                    '    print("Welcome to Python class.")\n'
                    "\n"
                    "say_hello()\n"
                    "say_hello()"
                ),
            },
            {
                "explain": (
                    "Functions can take INPUTS called PARAMETERS, written inside the brackets.\n"
                    "It's like telling the recipe how many people to cook for."
                ),
                "code": (
                    "def greet(name):\n"
                    '    print("Good morning,", name)\n'
                    "\n"
                    'greet("Aditi")\n'
                    'greet("Rohan")'
                ),
            },
            {
                "explain": (
                    "return sends an answer BACK from the function, so we can store or use it."
                ),
                "code": (
                    "def square(n):\n"
                    "    return n * n\n"
                    "\n"
                    "answer = square(6)\n"
                    "print(answer)\n"
                    "print(square(3) + square(4))"
                ),
            },
            {
                "explain": (
                    "Functions can take more than one input. Here is a useful one!"
                ),
                "code": (
                    "def rectangle_area(length, breadth):\n"
                    "    return length * breadth\n"
                    "\n"
                    'print("Room area:", rectangle_area(5, 4))\n'
                    'print("Garden area:", rectangle_area(12, 10))'
                ),
            },
            {
                "explain": (
                    "Putting it all together: a function that uses if/else and returns a word."
                ),
                "code": (
                    "def even_or_odd(n):\n"
                    "    if n % 2 == 0:\n"
                    '        return "even"\n'
                    "    else:\n"
                    '        return "odd"\n'
                    "\n"
                    "for number in [3, 8, 11, 20]:\n"
                    '    print(number, "is", even_or_odd(number))'
                ),
            },
        ],
        "quiz": [
            {
                "q": "Which word is used to create a function?",
                "options": ["func", "def", "make", "function"],
                "answer": 1,
                "why": "def (define) starts a function.",
            },
            {
                "q": "def double(x): return x * 2.   What is double(7)?",
                "options": ["7", "9", "14", "72"],
                "answer": 2,
                "why": "7 * 2 = 14.",
            },
            {
                "q": "What does return do?",
                "options": [
                    "Prints the answer",
                    "Sends a value back to where the function was called",
                    "Repeats the function",
                    "Deletes the function",
                ],
                "answer": 1,
                "why": "return gives a value back so the caller can use it.",
            },
        ],
        "challenge": {
            "task": "Write a function cube(n) that returns n * n * n. Print cube(3).",
            "hint": "def cube(n):  then  return n * n * n",
            "solution": "def cube(n):\n    return n * n * n\n\nprint(cube(3))",
        },
    },
]
