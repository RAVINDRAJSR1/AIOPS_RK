# GUESS THE NUMBER
# The computer thinks of a secret number. You try to guess it!
# Uses: random, while loop, if / elif / else, input

import random

secret = random.randint(1, 50)   # a random whole number from 1 to 50
tries = 0
guess = 0

print("I am thinking of a number between 1 and 50.")

while guess != secret:
    guess = int(input("Your guess: "))
    tries = tries + 1
    if guess < secret:
        print("Too LOW! Try a bigger number.")
    elif guess > secret:
        print("Too HIGH! Try a smaller number.")

print(f"YES! It was {secret}. You got it in {tries} tries!")

# TRY THIS: change 50 to 100 to make the game harder.
# TRY THIS: stop the game after 7 tries and say "Game over".
