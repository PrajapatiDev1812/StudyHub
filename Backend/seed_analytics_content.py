"""
Seed real educational content for the Data Science & Analytics Curriculum (course id=5).
"""
import os
# pyrefly: ignore [missing-import]
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from courses.models import Course, Subject, Topic, Material

course = Course.objects.get(id=5)
print(f"Seeding content for: {course.title}")

# ─── SUBJECT: Data Warehousing ────────────────────────────────────────────────

dw_subject = Subject.objects.get(title='Data Warehousing', course=course)

t1, _ = Topic.objects.get_or_create(
    subject=dw_subject, title='Introduction to Data Warehousing',
    defaults={'description': 'Core concepts of data warehousing, OLAP vs OLTP, and dimensional modeling.', 'order': 1, 'is_published': True, 'difficulty': 'easy', 'estimated_duration': '30 min'}
)

Material.objects.get_or_create(
    topic=t1, title='Data Warehousing Fundamentals',
    defaults={'material_type': 'notes', 'order': 1, 'is_published': True, 'duration': '25 min',
    'description': 'Learn the core concepts of data warehousing and how it differs from transactional databases.',
    'text_content': """# Data Warehousing Fundamentals

## What is a Data Warehouse?

A data warehouse is a **centralized repository** designed to store, integrate, and manage large volumes of structured data from multiple sources for reporting and analysis.

## OLTP vs OLAP

| Feature | OLTP | OLAP |
|---------|------|------|
| Purpose | Day-to-day transactions | Analysis and reporting |
| Data | Current, detailed | Historical, aggregated |
| Queries | Simple, fast | Complex, analytical |
| Users | Clerks, customers | Analysts, managers |
| Example | Banking system | Sales dashboard |

## Key Components

1. **ETL (Extract, Transform, Load)** — Pipeline that moves data from source systems into the warehouse
2. **Data Staging Area** — Temporary storage for raw data before transformation
3. **Data Warehouse** — Central repository with clean, integrated data
4. **Data Marts** — Subsets focused on specific departments (sales, HR, finance)
5. **BI Tools** — Reporting and visualization (Tableau, Power BI)

## Dimensional Modeling

### Star Schema

The most common design pattern:

- **Fact Table** — Contains measurable, quantitative data (sales amount, quantity)
- **Dimension Tables** — Contains descriptive attributes (customer name, product category, date)

  Fact_Sales
  ├── sale_id (PK)
  ├── product_id (FK) → Dim_Product
  ├── customer_id (FK) → Dim_Customer
  ├── date_id (FK) → Dim_Date
  ├── quantity
  └── total_amount

### Snowflake Schema

Like star schema but dimension tables are **normalized** into sub-tables:

  Dim_Product → Dim_Category → Dim_Department

## Data Warehouse Architecture

  Source Systems → ETL → Staging → Data Warehouse → Data Marts → BI Tools

## Benefits

- **Single Source of Truth** — Consistent data across the organization
- **Historical Analysis** — Track trends over time
- **Better Decision Making** — Fast, complex queries on large datasets
- **Data Quality** — Cleaned and validated during ETL

## Practice Exercises

1. Design a star schema for an e-commerce platform
2. List the differences between a data warehouse and a data lake
3. Describe the ETL process for loading daily sales data
"""}
)

# ─── SUBJECT: Machine Learning Systems ────────────────────────────────────────

ml_subject = Subject.objects.get(title='Machine Learning Systems', course=course)

t2, _ = Topic.objects.get_or_create(
    subject=ml_subject, title='Introduction to Machine Learning',
    defaults={'description': 'Types of ML, supervised vs unsupervised, and the ML pipeline.', 'order': 1, 'is_published': True, 'difficulty': 'easy', 'estimated_duration': '35 min'}
)

Material.objects.get_or_create(
    topic=t2, title='Machine Learning Overview',
    defaults={'material_type': 'notes', 'order': 1, 'is_published': True, 'duration': '25 min',
    'description': 'A comprehensive introduction to machine learning concepts and types.',
    'text_content': """# Machine Learning Overview

## What is Machine Learning?

Machine Learning is a subset of Artificial Intelligence that enables systems to **learn from data** and improve their performance without being explicitly programmed.

## Types of Machine Learning

### 1. Supervised Learning

The model learns from **labeled data** — input-output pairs.

- **Classification** — Predict a category
  - Email: spam or not spam
  - Image: cat or dog
  - Algorithms: Logistic Regression, SVM, Random Forest, Neural Networks

- **Regression** — Predict a continuous value
  - House price prediction
  - Temperature forecasting
  - Algorithms: Linear Regression, Decision Trees, XGBoost

### 2. Unsupervised Learning

The model finds patterns in **unlabeled data**.

- **Clustering** — Group similar data points
  - Customer segmentation
  - Algorithms: K-Means, DBSCAN, Hierarchical

- **Dimensionality Reduction** — Reduce features while preserving information
  - PCA, t-SNE, UMAP

### 3. Reinforcement Learning

The agent learns by **interacting with an environment** and receiving rewards/penalties.

- Game playing (AlphaGo)
- Robotics
- Autonomous driving

## The ML Pipeline

  1. Problem Definition
  2. Data Collection
  3. Data Preprocessing (cleaning, encoding, scaling)
  4. Feature Engineering
  5. Model Selection
  6. Training
  7. Evaluation (accuracy, precision, recall, F1)
  8. Hyperparameter Tuning
  9. Deployment
  10. Monitoring and Retraining

## Model Evaluation Metrics

### Classification Metrics

- **Accuracy** = Correct predictions / Total predictions
- **Precision** = True Positives / (True Positives + False Positives)
- **Recall** = True Positives / (True Positives + False Negatives)
- **F1 Score** = 2 × (Precision × Recall) / (Precision + Recall)

### Regression Metrics

- **MAE** (Mean Absolute Error) = average of |actual - predicted|
- **MSE** (Mean Squared Error) = average of (actual - predicted)²
- **R² Score** = 1 - (SS_res / SS_tot)

## Overfitting vs Underfitting

- **Overfitting** — Model memorizes training data, performs poorly on new data
  - Solution: More data, regularization, simpler model, dropout

- **Underfitting** — Model is too simple to capture patterns
  - Solution: More features, complex model, less regularization

## Practice Exercises

1. Classify a problem as supervised/unsupervised/reinforcement learning
2. Design an ML pipeline for predicting customer churn
3. Explain the bias-variance tradeoff with examples
"""}
)

t3, _ = Topic.objects.get_or_create(
    subject=ml_subject, title='Model Training and Evaluation',
    defaults={'description': 'Train-test splits, cross-validation, and evaluation strategies.', 'order': 2, 'is_published': True, 'difficulty': 'medium', 'estimated_duration': '30 min'}
)

Material.objects.get_or_create(
    topic=t3, title='Training, Validation, and Testing',
    defaults={'material_type': 'notes', 'order': 1, 'is_published': True, 'duration': '25 min',
    'description': 'Learn how to properly split data, validate models, and avoid common pitfalls.',
    'text_content': """# Training, Validation, and Testing

## Why Split Data?

We split data to evaluate how well our model generalizes to **unseen data**.

## Train-Test Split

  from sklearn.model_selection import train_test_split

  X_train, X_test, y_train, y_test = train_test_split(
      X, y, test_size=0.2, random_state=42
  )

- **Training set (80%)** — Model learns from this
- **Test set (20%)** — Final evaluation (never seen during training)

## Train-Validation-Test Split

  # First split: separate test set
  X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.15)

  # Second split: separate validation set
  X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.18)

- **Training set (70%)** — Model learns
- **Validation set (15%)** — Tune hyperparameters
- **Test set (15%)** — Final unbiased evaluation

## K-Fold Cross-Validation

  from sklearn.model_selection import cross_val_score

  scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
  print(f"Mean accuracy: {scores.mean():.3f} ± {scores.std():.3f}")

How it works:
1. Split data into K equal folds
2. Train on K-1 folds, validate on 1 fold
3. Repeat K times (each fold is the validation set once)
4. Average the results

## Stratified K-Fold

Ensures each fold has the same class distribution:

  from sklearn.model_selection import StratifiedKFold

  skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
  for train_idx, val_idx in skf.split(X, y):
      X_train, X_val = X[train_idx], X[val_idx]
      y_train, y_val = y[train_idx], y[val_idx]

## Confusion Matrix

  from sklearn.metrics import confusion_matrix, classification_report

  y_pred = model.predict(X_test)
  cm = confusion_matrix(y_test, y_pred)
  print(classification_report(y_test, y_pred))

                   Predicted
                  Neg    Pos
  Actual  Neg  [  TN  |  FP  ]
          Pos  [  FN  |  TP  ]

## Common Mistakes

1. **Data leakage** — Using test data during training or feature engineering
2. **Not stratifying** — Imbalanced classes require stratified splits
3. **Tuning on test set** — Use validation set for tuning, test for final evaluation
4. **Ignoring random seed** — Always set random_state for reproducibility

## Practice Exercises

1. Implement 5-fold cross-validation on a classification dataset
2. Generate and interpret a confusion matrix
3. Compare model performance with different test set sizes
"""}
)

# ─── SUBJECT: Natural Language Processing ─────────────────────────────────────

nlp_subject = Subject.objects.get(title='Natural Language Processing', course=course)

t4, _ = Topic.objects.get_or_create(
    subject=nlp_subject, title='Text Preprocessing',
    defaults={'description': 'Tokenization, stemming, lemmatization, and text cleaning.', 'order': 1, 'is_published': True, 'difficulty': 'easy', 'estimated_duration': '30 min'}
)

Material.objects.get_or_create(
    topic=t4, title='NLP Text Preprocessing Pipeline',
    defaults={'material_type': 'notes', 'order': 1, 'is_published': True, 'duration': '25 min',
    'description': 'Step-by-step guide to cleaning and preprocessing text data for NLP tasks.',
    'text_content': """# NLP Text Preprocessing Pipeline

## Why Preprocess Text?

Raw text is messy — it contains noise, inconsistencies, and irrelevant information. Preprocessing transforms text into a clean, structured format for ML models.

## Step 1: Lowercasing

  text = "Hello World! NLP is AMAZING."
  text = text.lower()
  # "hello world! nlp is amazing."

## Step 2: Removing Noise

  import re

  # Remove URLs
  text = re.sub(r'http\\S+', '', text)

  # Remove special characters
  text = re.sub(r'[^a-zA-Z0-9\\s]', '', text)

  # Remove numbers (optional)
  text = re.sub(r'\\d+', '', text)

  # Remove extra whitespace
  text = re.sub(r'\\s+', ' ', text).strip()

## Step 3: Tokenization

Breaking text into individual words or sentences:

  # Word tokenization with NLTK
  import nltk
  tokens = nltk.word_tokenize("The cat sat on the mat")
  # ['The', 'cat', 'sat', 'on', 'the', 'mat']

  # Sentence tokenization
  sentences = nltk.sent_tokenize("Hello! How are you? I'm fine.")
  # ['Hello!', 'How are you?', "I'm fine."]

## Step 4: Stop Word Removal

Stop words are common words that add little meaning:

  from nltk.corpus import stopwords
  stop_words = set(stopwords.words('english'))
  # {'the', 'is', 'in', 'and', 'to', 'a', ...}

  tokens = ["the", "cat", "sat", "on", "the", "mat"]
  filtered = [w for w in tokens if w not in stop_words]
  # ['cat', 'sat', 'mat']

## Step 5: Stemming

Reducing words to their root form (crude but fast):

  from nltk.stem import PorterStemmer
  stemmer = PorterStemmer()

  words = ["running", "runs", "runner", "ran"]
  stems = [stemmer.stem(w) for w in words]
  # ['run', 'run', 'runner', 'ran']

## Step 6: Lemmatization

More accurate than stemming — uses vocabulary and morphological analysis:

  from nltk.stem import WordNetLemmatizer
  lemmatizer = WordNetLemmatizer()

  print(lemmatizer.lemmatize("better", pos="a"))   # "good"
  print(lemmatizer.lemmatize("running", pos="v"))   # "run"
  print(lemmatizer.lemmatize("mice"))               # "mouse"

## Step 7: Vectorization

Converting text to numerical features:

  # Bag of Words
  from sklearn.feature_extraction.text import CountVectorizer
  vectorizer = CountVectorizer()
  X = vectorizer.fit_transform(["I love NLP", "NLP is great"])

  # TF-IDF
  from sklearn.feature_extraction.text import TfidfVectorizer
  tfidf = TfidfVectorizer()
  X = tfidf.fit_transform(documents)

## Complete Preprocessing Function

  def preprocess(text):
      text = text.lower()
      text = re.sub(r'[^a-zA-Z\\s]', '', text)
      tokens = nltk.word_tokenize(text)
      tokens = [w for w in tokens if w not in stop_words]
      lemmatizer = WordNetLemmatizer()
      tokens = [lemmatizer.lemmatize(w) for w in tokens]
      return ' '.join(tokens)

## Practice Exercises

1. Build a text preprocessing pipeline for movie reviews
2. Compare the output of stemming vs lemmatization on a paragraph
3. Create a TF-IDF matrix from a collection of documents
"""}
)

t5, _ = Topic.objects.get_or_create(
    subject=nlp_subject, title='Sentiment Analysis',
    defaults={'description': 'Build a sentiment classifier using text data.', 'order': 2, 'is_published': True, 'difficulty': 'medium', 'estimated_duration': '35 min'}
)

Material.objects.get_or_create(
    topic=t5, title='Building a Sentiment Analysis Model',
    defaults={'material_type': 'notes', 'order': 1, 'is_published': True, 'duration': '30 min',
    'description': 'Step-by-step guide to building a sentiment classifier using scikit-learn.',
    'text_content': """# Building a Sentiment Analysis Model

## What is Sentiment Analysis?

Sentiment analysis determines the **emotional tone** behind text — positive, negative, or neutral.

## Applications

- Product review analysis
- Social media monitoring
- Customer feedback classification
- Brand reputation tracking

## End-to-End Pipeline

### Step 1: Load Data

  import pandas as pd
  df = pd.read_csv("reviews.csv")
  print(df.head())
  print(df['sentiment'].value_counts())

### Step 2: Preprocess Text

  import re
  import nltk
  from nltk.corpus import stopwords

  def clean_text(text):
      text = text.lower()
      text = re.sub(r'[^a-zA-Z\\s]', '', text)
      tokens = text.split()
      tokens = [w for w in tokens if w not in stopwords.words('english')]
      return ' '.join(tokens)

  df['clean_text'] = df['review'].apply(clean_text)

### Step 3: Vectorize

  from sklearn.feature_extraction.text import TfidfVectorizer

  tfidf = TfidfVectorizer(max_features=5000)
  X = tfidf.fit_transform(df['clean_text'])
  y = df['sentiment']

### Step 4: Train-Test Split

  from sklearn.model_selection import train_test_split
  X_train, X_test, y_train, y_test = train_test_split(
      X, y, test_size=0.2, random_state=42, stratify=y
  )

### Step 5: Train Model

  from sklearn.naive_bayes import MultinomialNB
  from sklearn.linear_model import LogisticRegression

  # Naive Bayes (great baseline for text)
  nb_model = MultinomialNB()
  nb_model.fit(X_train, y_train)

  # Logistic Regression (often better)
  lr_model = LogisticRegression(max_iter=1000)
  lr_model.fit(X_train, y_train)

### Step 6: Evaluate

  from sklearn.metrics import classification_report, accuracy_score

  y_pred = lr_model.predict(X_test)
  print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")
  print(classification_report(y_test, y_pred))

### Step 7: Predict New Text

  def predict_sentiment(text):
      clean = clean_text(text)
      vector = tfidf.transform([clean])
      prediction = lr_model.predict(vector)[0]
      probability = lr_model.predict_proba(vector).max()
      return prediction, probability

  sentiment, confidence = predict_sentiment("This product is amazing!")
  print(f"Sentiment: {sentiment} (confidence: {confidence:.2f})")

## Improving Performance

- Use **n-grams**: `TfidfVectorizer(ngram_range=(1, 2))`
- Try **ensemble methods**: Random Forest, Gradient Boosting
- **Handle imbalanced data**: SMOTE, class weights
- Use **pre-trained embeddings**: Word2Vec, GloVe
- Try **deep learning**: LSTM, BERT for state-of-the-art results

## Practice Exercises

1. Build a sentiment classifier for movie reviews
2. Compare Naive Bayes vs Logistic Regression performance
3. Visualize the most important features (words) for each class
"""}
)

print(f"\n✅ Data Science & Analytics content seeded!")
for subj in course.subjects.all():
    topics = subj.topics.count()
    mats = Material.objects.filter(topic__subject=subj).count()
    print(f"  {subj.title}: {topics} topics, {mats} materials")
