# TURTLE ART
# A turtle walks on the screen and draws lines. Let's make shapes!
# Uses: for loops, functions
# Note: this opens a drawing window. It needs a computer with a screen
# (it will not work on some online editors).

import turtle

pen = turtle.Turtle()
pen.speed(0)
turtle.bgcolor("black")
colours = ["red", "orange", "yellow", "green", "cyan", "violet"]


def square(size):
    for side in range(4):
        pen.forward(size)
        pen.right(90)


# Draw 36 squares, turning a little each time, to make a flower.
for i in range(36):
    pen.color(colours[i % len(colours)])
    square(100)
    pen.right(10)

turtle.done()

# TRY THIS: draw a triangle instead (3 sides, turn 120 each time).
# TRY THIS: draw a star (5 sides, forward 150, turn 144).
