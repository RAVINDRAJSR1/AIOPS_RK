# REPORT CARD
# Enter marks for 5 subjects and get a report card.
# Uses: lists, for loop, append, sum, max, min, functions

subjects = ["English", "Hindi", "Maths", "Science", "Social Science"]
marks = []


def grade(percent):
    if percent >= 90:
        return "A+"
    elif percent >= 75:
        return "A"
    elif percent >= 60:
        return "B"
    elif percent >= 40:
        return "C"
    else:
        return "Needs improvement"


for subject in subjects:
    mark = int(input(f"Marks in {subject} (out of 100): "))
    marks.append(mark)

total = sum(marks)
percent = total / len(subjects)

print("\n========= REPORT CARD =========")
for i in range(len(subjects)):
    print(f"{subjects[i]:<15} {marks[i]}")
print("-------------------------------")
print("Total:     ", total, "/", len(subjects) * 100)
print("Percentage:", round(percent, 1))
print("Best mark: ", max(marks))
print("Lowest:    ", min(marks))
print("Grade:     ", grade(percent))

# TRY THIS: also print the name of the subject with the best mark.
