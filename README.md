# 📚 StudyHub – Academic Content Management Platform

## 🚀 Overview
StudyHub is a web-based academic platform designed to organize, manage, and access study materials efficiently. It provides a structured learning system for students and administrators with future integration of AI-based assistance.

---

## 🎯 Key Features
- 📂 Course → Subject → Topic → Content hierarchy
- 👨‍🏫 Admin panel for uploading and managing study materials
- 👨‍🎓 Student panel for accessing and saving notes
- 🔐 JWT-based authentication system
- 📊 Organized storage for admin and student data
- 🤖 Planned AI integration using Gemini API (RAG-based system)

---

## 🛠️ Tech Stack
- **Backend:** Django, Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** JWT (SimpleJWT)
- **Frontend:** HTML, CSS, JavaScript (basic)
- **API Testing:** Swagger / Postman

---

## 🧠 AI Integration (Planned)
- Retrieval-Augmented Generation (RAG)
- Embeddings + Vector Search
- Separate indexing for:
  - Admin data
  - Student notes
- Context-aware academic assistant

---

## 📊 System Architecture
- Admin uploads structured study material
- Data stored in relational database
- Content indexed for AI retrieval
- Students interact via dashboard

---

## 📸 Screenshots
*(Add screenshots here – very important)*
- Admin Panel
- Course Structure
- Dashboard UI

---

## ⚙️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/studyhub.git

# Navigate to project
cd studyhub

# Create virtual environment
python -m venv env

# Activate environment
env\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Run server
python manage.py runserver
