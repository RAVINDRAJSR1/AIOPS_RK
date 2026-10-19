# SIMPLE CALCULATOR
# Uses: functions, return, if / elif / else, float()

def calculate(a, sign, b):
    if sign == "+":
        return a + b
    elif sign == "-":
        return a - b
    elif sign == "*":
        return a * b
    elif sign == "/":
        if b == 0:
            return "Cannot divide by zero!"
        return a / b
    else:
        return "I don't know that sign."


print("SIMPLE CALCULATOR  (signs: + - * /)")
first = float(input("First number: "))
sign = input("Sign: ")
second = float(input("Second number: "))

print("Answer:", calculate(first, sign, second))

# TRY THIS: add  %  for remainder and  **  for power.
