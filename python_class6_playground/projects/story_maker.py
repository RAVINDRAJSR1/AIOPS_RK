# SILLY STORY MAKER
# You give some words, Python makes a funny story!
# Uses: input, variables, f-strings, .upper()

name = input("Give me a name: ")
animal = input("Give me an animal: ")
food = input("Give me a food: ")
place = input("Give me a place: ")
number = input("Give me a number: ")

print("\n------- YOUR STORY -------")
print(f"One day {name} went to {place} with a {animal}.")
print(f"The {animal} was very hungry and ate {number} plates of {food}!")
print(f"Everyone shouted, \"{name.upper()}, YOUR {animal.upper()} IS TOO GREEDY!\"")
print("The end.")

# TRY THIS: ask for more words and make the story longer.
