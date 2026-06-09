"""
Management command: seed_ds_content
Adds Linear Regression and Graph Theory subjects/topics/materials
to the existing Data Science course (id=4).

Usage:
    python manage.py seed_ds_content
"""
# pyrefly: ignore [missing-import]
from django.core.management.base import BaseCommand
from courses.models import Course, Subject, Topic, Material


LR_TOPICS = [
    {
        "title": "Introduction to Linear Regression",
        "description": "Understand what linear regression is, its assumptions, and when to use it.",
        "order": 1,
        "difficulty": "easy",
        "estimated_duration": 30,
        "materials": [
            {
                "title": "What is Linear Regression?",
                "order": 1,
                "text_content": """# What is Linear Regression?

Linear Regression is a **supervised machine learning algorithm** used to model the relationship between a dependent variable (target) and one or more independent variables (features).

## Key Concepts

- **Simple Linear Regression**: One input feature, One output (y = mx + b)
- **Multiple Linear Regression**: Multiple features, One output

## The Linear Equation

  y = B0 + B1*x1 + B2*x2 + ... + Bn*xn + error

Where:
- **y** = Target/Dependent Variable
- **B0** = Intercept (bias)
- **B1...Bn** = Coefficients (weights)
- **error** = Residual term

## Assumptions of Linear Regression

1. **Linearity** - Relationship between features and target is linear
2. **Independence** - Observations are independent of each other
3. **Homoscedasticity** - Constant variance in residuals
4. **Normality** - Residuals are normally distributed
5. **No Multicollinearity** - Features are not highly correlated

## Use Cases

- Predicting house prices based on area, rooms, location
- Forecasting sales based on advertising spend
- Estimating salary based on years of experience

## Simple Example

```python
import numpy as np

experience = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
salary     = [35000, 38000, 42000, 47000, 53000, 58000, 63000, 68000, 73000, 80000]

x = np.array(experience)
y = np.array(salary)

slope     = np.cov(x, y)[0][1] / np.var(x)
intercept = np.mean(y) - slope * np.mean(x)

print(f"Slope: {slope:.2f}")
print(f"Intercept: {intercept:.2f}")
```

Linear Regression is the foundation of many ML algorithms!
""",
            },
            {
                "title": "Linear Regression Assumptions Explained",
                "order": 2,
                "text_content": """# Linear Regression Assumptions - Deep Dive

## 1. Linearity

The relationship between X and Y must be linear.

**How to check**: Scatter plot of each feature vs target.

```python
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv('housing.csv')
plt.scatter(df['area'], df['price'])
plt.xlabel('Area (sq ft)')
plt.ylabel('Price ($)')
plt.show()
```

## 2. No Multicollinearity

Independent variables should not be highly correlated.

```python
import seaborn as sns
corr = df.corr()
sns.heatmap(corr, annot=True, cmap='coolwarm')
plt.show()
```

## 3. Homoscedasticity

Residuals should have constant variance.

```python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)
residuals = y_test - model.predict(X_test)

plt.scatter(model.predict(X_test), residuals)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('Predicted Values')
plt.ylabel('Residuals')
plt.show()
```

## 4. Normality of Residuals

```python
import scipy.stats as stats
stats.probplot(residuals, dist="norm", plot=plt)
plt.title('Q-Q Plot of Residuals')
plt.show()
```

Checking these assumptions ensures your model results are **valid and reliable**.
""",
            },
        ],
    },
    {
        "title": "Cost Function and Gradient Descent",
        "description": "Learn how linear regression is trained using MSE and Gradient Descent.",
        "order": 2,
        "difficulty": "medium",
        "estimated_duration": 45,
        "materials": [
            {
                "title": "Mean Squared Error - The Cost Function",
                "order": 1,
                "text_content": """# Mean Squared Error - The Cost Function

The **Cost Function** measures how wrong our model's predictions are.

## MSE Formula

  MSE = (1/n) * sum( (y_actual - y_predicted)^2 )

Where:
- **y_i** = Actual value
- **y_hat** = Predicted value
- **n** = Number of samples

## Why Squared?

- Penalizes large errors more than small ones
- Ensures cost is always positive
- Makes differentiation easier (smooth, convex surface)

## Python Implementation

```python
import numpy as np

def mean_squared_error(y_actual, y_predicted):
    n = len(y_actual)
    return (1/n) * np.sum((y_actual - y_predicted)**2)

y_actual    = np.array([3, 5, 7, 9, 11])
y_predicted = np.array([2.8, 5.2, 6.9, 9.1, 11.3])

print(f"MSE: {mean_squared_error(y_actual, y_predicted):.4f}")
```

## Evaluation Metrics Comparison

| Metric | Description |
|--------|-------------|
| MSE    | Mean of squared errors - penalizes outliers |
| RMSE   | Square root of MSE - same units as target |
| MAE    | Mean absolute error - robust to outliers |
| R2     | Proportion of variance explained (0 to 1) |

```python
from sklearn.metrics import mean_squared_error, r2_score

mse  = mean_squared_error(y_test, y_pred)
rmse = mse ** 0.5
r2   = r2_score(y_test, y_pred)

print(f"MSE:  {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"R2:   {r2:.4f}")
```
""",
            },
            {
                "title": "Gradient Descent Algorithm",
                "order": 2,
                "text_content": """# Gradient Descent Algorithm

Gradient Descent is the **optimization algorithm** used to minimize the cost function and find the best parameters.

## Core Idea

Take small steps downhill on the cost-function surface until you reach the minimum.

## Update Rule

  B_j := B_j - alpha * (dJ/dB_j)

Where:
- **alpha** = Learning rate (step size)
- **dJ/dB_j** = Partial derivative of cost w.r.t. coefficient

## Python from Scratch

```python
import numpy as np

class LinearRegressionGD:
    def __init__(self, lr=0.01, iterations=1000):
        self.lr = lr
        self.iterations = iterations

    def fit(self, X, y):
        n, m = X.shape
        self.weights = np.zeros(m)
        self.bias = 0

        for _ in range(self.iterations):
            y_pred = X @ self.weights + self.bias
            error  = y - y_pred
            self.weights -= self.lr * (-2/n) * (X.T @ error)
            self.bias    -= self.lr * (-2/n) * error.sum()

    def predict(self, X):
        return X @ self.weights + self.bias

# Test
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split

X, y = make_regression(n_samples=200, n_features=1, noise=20, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = LinearRegressionGD(lr=0.01, iterations=1000)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print(f"Test MSE: {np.mean((y_test - y_pred)**2):.2f}")
```

## Learning Rate Guide

| Learning Rate | Effect |
|--------------|--------|
| Too small (0.0001) | Very slow convergence |
| Just right (0.01)  | Converges smoothly |
| Too large (1.0)    | May diverge or overshoot |
""",
            },
        ],
    },
    {
        "title": "Implementing Linear Regression with Scikit-Learn",
        "description": "Hands-on end-to-end implementation using Python and Scikit-Learn.",
        "order": 3,
        "difficulty": "medium",
        "estimated_duration": 60,
        "materials": [
            {
                "title": "End-to-End Linear Regression Project",
                "order": 1,
                "text_content": """# End-to-End Linear Regression - House Price Prediction

## Step 1: Import Libraries

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
```

## Step 2: Load Data

```python
from sklearn.datasets import fetch_california_housing

data = fetch_california_housing(as_frame=True)
df   = data.frame
print(df.head())
print(df.describe())
```

## Step 3: Exploratory Data Analysis

```python
plt.figure(figsize=(12, 8))
sns.heatmap(df.corr(), annot=True, cmap='coolwarm', fmt='.2f')
plt.title('Feature Correlation Matrix')
plt.show()
```

## Step 4: Prepare Features

```python
X = df.drop('MedHouseVal', axis=1)
y = df['MedHouseVal']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)
```

## Step 5: Train and Evaluate

```python
model = LinearRegression()
model.fit(X_train_scaled, y_train)

y_pred = model.predict(X_test_scaled)
mse    = mean_squared_error(y_test, y_pred)
r2     = r2_score(y_test, y_pred)

print(f"MSE:  {mse:.4f}")
print(f"RMSE: {mse**0.5:.4f}")
print(f"R2:   {r2:.4f}")
```

## Step 6: Visualize Results

```python
# Actual vs Predicted
plt.scatter(y_test, y_pred, alpha=0.3, color='steelblue')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
plt.xlabel('Actual Price')
plt.ylabel('Predicted Price')
plt.title('Actual vs Predicted House Prices')
plt.show()

# Residuals
residuals = y_test - y_pred
plt.hist(residuals, bins=50, color='coral', edgecolor='black')
plt.xlabel('Residuals')
plt.title('Residual Distribution')
plt.axvline(x=0, color='black', linestyle='--')
plt.show()
```

## Typical Results

- **R2 ~= 0.60** - Model explains 60% of variance
- Linear Regression is a strong baseline but misses non-linear patterns
- Try Ridge/Lasso or Polynomial Regression for improvements
""",
            },
            {
                "title": "Ridge, Lasso and Polynomial Regression",
                "order": 2,
                "text_content": """# Ridge, Lasso, and Polynomial Regression

## Why Regularization?

Standard Linear Regression can overfit when:
- Too many features
- Features are highly correlated
- Not enough training data

## Ridge Regression (L2)

  Cost = MSE + lambda * sum(B_j^2)

```python
from sklearn.linear_model import Ridge

ridge = Ridge(alpha=1.0)
ridge.fit(X_train_scaled, y_train)
print(f"Ridge R2: {ridge.score(X_test_scaled, y_test):.4f}")
```

## Lasso Regression (L1)

  Cost = MSE + lambda * sum(|B_j|)

Shrinks some coefficients to exactly zero = automatic feature selection.

```python
from sklearn.linear_model import Lasso

lasso = Lasso(alpha=0.01)
lasso.fit(X_train_scaled, y_train)

for feature, coef in zip(X.columns, lasso.coef_):
    if coef != 0:
        print(f"  {feature}: {coef:.4f}")
```

## Polynomial Regression

Transform features when data is non-linear:

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline

poly_model = Pipeline([
    ('poly',  PolynomialFeatures(degree=2, include_bias=False)),
    ('scale', StandardScaler()),
    ('lr',    LinearRegression())
])

poly_model.fit(X_train, y_train)
print(f"Polynomial R2: {poly_model.score(X_test, y_test):.4f}")
```

## Comparison Table

| Model | Regularization | Feature Selection | Best For |
|-------|---------------|------------------|----------|
| Linear Regression | None | No | Simple baseline |
| Ridge | L2 (squared) | No | Correlated features |
| Lasso | L1 (absolute) | Yes | Sparse models |
| ElasticNet | L1 + L2 | Yes | Combined benefits |
""",
            },
        ],
    },
]


GT_TOPICS = [
    {
        "title": "Graph Fundamentals",
        "description": "Learn the basic terminology and types of graphs used in CS and data science.",
        "order": 1,
        "difficulty": "easy",
        "estimated_duration": 40,
        "materials": [
            {
                "title": "Introduction to Graphs",
                "order": 1,
                "text_content": """# Introduction to Graphs

A **Graph** is a mathematical structure used to model pairwise relations between objects.

## Definition

A graph G = (V, E) consists of:
- **V** = Set of vertices (nodes)
- **E** = Set of edges (connections between nodes)

## Types of Graphs

### 1. Undirected Graph
Edges have no direction - connection is bidirectional.

```
A - B - C
|       |
D ----- E
```

### 2. Directed Graph (Digraph)
Edges have a direction (arrows).

```
A -> B -> C
^         |
|         v
D <------ E
```

### 3. Weighted Graph
Each edge has a numerical weight (cost, distance).

```
A --5-- B --3-- C
```

## Key Terminology

| Term | Definition |
|------|-----------|
| Vertex / Node | A single point in the graph |
| Edge / Arc | A connection between two nodes |
| Degree | Number of edges connected to a node |
| Path | Sequence of vertices connected by edges |
| Cycle | A path that starts and ends at the same vertex |
| Connected | All vertices reachable from any other |

## Graph Representation in Python

```python
# Adjacency List (dictionary)
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}

print("Vertices:", list(graph.keys()))
print("Neighbors of A:", graph['A'])
```

## Real-World Applications

- **Social Networks**: Users = nodes, Friendships = edges
- **Road Maps**: Cities = nodes, Roads = weighted edges
- **Web Graph**: Pages = nodes, Hyperlinks = directed edges
- **Recommendation Systems**: Users/Products = nodes, Interactions = edges
- **Biological Networks**: Proteins = nodes, Interactions = edges
""",
            },
            {
                "title": "Graph Representations - Adjacency Matrix and List",
                "order": 2,
                "text_content": """# Graph Representations

## 1. Adjacency Matrix

A 2D matrix where matrix[i][j] = 1 if there is an edge between vertex i and j.

```
Graph:  A - B - C
        |       |
        D ----- E

     A  B  C  D  E
A  [ 0  1  0  1  0 ]
B  [ 1  0  1  0  1 ]
C  [ 0  1  0  0  1 ]
D  [ 1  0  0  0  1 ]
E  [ 0  1  1  1  0 ]
```

```python
import numpy as np

adj_matrix = np.array([
    [0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
])

def get_neighbors(matrix, node):
    return [i for i, val in enumerate(matrix[node]) if val == 1]

print("Neighbors of A (node 0):", get_neighbors(adj_matrix, 0))
```

Pros: O(1) edge lookup
Cons: O(V^2) space - wasteful for sparse graphs

## 2. Adjacency List

```python
graph = {
    'A': ['B', 'D'],
    'B': ['A', 'C', 'E'],
    'C': ['B', 'E'],
    'D': ['A', 'E'],
    'E': ['B', 'C', 'D']
}

print("Neighbors of A:", graph.get('A', []))
```

Pros: O(V + E) space - efficient for sparse graphs
Cons: O(degree) edge lookup

## 3. Using NetworkX Library

```python
import networkx as nx
import matplotlib.pyplot as plt

G = nx.Graph()
G.add_edges_from([('A','B'), ('A','D'), ('B','C'), ('B','E'), ('C','E'), ('D','E')])

nx.draw(G, with_labels=True, node_color='lightblue',
        node_size=1000, font_size=14, font_weight='bold')
plt.title('Graph Visualization')
plt.show()

print("Nodes:", list(G.nodes()))
print("Edges:", list(G.edges()))
print("Degree of B:", G.degree('B'))
```

## Comparison

| Metric | Adjacency Matrix | Adjacency List |
|--------|-----------------|----------------|
| Space  | O(V^2)          | O(V + E)       |
| Check edge | O(1)       | O(degree)      |
| Best for   | Dense      | Sparse         |
""",
            },
        ],
    },
    {
        "title": "Graph Traversal Algorithms",
        "description": "Master BFS and DFS - the two fundamental graph traversal algorithms.",
        "order": 2,
        "difficulty": "medium",
        "estimated_duration": 50,
        "materials": [
            {
                "title": "Breadth-First Search (BFS)",
                "order": 1,
                "text_content": """# Breadth-First Search (BFS)

BFS explores a graph **level by level** - visiting all neighbors before going deeper.

## How BFS Works

1. Start at a source node
2. Visit all immediate neighbors (Level 1)
3. Then visit their neighbors (Level 2)
4. Continue until all reachable nodes are visited
5. Uses a **Queue** (FIFO) data structure

## Visual Example

```
Graph:    1
         / \\
        2   3
       / \\   \\
      4   5   6

BFS from 1: 1 -> 2 -> 3 -> 4 -> 5 -> 6
```

## Python Implementation

```python
from collections import deque

def bfs(graph, start):
    visited = set()
    queue   = deque([start])
    order   = []

    visited.add(start)

    while queue:
        node = queue.popleft()
        order.append(node)

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order

graph = {
    1: [2, 3],
    2: [1, 4, 5],
    3: [1, 6],
    4: [2],
    5: [2],
    6: [3]
}

print("BFS order:", bfs(graph, 1))
# Output: [1, 2, 3, 4, 5, 6]
```

## BFS Applications

- Shortest path in unweighted graphs
- Level order traversal of trees
- Finding people within N degrees of separation (social networks)
- Web crawlers - exploring pages layer by layer

## Complexity

| Metric | Value |
|--------|-------|
| Time   | O(V + E) |
| Space  | O(V) |
""",
            },
            {
                "title": "Depth-First Search (DFS)",
                "order": 2,
                "text_content": """# Depth-First Search (DFS)

DFS explores a graph by going as **deep as possible** along each branch before backtracking.

## How DFS Works

1. Start at a source node
2. Go deep along one path
3. When stuck (dead end), backtrack to the last node with unvisited neighbors
4. Uses a **Stack** (LIFO) - explicitly or via recursion

## Visual Example

```
Graph:    1
         / \\
        2   3
       / \\   \\
      4   5   6

DFS from 1: 1 -> 2 -> 4 -> 5 -> 3 -> 6
```

## Recursive Implementation

```python
def dfs(graph, node, visited=None, order=None):
    if visited is None:
        visited = set()
        order   = []

    visited.add(node)
    order.append(node)

    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited, order)

    return order

graph = {
    1: [2, 3],
    2: [1, 4, 5],
    3: [1, 6],
    4: [2],
    5: [2],
    6: [3]
}

print("DFS order:", dfs(graph, 1))
# Output: [1, 2, 4, 5, 3, 6]
```

## Iterative Implementation (Stack)

```python
def dfs_iterative(graph, start):
    visited = set()
    stack   = [start]
    order   = []

    while stack:
        node = stack.pop()
        if node not in visited:
            visited.add(node)
            order.append(node)
            for neighbor in reversed(graph[node]):
                if neighbor not in visited:
                    stack.append(neighbor)

    return order
```

## DFS Applications

- Cycle detection in graphs
- Topological sorting (task scheduling)
- Path finding (maze solving)
- Detecting connected components

## BFS vs DFS Comparison

| Feature | BFS | DFS |
|---------|-----|-----|
| Data Structure | Queue | Stack / Recursion |
| Traversal | Level by level | Deep first |
| Shortest Path | Yes (unweighted) | No |
| Memory | O(width) | O(depth) |
| Best for | Shortest path | Cycle detection, Topo sort |
""",
            },
        ],
    },
    {
        "title": "Shortest Path Algorithms",
        "description": "Learn Dijkstra's algorithm and Minimum Spanning Trees for weighted graphs.",
        "order": 3,
        "difficulty": "hard",
        "estimated_duration": 60,
        "materials": [
            {
                "title": "Dijkstra's Algorithm",
                "order": 1,
                "text_content": """# Dijkstra's Algorithm

Dijkstra's finds the **shortest path** from a source node to all other nodes in a weighted graph (non-negative weights only).

## Core Idea

- Greedily pick the unvisited node with the smallest known distance
- Update distances to its neighbors
- Repeat until all nodes are visited

## Step-by-Step Example

```
Graph (weighted):
A --4-- B
|       |
2       5
|       |
C --1-- D --3-- E

Start from A:
dist = {A:0, B:inf, C:inf, D:inf, E:inf}

1. Visit A  -> update B=4, C=2
2. Visit C  -> update D=3  (2+1)
3. Visit D  -> update B=8? No (4<8), E=6  (3+3)
4. Visit B  -> no improvement
5. Visit E  -> done

Final: A=0, C=2, D=3, B=4, E=6
```

## Python Implementation

```python
import heapq

def dijkstra(graph, start):
    # graph = {node: [(neighbor, weight), ...]}
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    heap = [(0, start)]

    while heap:
        curr_dist, curr_node = heapq.heappop(heap)

        if curr_dist > distances[curr_node]:
            continue

        for neighbor, weight in graph[curr_node]:
            distance = curr_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(heap, (distance, neighbor))

    return distances

graph = {
    'A': [('B', 4), ('C', 2)],
    'B': [('A', 4), ('D', 5)],
    'C': [('A', 2), ('D', 1)],
    'D': [('B', 5), ('C', 1), ('E', 3)],
    'E': [('D', 3)]
}

distances = dijkstra(graph, 'A')
for node, dist in sorted(distances.items()):
    print(f"  A -> {node}: {dist}")
```

## Using NetworkX

```python
import networkx as nx

G = nx.DiGraph()
G.add_weighted_edges_from([
    ('A','B',4), ('A','C',2), ('B','D',5),
    ('C','D',1), ('D','E',3)
])

path   = nx.shortest_path(G, 'A', 'E', weight='weight')
length = nx.shortest_path_length(G, 'A', 'E', weight='weight')
print(f"Shortest path A->E: {path}")
print(f"Distance: {length}")
```

## Complexity

| | Complexity |
|--|-----------|
| Time | O((V + E) log V) |
| Space | O(V) |

Note: Dijkstra does NOT work with negative edge weights.
""",
            },
            {
                "title": "Minimum Spanning Tree - Kruskal and Prim",
                "order": 2,
                "text_content": """# Minimum Spanning Tree (MST)

An MST connects all vertices in a weighted undirected graph with minimum total edge weight, without cycles.

## Real-World Use Cases

- Designing cheapest road or network connections
- Laying minimum optical fiber cables
- Cluster analysis in data science
- Image segmentation

## Kruskal's Algorithm

1. Sort all edges by weight (ascending)
2. Add edges one by one - skip if adding creates a cycle
3. Stop when V-1 edges are added

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank   = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True

def kruskal(n, edges):
    # edges = [(weight, u, v)]
    edges.sort()
    uf  = UnionFind(n)
    mst = []
    for weight, u, v in edges:
        if uf.union(u, v):
            mst.append((u, v, weight))
    return mst

edges = [(4,0,1),(2,0,2),(5,1,3),(1,2,3),(3,3,4)]
mst = kruskal(5, edges)
print("MST edges:", mst)
print("Total cost:", sum(w for _,_,w in mst))
```

## NetworkX MST

```python
import networkx as nx

G = nx.Graph()
G.add_weighted_edges_from([(0,1,4),(0,2,2),(1,3,5),(2,3,1),(3,4,3)])

mst = nx.minimum_spanning_tree(G)
print("MST edges:", list(mst.edges(data=True)))
print("MST weight:", mst.size(weight='weight'))
```

## Kruskal vs Prim

| | Kruskal | Prim |
|--|---------|------|
| Approach | Edge-based | Vertex-based |
| Data structure | Union-Find | Min-Heap |
| Best for | Sparse graphs | Dense graphs |
| Complexity | O(E log E) | O(E log V) |
""",
            },
        ],
    },
    {
        "title": "Graphs in Data Science and Machine Learning",
        "description": "Learn how graph theory powers modern DS/ML - from social network analysis to Graph Neural Networks.",
        "order": 4,
        "difficulty": "hard",
        "estimated_duration": 60,
        "materials": [
            {
                "title": "Social Network Analysis with NetworkX",
                "order": 1,
                "text_content": """# Social Network Analysis with NetworkX

Graph theory is the backbone of social network analysis.

## Setup

```python
import networkx as nx
import matplotlib.pyplot as plt

# Classic benchmark dataset
G = nx.karate_club_graph()
print(f"Nodes: {G.number_of_nodes()}")
print(f"Edges: {G.number_of_edges()}")
```

## Key Centrality Metrics

### 1. Degree Centrality - Who has the most connections?

```python
degree_centrality = nx.degree_centrality(G)
top_nodes = sorted(degree_centrality, key=degree_centrality.get, reverse=True)[:5]
print("Most connected nodes:", top_nodes)
```

### 2. Betweenness Centrality - Who acts as a bridge?

```python
betweenness = nx.betweenness_centrality(G)
top_bridges = sorted(betweenness, key=betweenness.get, reverse=True)[:5]
print("Top bridge nodes:", top_bridges)
```

### 3. PageRank - Who is most important?

```python
pagerank = nx.pagerank(G, alpha=0.85)
top_pr = sorted(pagerank, key=pagerank.get, reverse=True)[:5]
print("Most important nodes (PageRank):", top_pr)
```

## Community Detection

```python
from networkx.algorithms import community

communities = community.greedy_modularity_communities(G)
print(f"Found {len(communities)} communities")
for i, comm in enumerate(communities):
    print(f"  Community {i+1}: {sorted(comm)}")
```

## Visualization

```python
pos = nx.spring_layout(G, seed=42)
colors = []
for node in G.nodes():
    for i, comm in enumerate(communities):
        if node in comm:
            colors.append(i)

plt.figure(figsize=(12, 8))
nx.draw_networkx(G, pos,
    node_color=colors,
    cmap=plt.cm.Set3,
    node_size=300,
    with_labels=True,
    font_size=8
)
plt.title('Social Network - Communities Detected')
plt.axis('off')
plt.show()
```

## Practical Applications

- **Friend Recommendations**: Shortest path between users
- **Influence Analysis**: Identify users to target for viral marketing
- **Fraud Detection**: Detect unusual connection patterns
- **Knowledge Graphs**: Power AI reasoning and Q&A systems
""",
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed Linear Regression and Graph Theory content into the Data Science course"

    def handle(self, *args, **options):
        try:
            course = Course.objects.get(id=4)
        except Course.DoesNotExist:
            self.stderr.write(self.style.ERROR("Course with id=4 not found! Aborting."))
            return

        self.stdout.write(self.style.SUCCESS(f"\nAdding content to: {course.title} (id={course.id})"))

        # ── Linear Regression Subject ──────────────────────────────────────
        self._seed_subject(
            course=course,
            title="Linear Regression",
            description=(
                "A comprehensive introduction to Linear Regression - one of the most "
                "fundamental supervised learning algorithms in machine learning and statistics."
            ),
            order=2,
            topics=LR_TOPICS,
        )

        # ── Graph Theory Subject ───────────────────────────────────────────
        self._seed_subject(
            course=course,
            title="Graph Theory",
            description=(
                "Explore graphs - mathematical structures used to model pairwise relations "
                "between objects. A critical tool in computer science, data science, and "
                "network analysis."
            ),
            order=3,
            topics=GT_TOPICS,
        )

        # ── Summary ───────────────────────────────────────────────────────
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("SEEDING COMPLETE!"))
        self.stdout.write("=" * 60)
        for s in course.subjects.all().order_by("order"):
            t_count = s.topics.count()
            m_count = sum(t.materials.count() for t in s.topics.all())
            self.stdout.write(f"\n  Subject: {s.title}  ({t_count} topics, {m_count} materials)")
            for t in s.topics.all().order_by("order"):
                self.stdout.write(f"    - {t.title}  ({t.materials.count()} materials)")

    def _seed_subject(self, course, title, description, order, topics):
        subject, created = Subject.objects.get_or_create(
            course=course,
            title=title,
            defaults={"description": description, "order": order, "is_published": True},
        )
        status = "Created" if created else "Already exists"
        self.stdout.write(f"\n  [{status}] Subject: {subject.title}")

        for topic_data in topics:
            materials = topic_data.pop("materials", [])
            topic, t_created = Topic.objects.get_or_create(
                subject=subject,
                title=topic_data["title"],
                defaults={
                    "description": topic_data.get("description", ""),
                    "order": topic_data.get("order", 1),
                    "is_published": True,
                    "difficulty": topic_data.get("difficulty", "easy"),
                    "estimated_duration": topic_data.get("estimated_duration", 30),
                },
            )
            t_status = "Created" if t_created else "Already exists"
            self.stdout.write(f"    [{t_status}] Topic: {topic.title}")

            for mat_data in materials:
                mat, m_created = Material.objects.get_or_create(
                    topic=topic,
                    title=mat_data["title"],
                    defaults={
                        "material_type": "text",
                        "order": mat_data.get("order", 1),
                        "is_published": True,
                        "text_content": mat_data.get("text_content", ""),
                    },
                )
                m_status = "Created" if m_created else "Already exists"
                self.stdout.write(f"      [{m_status}] Material: {mat.title}")

            # Restore materials back into topic_data (idempotency)
            topic_data["materials"] = materials
