# StudyHub

StudyHub is a comprehensive e-learning platform and student dashboard that provides tools for course management, assessments, focus tracking, gamification, and AI-powered study assistance. 

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **UI Components & Animations**: Framer Motion, Lucide React, Recharts
- **HTTP Client**: Axios

### Backend
- **Framework**: Django 6.0 + Django REST Framework (DRF)
- **Authentication**: JWT (SimpleJWT) + Django OTP for Two-Factor Authentication
- **API Documentation**: drf-yasg (Swagger/OpenAPI)
- **Features / Apps**:
  - `accounts`: User authentication and management
  - `courses`: Course management system
  - `assessments`: Quizzes and grading
  - `tasks`: Student tasks and assignments
  - `focus`: Focus tracking and study timers
  - `materials`: Study material and resources management
  - `ai`: AI-powered study assistance features
  - `gamification`: Badges, streaks, and leaderboards
  - `analytics`: Study analytics and progress tracking
  - `dashboard`: Main dashboard aggregation
  - `notifications`: User alerts and updates

## 📁 Project Structure

```
StudyHub/
├── Backend/                 # Django backend
│   ├── config/              # Main project settings
│   ├── manage.py            # Django entry point
│   ├── requirements.txt     # Backend dependencies
│   └── (Django apps)        # accounts, courses, ai, etc.
└── Frontend/                # React frontend
    ├── src/                 # React source code
    ├── public/              # Static assets
    ├── package.json         # Frontend dependencies
    └── vite.config.js       # Vite configuration
```

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### Backend Setup

1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies (assuming you have a `requirements.txt`):
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Copy `.env.example` to `.env` and fill in the required values.
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 API Documentation

Once the backend server is running, you can access the Swagger API documentation at:
- `http://localhost:8000/swagger/` (or the respective URL configured in `urls.py`)

## 📄 License

This project is licensed under the MIT License.
