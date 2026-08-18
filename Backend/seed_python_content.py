"""
Seed real educational content for the Python subject in the Data Science course.
Run with: python manage.py shell < seed_python_content.py
"""
import os
# pyrefly: ignore [missing-import]
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from courses.models import Course, Subject, Topic, Material

course = Course.objects.get(id=4)
python_subject = Subject.objects.get(id=4, course=course)
print(f"Seeding content for: {course.title} > {python_subject.title}")

# ─── Update existing "Basics of loops" material to also include text content ──

existing_mat = Material.objects.filter(topic__subject=python_subject, title='Basics of loops').first()
if existing_mat and not existing_mat.text_content:
    existing_mat.text_content = """# Basics of Loops in Python

Loops allow you to execute a block of code repeatedly. Python supports two main types of loops: **for** loops and **while** loops.

## The for Loop

The `for` loop iterates over a sequence (list, tuple, string, range, etc.):

  for i in range(5):
      print(i)    # prints 0, 1, 2, 3, 4

  fruits = ["apple", "banana", "cherry"]
  for fruit in fruits:
      print(fruit)

## The while Loop

The `while` loop executes as long as a condition is **True**:

  count = 0
  while count < 5:
      print(count)
      count += 1

## Loop Control Statements

- **break** — Exit the loop entirely
- **continue** — Skip the rest of the current iteration and move to the next
- **pass** — Do nothing (placeholder)

  for i in range(10):
      if i == 5:
          break       # stops at 5
      if i % 2 == 0:
          continue    # skips even numbers
      print(i)        # prints 1, 3

## The range() Function

`range()` generates a sequence of numbers:

  range(5)          # 0, 1, 2, 3, 4
  range(2, 8)       # 2, 3, 4, 5, 6, 7
  range(0, 10, 2)   # 0, 2, 4, 6, 8

## Nested Loops

You can place a loop inside another loop:

  for i in range(3):
      for j in range(3):
          print(f"({i},{j})", end=" ")
      print()

  # Output:
  # (0,0) (0,1) (0,2)
  # (1,0) (1,1) (1,2)
  # (2,0) (2,1) (2,2)

## The else Clause with Loops

Python allows an `else` block after a loop, which executes when the loop finishes normally (without `break`):

  for i in range(5):
      if i == 10:
          break
  else:
      print("Loop completed without break")

## Common Patterns

**Enumerate** — Get index and value:

  colors = ["red", "green", "blue"]
  for index, color in enumerate(colors):
      print(f"{index}: {color}")

**Zip** — Iterate over multiple sequences:

  names = ["Alice", "Bob"]
  ages = [25, 30]
  for name, age in zip(names, ages):
      print(f"{name} is {age}")

## Practice Exercises

1. Write a program that prints all even numbers from 1 to 50
2. Create a multiplication table for numbers 1 through 5
3. Write a program to find the factorial of a number using a while loop
4. Use nested loops to print a right triangle pattern of stars
"""
    existing_mat.material_type = 'notes'
    existing_mat.save()
    print(f"  Updated 'Basics of loops' with text content")

# ─── Topic 2: Variables and Data Types ────────────────────────────────────────

t2, created = Topic.objects.get_or_create(
    subject=python_subject,
    title='Variables and Data Types',
    defaults={
        'description': 'Learn about Python variables, data types, and type conversion.',
        'order': 0,
        'is_published': True,
        'difficulty': 'easy',
        'estimated_duration': '25 min',
    }
)
print(f'{"Created" if created else "Found"} topic: {t2.title}')

Material.objects.get_or_create(
    topic=t2, title='Python Variables and Data Types',
    defaults={
        'material_type': 'notes', 'order': 1, 'is_published': True,
        'description': 'Comprehensive guide to Python variables, naming conventions, and all built-in data types.',
        'duration': '15 min',
        'text_content': """# Python Variables and Data Types

## Variables in Python

A variable is a name that refers to a value. Unlike many languages, Python **does not require you to declare the type** — it is inferred automatically.

  name = "Alice"       # str
  age = 25             # int
  height = 5.7         # float
  is_student = True    # bool

## Naming Rules

- Must start with a letter or underscore
- Can contain letters, digits, and underscores
- Case-sensitive (`age` and `Age` are different)
- Cannot use Python reserved words (`if`, `for`, `class`, etc.)

  my_variable = 10      # valid
  _private = "secret"   # valid
  2nd_value = 5         # INVALID - starts with digit

## Built-in Data Types

### Numeric Types

  integer_val = 42          # int — whole numbers
  float_val = 3.14          # float — decimal numbers
  complex_val = 3 + 4j      # complex — complex numbers

### Text Type

  greeting = "Hello, World!"
  multiline = '''This is
  a multiline string'''

### Boolean Type

  is_active = True
  is_empty = False
  # Booleans are a subclass of int: True == 1, False == 0

### Sequence Types

  my_list = [1, 2, 3, 4, 5]          # list — mutable, ordered
  my_tuple = (1, 2, 3)                # tuple — immutable, ordered
  my_range = range(1, 10)             # range — immutable sequence

### Mapping Type

  student = {
      "name": "Alice",
      "age": 25,
      "grade": "A"
  }   # dict — key:value pairs

### Set Types

  unique_nums = {1, 2, 3, 4}          # set — unordered, unique
  frozen = frozenset({1, 2, 3})       # frozenset — immutable set

## Type Conversion (Casting)

  x = int("42")        # str to int → 42
  y = float("3.14")    # str to float → 3.14
  z = str(100)         # int to str → "100"
  w = list("hello")    # str to list → ['h','e','l','l','o']

## Checking Types

  print(type(42))          # <class 'int'>
  print(type("hello"))     # <class 'str'>
  print(isinstance(42, int))  # True

## Multiple Assignment

  a, b, c = 1, 2, 3
  x = y = z = 0     # all three equal to 0

## Constants Convention

Python doesn't have built-in constants, but by convention, UPPERCASE names indicate constants:

  PI = 3.14159
  MAX_SIZE = 100
  DATABASE_URL = "localhost:5432"
"""
    }
)

Material.objects.get_or_create(
    topic=t2, title='Type Conversion and Operators',
    defaults={
        'material_type': 'notes', 'order': 2, 'is_published': True,
        'description': 'Understanding operators and type conversion in Python.',
        'duration': '10 min',
        'text_content': """# Type Conversion and Operators

## Arithmetic Operators

  a, b = 15, 4
  print(a + b)    # 19 — Addition
  print(a - b)    # 11 — Subtraction
  print(a * b)    # 60 — Multiplication
  print(a / b)    # 3.75 — Division (float)
  print(a // b)   # 3 — Floor Division
  print(a % b)    # 3 — Modulus (remainder)
  print(a ** b)   # 50625 — Exponentiation

## Comparison Operators

  print(5 == 5)    # True
  print(5 != 3)    # True
  print(5 > 3)     # True
  print(5 < 3)     # False
  print(5 >= 5)    # True
  print(5 <= 3)    # False

## Logical Operators

  print(True and False)   # False
  print(True or False)    # True
  print(not True)         # False

## Identity and Membership Operators

  # Identity
  a = [1, 2, 3]
  b = a
  print(a is b)       # True — same object
  print(a is not b)   # False

  # Membership
  print(2 in [1, 2, 3])      # True
  print("x" not in "hello")  # True

## Implicit Type Conversion

Python automatically converts smaller types to larger types:

  result = 5 + 3.14   # int + float → float (8.14)
  result = True + 10   # bool + int → int (11)

## Practice Exercises

1. Create variables of each data type and print their types
2. Write a temperature converter (Celsius to Fahrenheit)
3. Calculate the area and circumference of a circle given the radius
"""
    }
)

# ─── Topic 3: Functions ──────────────────────────────────────────────────────

t3, created = Topic.objects.get_or_create(
    subject=python_subject,
    title='Functions',
    defaults={
        'description': 'Define and use functions, understand scope, and work with arguments.',
        'order': 2,
        'is_published': True,
        'difficulty': 'easy',
        'estimated_duration': '30 min',
    }
)
print(f'{"Created" if created else "Found"} topic: {t3.title}')

Material.objects.get_or_create(
    topic=t3, title='Defining and Calling Functions',
    defaults={
        'material_type': 'notes', 'order': 1, 'is_published': True,
        'description': 'Learn how to define, call, and organize functions in Python.',
        'duration': '15 min',
        'text_content': """# Defining and Calling Functions

## What is a Function?

A function is a **reusable block of code** that performs a specific task. Functions help organize code, reduce repetition, and make programs easier to understand.

## Defining a Function

Use the `def` keyword followed by the function name and parentheses:

  def greet():
      print("Hello, World!")

  greet()   # Output: Hello, World!

## Parameters and Arguments

  def greet(name):
      print(f"Hello, {name}!")

  greet("Alice")    # Hello, Alice!
  greet("Bob")      # Hello, Bob!

## Return Values

Functions can return values using the `return` statement:

  def add(a, b):
      return a + b

  result = add(3, 5)
  print(result)   # 8

## Default Parameters

  def greet(name, greeting="Hello"):
      return f"{greeting}, {name}!"

  print(greet("Alice"))              # Hello, Alice!
  print(greet("Bob", "Hi"))          # Hi, Bob!

## Keyword Arguments

  def describe_pet(name, animal_type="dog"):
      return f"{name} is a {animal_type}"

  print(describe_pet(name="Buddy"))
  print(describe_pet(animal_type="cat", name="Whiskers"))

## Variable-Length Arguments

  # *args — tuple of positional arguments
  def total(*numbers):
      return sum(numbers)

  print(total(1, 2, 3, 4))    # 10

  # **kwargs — dictionary of keyword arguments
  def print_info(**info):
      for key, value in info.items():
          print(f"{key}: {value}")

  print_info(name="Alice", age=25, city="NYC")

## Scope — Local vs Global

  x = 10   # global variable

  def my_func():
      x = 20   # local variable (different from global x)
      print(f"Inside: {x}")    # 20

  my_func()
  print(f"Outside: {x}")   # 10

  # To modify global variable inside function:
  def modify_global():
      global x
      x = 99

## Lambda Functions

Short, anonymous functions for simple operations:

  square = lambda x: x ** 2
  print(square(5))    # 25

  # Common with map, filter, sorted
  numbers = [3, 1, 4, 1, 5, 9]
  sorted_nums = sorted(numbers, key=lambda x: -x)
  print(sorted_nums)  # [9, 5, 4, 3, 1, 1]

## Docstrings

  def calculate_area(radius):
      \"\"\"Calculate the area of a circle given its radius.\"\"\"
      import math
      return math.pi * radius ** 2

  print(calculate_area.__doc__)

## Practice Exercises

1. Write a function that checks if a number is prime
2. Create a function that returns the nth Fibonacci number
3. Write a function that takes a list and returns only the even numbers
4. Create a recursive function to calculate factorial
"""
    }
)

# ─── Topic 4: Lists and Dictionaries ─────────────────────────────────────────

t4, created = Topic.objects.get_or_create(
    subject=python_subject,
    title='Lists and Dictionaries',
    defaults={
        'description': 'Master Python lists, dictionaries, and their common operations.',
        'order': 3,
        'is_published': True,
        'difficulty': 'easy',
        'estimated_duration': '35 min',
    }
)
print(f'{"Created" if created else "Found"} topic: {t4.title}')

Material.objects.get_or_create(
    topic=t4, title='Working with Python Lists',
    defaults={
        'material_type': 'notes', 'order': 1, 'is_published': True,
        'description': 'Complete guide to Python lists — creation, indexing, slicing, and methods.',
        'duration': '15 min',
        'text_content': """# Working with Python Lists

## Creating Lists

A list is an **ordered, mutable** collection that can hold items of different types:

  fruits = ["apple", "banana", "cherry"]
  numbers = [1, 2, 3, 4, 5]
  mixed = [1, "hello", True, 3.14]
  empty = []

## Indexing and Slicing

  colors = ["red", "green", "blue", "yellow", "purple"]

  print(colors[0])      # "red" — first element
  print(colors[-1])     # "purple" — last element
  print(colors[1:3])    # ["green", "blue"] — slice
  print(colors[:2])     # ["red", "green"] — from start
  print(colors[2:])     # ["blue", "yellow", "purple"] — to end
  print(colors[::2])    # ["red", "blue", "purple"] — every 2nd

## Modifying Lists

  fruits = ["apple", "banana", "cherry"]

  # Change an element
  fruits[1] = "blueberry"

  # Add elements
  fruits.append("date")            # add to end
  fruits.insert(1, "avocado")      # insert at index
  fruits.extend(["fig", "grape"])  # add multiple

  # Remove elements
  fruits.remove("cherry")   # remove by value
  popped = fruits.pop()     # remove and return last
  del fruits[0]             # remove by index
  fruits.clear()            # remove all

## List Methods

  nums = [3, 1, 4, 1, 5, 9, 2, 6]

  nums.sort()              # sort in place: [1, 1, 2, 3, 4, 5, 6, 9]
  nums.reverse()           # reverse in place
  print(nums.count(1))     # 2 — count occurrences
  print(nums.index(5))     # find index of value
  copy = nums.copy()       # shallow copy
  print(len(nums))         # 8 — length

## List Comprehensions

A concise way to create lists:

  squares = [x**2 for x in range(10)]
  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

  evens = [x for x in range(20) if x % 2 == 0]
  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

  words = ["Hello", "World"]
  upper = [w.upper() for w in words]
  # ["HELLO", "WORLD"]

## Common Operations

  # Check membership
  print("apple" in ["apple", "banana"])   # True

  # Concatenation
  a = [1, 2] + [3, 4]   # [1, 2, 3, 4]

  # Repetition
  zeros = [0] * 5   # [0, 0, 0, 0, 0]

  # Unpacking
  first, *rest = [1, 2, 3, 4, 5]
  # first = 1, rest = [2, 3, 4, 5]
"""
    }
)

Material.objects.get_or_create(
    topic=t4, title='Python Dictionaries',
    defaults={
        'material_type': 'notes', 'order': 2, 'is_published': True,
        'description': 'Everything about dictionaries — creation, access, iteration, and comprehensions.',
        'duration': '15 min',
        'text_content': """# Python Dictionaries

## What is a Dictionary?

A dictionary stores data as **key:value pairs**. Keys must be unique and immutable (strings, numbers, tuples).

  student = {
      "name": "Alice",
      "age": 25,
      "courses": ["Math", "CS"],
      "active": True
  }

## Accessing Values

  print(student["name"])        # "Alice"
  print(student.get("age"))     # 25
  print(student.get("gpa", 0))  # 0 — default if not found

## Modifying Dictionaries

  # Add or update
  student["grade"] = "A"
  student["age"] = 26
  student.update({"city": "NYC", "age": 27})

  # Remove
  del student["active"]
  removed = student.pop("grade")        # remove and return
  last = student.popitem()              # remove last item

## Dictionary Methods

  info = {"a": 1, "b": 2, "c": 3}

  print(info.keys())      # dict_keys(['a', 'b', 'c'])
  print(info.values())    # dict_values([1, 2, 3])
  print(info.items())     # dict_items([('a', 1), ('b', 2), ('c', 3)])

## Iterating Over Dictionaries

  student = {"name": "Alice", "age": 25, "city": "NYC"}

  for key in student:
      print(key, student[key])

  for key, value in student.items():
      print(f"{key}: {value}")

## Dictionary Comprehensions

  squares = {x: x**2 for x in range(6)}
  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

  # Filter
  high = {k: v for k, v in squares.items() if v > 10}
  # {4: 16, 5: 25}

## Nested Dictionaries

  school = {
      "class_a": {"teacher": "Mr. Smith", "students": 30},
      "class_b": {"teacher": "Ms. Jones", "students": 25}
  }

  print(school["class_a"]["teacher"])   # "Mr. Smith"

## Common Patterns

  # Count occurrences
  text = "hello world"
  freq = {}
  for char in text:
      freq[char] = freq.get(char, 0) + 1

  # Merge dictionaries (Python 3.9+)
  dict1 = {"a": 1}
  dict2 = {"b": 2}
  merged = dict1 | dict2   # {"a": 1, "b": 2}

## Practice Exercises

1. Create a phone book dictionary and write functions to add, search, and delete contacts
2. Write a function that counts word frequency in a sentence
3. Create a nested dictionary representing a school and calculate the average number of students
"""
    }
)

# ─── Topic 5: String Manipulation ────────────────────────────────────────────

t5, created = Topic.objects.get_or_create(
    subject=python_subject,
    title='String Manipulation',
    defaults={
        'description': 'Learn string operations, formatting, and common methods.',
        'order': 4,
        'is_published': True,
        'difficulty': 'easy',
        'estimated_duration': '25 min',
    }
)
print(f'{"Created" if created else "Found"} topic: {t5.title}')

Material.objects.get_or_create(
    topic=t5, title='Python String Operations',
    defaults={
        'material_type': 'notes', 'order': 1, 'is_published': True,
        'description': 'Comprehensive guide to string manipulation in Python.',
        'duration': '20 min',
        'text_content': """# Python String Operations

## Creating Strings

  single = 'Hello'
  double = "World"
  triple = '''This is a
  multiline string'''
  raw = r"C:\\Users\\path"   # raw string — no escape processing

## String Indexing and Slicing

  text = "Python Programming"
  print(text[0])       # 'P'
  print(text[-1])      # 'g'
  print(text[0:6])     # 'Python'
  print(text[7:])      # 'Programming'
  print(text[::-1])    # 'gnimmargorP nohtyP' — reversed

## String Methods

  msg = "  Hello, World!  "

  # Case methods
  print(msg.upper())         # "  HELLO, WORLD!  "
  print(msg.lower())         # "  hello, world!  "
  print(msg.title())         # "  Hello, World!  "
  print(msg.capitalize())    # "  hello, world!  "
  print(msg.swapcase())      # "  hELLO, wORLD!  "

  # Whitespace
  print(msg.strip())         # "Hello, World!"
  print(msg.lstrip())        # "Hello, World!  "
  print(msg.rstrip())        # "  Hello, World!"

  # Search
  print(msg.find("World"))   # 9 (index)
  print(msg.count("l"))      # 3
  print(msg.startswith("  H"))  # True
  print(msg.endswith("!  "))    # True

  # Replace
  print(msg.replace("World", "Python"))

  # Split and Join
  csv = "apple,banana,cherry"
  fruits = csv.split(",")     # ["apple", "banana", "cherry"]
  result = " | ".join(fruits) # "apple | banana | cherry"

## String Formatting

  name = "Alice"
  age = 25

  # f-strings (recommended — Python 3.6+)
  print(f"My name is {name} and I am {age} years old")
  print(f"Next year I'll be {age + 1}")
  print(f"Pi is approximately {3.14159:.2f}")

  # format() method
  print("Hello, {}! You are {} years old.".format(name, age))

  # % formatting (older style)
  print("Hello, %s! You are %d years old." % (name, age))

## String Validation

  print("hello123".isalnum())    # True — letters and digits
  print("hello".isalpha())      # True — only letters
  print("12345".isdigit())      # True — only digits
  print("hello".islower())      # True
  print("HELLO".isupper())      # True
  print("   ".isspace())        # True

## Escape Characters

  print("Hello\\nWorld")     # newline
  print("Tab\\there")        # tab
  print("She said \\"hi\\"")  # quotes
  print("Back\\\\slash")     # backslash

## Practice Exercises

1. Write a function that checks if a string is a palindrome
2. Count vowels and consonants in a given string
3. Create a Caesar cipher encoder/decoder
4. Write a function that converts a sentence to title case (without using .title())
"""
    }
)

# ─── Topic 6: File Handling ──────────────────────────────────────────────────

t6, created = Topic.objects.get_or_create(
    subject=python_subject,
    title='File Handling',
    defaults={
        'description': 'Read, write, and manage files in Python.',
        'order': 5,
        'is_published': True,
        'difficulty': 'medium',
        'estimated_duration': '30 min',
    }
)
print(f'{"Created" if created else "Found"} topic: {t6.title}')

Material.objects.get_or_create(
    topic=t6, title='Reading and Writing Files',
    defaults={
        'material_type': 'notes', 'order': 1, 'is_published': True,
        'description': 'Learn to read, write, and handle files in Python using best practices.',
        'duration': '20 min',
        'text_content': """# Reading and Writing Files in Python

## Opening Files

Use the `open()` function with a mode:

  # Modes:
  # 'r'  — Read (default)
  # 'w'  — Write (overwrites)
  # 'a'  — Append
  # 'x'  — Create (fails if exists)
  # 'rb' — Read binary
  # 'wb' — Write binary

## Reading Files

  # Method 1: read() — reads entire file
  file = open("data.txt", "r")
  content = file.read()
  file.close()

  # Method 2: readline() — reads one line
  file = open("data.txt", "r")
  first_line = file.readline()
  second_line = file.readline()
  file.close()

  # Method 3: readlines() — returns list of lines
  file = open("data.txt", "r")
  lines = file.readlines()
  file.close()

## The with Statement (Best Practice)

The `with` statement automatically closes the file:

  with open("data.txt", "r") as file:
      content = file.read()
      print(content)
  # file is automatically closed here

## Writing Files

  # Write (creates or overwrites)
  with open("output.txt", "w") as file:
      file.write("Hello, World!\\n")
      file.write("Second line\\n")

  # Append
  with open("output.txt", "a") as file:
      file.write("This is appended\\n")

  # Write multiple lines
  lines = ["Line 1\\n", "Line 2\\n", "Line 3\\n"]
  with open("output.txt", "w") as file:
      file.writelines(lines)

## Processing Files Line by Line

  # Efficient for large files
  with open("data.txt", "r") as file:
      for line in file:
          print(line.strip())

## Working with CSV Data

  import csv

  # Reading CSV
  with open("data.csv", "r") as file:
      reader = csv.reader(file)
      for row in reader:
          print(row)

  # Writing CSV
  with open("output.csv", "w", newline="") as file:
      writer = csv.writer(file)
      writer.writerow(["Name", "Age", "City"])
      writer.writerow(["Alice", 25, "NYC"])

## Working with JSON

  import json

  # Reading JSON
  with open("data.json", "r") as file:
      data = json.load(file)

  # Writing JSON
  data = {"name": "Alice", "age": 25}
  with open("output.json", "w") as file:
      json.dump(data, file, indent=4)

## Error Handling with Files

  try:
      with open("missing.txt", "r") as file:
          content = file.read()
  except FileNotFoundError:
      print("File not found!")
  except PermissionError:
      print("Permission denied!")
  except IOError as e:
      print(f"IO Error: {e}")

## File and Directory Operations

  import os

  # Check if file exists
  print(os.path.exists("data.txt"))

  # Get file size
  print(os.path.getsize("data.txt"))

  # List files in directory
  for file in os.listdir("."):
      print(file)

  # Create / remove directory
  os.makedirs("new_folder", exist_ok=True)

## Practice Exercises

1. Write a program that reads a text file and counts the number of words
2. Create a program that copies content from one file to another
3. Build a simple contact book that saves data to a JSON file
4. Read a CSV file and calculate the average of a numeric column
"""
    }
)

# ─── Topic 7: Error Handling ─────────────────────────────────────────────────

t7, created = Topic.objects.get_or_create(
    subject=python_subject,
    title='Error Handling',
    defaults={
        'description': 'Understand exceptions and how to handle errors gracefully.',
        'order': 6,
        'is_published': True,
        'difficulty': 'medium',
        'estimated_duration': '25 min',
    }
)
print(f'{"Created" if created else "Found"} topic: {t7.title}')

Material.objects.get_or_create(
    topic=t7, title='Exception Handling in Python',
    defaults={
        'material_type': 'notes', 'order': 1, 'is_published': True,
        'description': 'Learn try/except/finally, custom exceptions, and debugging strategies.',
        'duration': '20 min',
        'text_content': """# Exception Handling in Python

## What are Exceptions?

Exceptions are errors that occur during program execution. Instead of crashing, we can **catch** and **handle** them gracefully.

## Common Built-in Exceptions

  # ZeroDivisionError
  result = 10 / 0

  # TypeError
  result = "hello" + 5

  # ValueError
  number = int("hello")

  # IndexError
  lst = [1, 2, 3]
  print(lst[10])

  # KeyError
  d = {"a": 1}
  print(d["b"])

  # FileNotFoundError
  f = open("missing.txt")

## Try / Except

  try:
      result = 10 / 0
  except ZeroDivisionError:
      print("Cannot divide by zero!")

  # Catching multiple exceptions
  try:
      value = int(input("Enter a number: "))
      result = 10 / value
  except ValueError:
      print("That's not a valid number!")
  except ZeroDivisionError:
      print("Cannot divide by zero!")

## The else and finally Clauses

  try:
      file = open("data.txt", "r")
      content = file.read()
  except FileNotFoundError:
      print("File not found!")
  else:
      print("File read successfully!")
      print(content)
  finally:
      print("This always executes")
      # Good place for cleanup

## Catching the Exception Object

  try:
      result = 10 / 0
  except ZeroDivisionError as e:
      print(f"Error occurred: {e}")
      print(f"Error type: {type(e).__name__}")

## Raising Exceptions

  def set_age(age):
      if age < 0:
          raise ValueError("Age cannot be negative")
      if age > 150:
          raise ValueError("Age seems unrealistic")
      return age

  try:
      set_age(-5)
  except ValueError as e:
      print(e)   # "Age cannot be negative"

## Custom Exceptions

  class InsufficientFundsError(Exception):
      def __init__(self, balance, amount):
          self.balance = balance
          self.amount = amount
          super().__init__(
              f"Cannot withdraw {amount}. Balance is {balance}"
          )

  def withdraw(balance, amount):
      if amount > balance:
          raise InsufficientFundsError(balance, amount)
      return balance - amount

  try:
      withdraw(100, 150)
  except InsufficientFundsError as e:
      print(e)
      print(f"Short by: {e.amount - e.balance}")

## Best Practices

1. **Be specific** — Catch specific exceptions, not bare `except:`
2. **Don't silence errors** — Always log or handle meaningfully
3. **Use finally for cleanup** — Close files, connections, etc.
4. **Raise when appropriate** — Don't return error codes, raise exceptions
5. **Create custom exceptions** for domain-specific errors

## Practice Exercises

1. Write a calculator that handles all input errors gracefully
2. Create a function that safely converts any string to a number
3. Build a file reader that handles missing files and permission errors
"""
    }
)

print("\n✅ All Python content seeded successfully!")
print(f"Total topics in Python subject: {python_subject.topics.count()}")
print(f"Total materials in Python subject: {Material.objects.filter(topic__subject=python_subject).count()}")
