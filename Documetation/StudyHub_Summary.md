# 📚 StudyHub — Application Summary & Blueprint

> **Version:** 1.0 (Initial Concept)
> **Date:** February 20, 2026
> **University:** GSFC University
> **Initial Course:** M.Sc. Data Science (Previous Year & Final Year)

---

## 1. Overview

**StudyHub** is a comprehensive educational platform designed to bridge the gap between teachers (admins) and students (users). It supports content delivery, practice assessments, AI-powered tutoring, and performance tracking — all within a secure, offline-capable environment.

| Attribute | Detail |
|---|---|
| **App Name** | StudyHub |
| **Admin** | Professors / Teachers |
| **Users** | Students |
| **Initial Users** | 12 students |
| **Auth Method** | University portal credentials (username & password) |
| **Modes** | Online & Offline |
| **Monetisation** | Minimal ads |
| **AI Integration** | Built-in AI study bot |

---

## 2. Core Concepts

### 2.1 Roles & Access Control

| Role | Capabilities |
|---|---|
| **Super Admin** | Full control. Can transfer admin rights or promote other users to admin. |
| **Admin (Teacher)** | Create/manage classes & folders, upload materials, conduct tests, control content visibility (public/private), grant student access. |
| **Student** | Access assigned materials, take tests, interact with AI bot, track performance. |

- Initially **one** Super Admin; supports **multi-admin** in future.
- Admin can **grant or revoke** student access to the app.
- Every username and password is **unique** across the entire platform.

### 2.2 Authentication & Session Management

- Students log in with **university-issued username & password**.
- Login credentials are **stored locally** after first login (auto-fill on subsequent launches).
- On **logout**, stored credentials are cleared — user must re-enter details.
- Admins can authenticate via **Google / Phone / Email**.

---

## 3. Admin Perspective

### 3.1 Login Flow

```
App Launch → "Login as Admin" / "Login as Student"
         ↓
   Admin selects "Login as Admin"
         ↓
   Authenticate via Google / Phone / Email
         ↓
   Admin Dashboard
```

### 3.2 Admin Capabilities

| Feature | Description |
|---|---|
| **Create Class / Folder** | Name, description, section, subject fields. Organises content per course. |
| **Modify Class** | Settings button on each class for editing anytime. |
| **Upload Materials** | PPTs, Word docs, images, videos, direct Drive/video links. |
| **Access Control** | Set content as **Public** (anyone) or **Private** (permitted students only). |
| **Share Research** | Optionally share research papers, interesting links, helpful resources. |
| **Practice Questions** | Create and assign practice question sets. |
| **Conduct Tests** | Objective / one-liner question tests for students. |
| **Manage Students** | Grant/revoke app access per student. |

---

## 4. Student Perspective

### 4.1 Login Flow

```
App Launch → "Login as Admin" / "Login as Student"
         ↓
   Student selects "Login as Student"
         ↓
   Select Category (see below)
         ↓
   Authenticate with provided credentials
         ↓
   Auto-redirect to enrolled course
```

### 4.2 Student Categories & Auth Rules

| Category | Auth Method | Password Change | Notes |
|---|---|---|---|
| **Nursery** | Username/Password (AI-generated) or guardian's email/phone | ❌ | Unique per student |
| **Primary School** | Username/Password or guardian's email/phone | ❌ | Unique per student |
| **Secondary School** | Username/Password or guardian's email/phone | ❌ | Unique per student |
| **Higher Secondary** | Username/Password or registered phone/email | ❌ | May use personal devices |
| **University / College** | University-issued username/password | ✅ | No personal email/phone login |
| **Extra Courses / Other** | Personal details (email/phone) | ✅ | Low-cost courses, certificate + 100% refund program |

### 4.3 Course Auto-Redirect

After login, students are **automatically routed** to their enrolled course:
- 8th std student → 8th standard materials
- M.Sc. Data Science → M.Sc. Data Science materials
- Currently supported: **M.Sc. Data Science** (Previous Year & Final Year)

### 4.4 Extra Course Certificate Program

For students enrolling in additional / external courses:
1. Complete the course content.
2. Complete assigned tasks **independently** (no external help).
3. Submit video proof with **audio on + screen share**.
4. Teachers / AI bot verify integrity — no cheating.
5. On passing: **Certificate** + **100% course fee refund**.

---

## 5. App Pages & Navigation

### 5.1 Home Page

- **Trending courses** — curated suggestions.
- **Competitive exam prep** — JEE, NEET, GATE, etc.
- On selecting a course → **Materials Section** with sub-sections:

| Sub-section | Content |
|---|---|
| All | Complete material list |
| Books | Textbooks & reference books |
| Hand-Written Notes | Scanned / digital handwritten notes |
| PYQs | Previous Year Questions |
| Important Questions | Curated high-priority questions |
| Practice Questions | AI / teacher-generated practice sets |

### 5.2 Search Page

- Discover **all available courses** on the platform.
- Filter by category, subject, level, etc.

### 5.3 Insight Page

| Metric | Description |
|---|---|
| Daily Log | Activity summary per day |
| Performance | Score trends and analytics |
| Streak | Consecutive study days |
| Attempted Tests | History of all tests taken |

### 5.4 Profile Page

- Profile photo, name, personal details.
- Edit profile settings.
- Theme options (light / dark / custom).

---

## 6. AI Study Bot

| Feature | Description |
|---|---|
| **Ask Anything** | Students can ask questions from the material. |
| **Simple Explanations** | Bot explains topics in very simple language with **real-world examples**. |
| **Generate Practice Qs** | Bot creates practice questions on demand. |
| **Answer Evaluation** | Students answer in-app or upload handwritten answers (hard copy photo). |
| **Auto-Grading** | Bot checks answers, gives marks, and provides correct answers for wrong responses. |
| **Memory Tricks** | Auto-generates tricks/mnemonics to remember difficult topics. |
| **Study Strategy** | Suggests preparation approach based on marks. |
| **Skill Levelling** | Assigns level: *Very Poor → Poor → Average → Good → Excellent*. Adjusts question difficulty accordingly. |
| **Integrity Check** | For certificate courses — verifies video submissions for cheating. |

---

## 7. Practical / Lab Component

| Student Level | Practical Scope |
|---|---|
| **Primary School** | Computer basics — Paint, using a computer, etc. (School/Admin decides) |
| **Secondary School** | Programming fundamentals — C/C++, Java, etc. (School decides) |
| **Higher Secondary** | Subject-specific practicals — Chemistry, Physics, Biology, Computer, etc. |
| **University / College** | Full practical suite — C/C++, MySQL, Python, Django, project practice, app/web ideas, etc. |

---

## 8. Technical Requirements

### 8.1 Offline & Online Support

- App works **both online and offline**.
- Materials downloaded for offline access.
- Sync when back online.

### 8.2 Security & Privacy

- **High security** across all data and auth flows.
- Unique credentials per user — no shared accounts.
- Session management: credentials cached locally only while logged in.
- **Privacy Policy** included in the app.
- Role-based access control for content visibility.

### 8.3 Ads Policy

- Ads kept to an **absolute minimum** to avoid disrupting the learning experience.

---

## 9. Database & Data Management

| Data Point | Details |
|---|---|
| User Profiles | Username, password (hashed), role, category, enrolled course |
| Session Data | Login state cached locally; cleared on logout |
| Materials | Files, links, metadata (course, subject, type, visibility) |
| Test Results | Scores, answers, timestamps |
| Performance Logs | Daily activity, streaks, levels |
| AI Interactions | Chat history with the study bot |

---

## 10. Future Roadmap

| Phase | Scope |
|---|---|
| **Phase 1 (Current)** | M.Sc. Data Science (GSFC University), 12 users, 1 admin |
| **Phase 2** | Multi-admin support, more university courses |
| **Phase 3** | School-level categories (Nursery → Higher Secondary) |
| **Phase 4** | Competitive exam courses (JEE, NEET, GATE) |
| **Phase 5** | Extra/external courses with certificate + refund program |
| **Phase 6** | Scale to multiple universities/schools |

---

## 11. Summary Diagram

```
┌─────────────────────────────────────────────────┐
│                   StudyHub App                  │
├────────────┬────────────────────────────────────┤
│   ADMIN    │              STUDENT               │
├────────────┼────────────────────────────────────┤
│ • Login    │ • Login (category-based)           │
│ • Create   │ • Auto-redirect to course          │
│   Classes  │ • Access Materials                 │
│ • Upload   │   (Books, Notes, PYQs, etc.)       │
│   Material │ • AI Bot (Q&A, Practice, Grading)  │
│ • Set      │ • Insight (Logs, Streaks, Levels)  │
│   Access   │ • Profile & Settings               │
│ • Conduct  │ • Offline Access                   │
│   Tests    │ • Certificate Program              │
│ • Manage   │   (Extra Courses)                  │
│   Users    │                                    │
└────────────┴────────────────────────────────────┘
```

---

> **Note:** This document captures the **complete vision** for StudyHub. Development will proceed in phases, starting with the M.Sc. Data Science course for GSFC University with 12 initial student users and 1 admin.
