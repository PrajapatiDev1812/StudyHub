# Comprehensive Soft Delete Implementation Plan (v1)

> **Stack:** Django 6.0 / DRF / PostgreSQL / React (Vite) / Tailwind CSS  
> **Target Scope:** Production-Grade Soft Delete Architecture for StudyHub  
> **Status:** Ready for Review & User Approval (Standby Mode)

---

## SECTION 0 — Key Architectural Suggestions

> [!TIP]
> **1. Abstract `SoftDeleteModel` Base Class**  
> Define `SoftDeleteModel` in `config/soft_delete.py` with `is_deleted` (`db_index=True`), `deleted_at`, and `deleted_by`. This provides a unified API (`.delete(soft=True)`, `.restore()`, `.hard_delete()`) across all apps.

> [!IMPORTANT]
> **2. Conditional Unique Constraints (PostgreSQL)**  
> Existing rules like `Enrollment(student, course)` or `Subject(course, slug)` will throw `IntegrityError` if a item is soft-deleted and recreated. Migrate to PostgreSQL conditional constraints: `UniqueConstraint(fields=['student', 'course'], condition=Q(is_deleted=False))`.

> [!IMPORTANT]
> **3. User Account Termination Policy (`is_active_user`)**  
> Do NOT soft-delete `User` records. Instead, set `is_active_user=False` (already in `accounts/models.py`). This blocks login immediately while preserving historical student analytics, focus hours, and exam attempts.

> [!NOTE]
> **4. Legacy `Content` vs Upgraded `Material` Standardization**  
> Apply `SoftDeleteModel` to both `Material` and legacy `Content` to maintain progress tracking integrity without breaking legacy APIs.

> [!TIP]
> **5. AI Retrieval Filter (`ai/retrieval.py`)**  
> Update the Gemini RAG search engine to filter out embeddings linked to soft-deleted courses, topics, or notes so the AI chatbot never cites deleted materials.

---

## SECTION 1 — Component Breakdown & Proposed File Changes

### Component 1: Architectural Base Framework

#### [NEW] [soft_delete.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/config/soft_delete.py)
- Create `SoftDeleteQuerySet`, `SoftDeleteManager`, `AllObjectsManager`, and abstract base model `SoftDeleteModel`:
  - `objects`: Default manager returning active records (`is_deleted=False`).
  - `with_deleted`: Manager returning all records (active + trashed).
  - `.delete(soft=True, user=None)`: Sets `is_deleted=True`, `deleted_at=now()`, `deleted_by=user`.
  - `.restore()`: Resets soft-delete fields.
  - `.hard_delete()`: Performs underlying database deletion.

---

### Component 2: Courses & Curriculum (`courses` app)

#### [MODIFY] [models.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/courses/models.py)
- Update `Course`, `Subject`, `Topic`, `Material`, `Content`, `Enrollment`, and `Progress` to inherit from `SoftDeleteModel`.
- Replace legacy `unique_together` with conditional `UniqueConstraint(..., condition=Q(is_deleted=False))`.

#### [MODIFY] [views.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/courses/views.py)
- Update `get_queryset()` in `CourseViewSet`, `SubjectViewSet`, `TopicViewSet`, `MaterialViewSet`, `ContentViewSet` to filter out soft-deleted items by default.
- Add DRF actions: `trash`, `restore`, `permanent_delete`.
- Update `CourseViewSet.unenroll()` to soft-delete `Enrollment` instead of calling hard `enrollment.delete()`.

#### [MODIFY] [admin.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/courses/admin.py)
- Register custom admin actions: `"Soft Delete Selected Items"` and `"Restore Selected Items"`.
- Override `delete_model()` and `delete_queryset()`.

---

### Component 3: Assessments Engine (`assessments` app)

#### [MODIFY] [models.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/assessments/models.py)
- Update `Test`, `Question`, and `Option` to inherit from `SoftDeleteModel`.
- `StudentAttempt` and `StudentAnswer` remain immutable (no soft delete).

#### [MODIFY] [views.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/assessments/views.py)
- Filter `is_deleted=False` in `TestViewSet`, `QuestionViewSet`, `OptionViewSet`.

---

### Component 4: Focus & Tasks (`focus`, `tasks` apps)

#### [MODIFY] [models.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/focus/models.py)
- Inherit `FocusSession` from `SoftDeleteModel`.

#### [MODIFY] [models.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/tasks/models.py)
- Inherit `Task` from `SoftDeleteModel`.

---

### Component 5: AI Vector Search (`ai` app)

#### [MODIFY] [retrieval.py](file:///c:/GSFC%20lab%20assignment/StudyHub/Backend/ai/retrieval.py)
- Exclude vector chunks from soft-deleted courses, topics, or student notes in RAG queries.

---

## SECTION 2 — Verification & Automated Testing Plan

```text
Testing & Validation Workflow:
1. Automated ORM Tests:
   - Verify Course.delete() sets `is_deleted=True` and `deleted_at`.
   - Verify default `objects.all()` hides soft-deleted rows.
   - Verify `with_deleted.all()` includes soft-deleted rows.
   - Verify re-enrollment after soft deletion does not trigger constraint errors.
2. Manual Validation:
   - Admin Panel soft-delete & restore actions.
   - AI Chatbot RAG filtering verification.
   - Student Dashboard historical analytics retention verification.
```

---

## SECTION 3 — Current Status: Standby Mode

This Implementation Plan is complete and awaiting your review and explicit approval before any code modifications begin.
