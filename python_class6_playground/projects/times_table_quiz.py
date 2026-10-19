# TIMES TABLE QUIZ
# Answer 5 multiplication questions. Can you get them all right?
# Uses: random, for loop, input, int(), if / else, a score variable

import random

score = 0
questions = 5

for number in range(1, questions + 1):
    a = random.randint(2, 12)
    b = random.randint(2, 12)
    answer = int(input(f"Question {number}: What is {a} x {b}? "))
    if answer == a * b:
        print("Correct!")
        score = score + 1
    else:
        print(f"Oops! {a} x {b} = {a * b}")

print(f"\nYou scored {score} out of {questions}.")
if score == questions:
    print("Maths champion!")

# TRY THIS: change questions = 5 to questions = 10.
# TRY THIS: make it an addition quiz instead.
