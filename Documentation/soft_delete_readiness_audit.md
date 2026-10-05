# Comprehensive Soft Delete Readiness & Data Retention Audit

**Project:** StudyHub (Django DRF / React Stack)  
**Audit Date:** July 6, 2026  
**Scope:** Complete Read-Only Codebase Audit (`Backend/`)  
**Status:** Completed

---

## Executive Summary

A comprehensive, read-only audit of all 24 Django models across the 11 Django applications in the StudyHub repository was conducted. Currently, **only 1 model (`StudentMaterial` in the `materials` app)** implements a soft-delete mechanism (`is_deleted`, `deleted_at`, `deleted_by`). All other 23 models rely on standard Django database hard deletions and default `on_delete=models.CASCADE` relationships.

Deleting core objects (such as `User`, `Course`, `Subject`, `Topic`, or `Test`) cascades through foreign key relationships and permanently destroys user progress, quiz attempts, AI logs, focus session records, and earned badges.

Below is the complete 17-part audit detailing all models, cascade deletion chains, permanent deletion triggers, business logic constraints, and architectural recommendations.

---

# Part 1 — Project Model Inventory

List of every Django model in the project, categorized by business importance.

| App | Model Name | Purpose | Importance |
| :--- | :--- | :--- | :--- |
| `accounts` | `User` | Custom User model (roles: `admin`, `student`) | **Critical** |
| `accounts` | `User2FA` | Stores TOTP secret, backup codes, brute-force lockout status | **Critical** |
| `accounts` | `OTPAttemptLog` | Audit log for 2FA verification attempts | **Disposable** |
| `accounts` | `AccountRecoveryLog` | Audit log for password/username recovery requests | **Disposable** |
| `accounts` | `ManualRecoveryRequest` | Form submissions for manual account recovery | **Important** |
| `accounts` | `PasswordHistory` | Stores past password hashes to enforce no-reuse rules | **Important** |
| `accounts` | `Theme` | Color & CSS variable configurations (built-in vs custom) | **Important** |
| `accounts` | `UserAppearance` | Selected theme mapping for user UI | **Disposable** |
| `accounts` | `UserPreference` | Student AI, Focus, and notification settings | **Important** |
| `accounts` | `NotificationPreference` | Email and push alert preferences | **Important** |
| `accounts` | `LoginActivity` | IP address and device login history | **Disposable** |
| `accounts` | `ActiveSession` | Active JWT session key and token tracker | **Disposable** |
| `courses` | `CourseCategory` | Predefined course groupings (AI, Web Dev, etc.) | **Important** |
| `courses` | `Course` | Master course entity created by admins | **Critical** |
| `courses` | `Subject` | Chapter/module division within a Course | **Critical** |
| `courses` | `Topic` | Specific topic within a Subject | **Critical** |
| `courses` | `Material` | Main study resource (Video, PDF, Notes, Link) | **Critical** |
| `courses` | `Content` | Legacy proxy model kept for backward compatibility | **Important** |
| `courses` | `Enrollment` | Links student to a Course | **Critical** |
| `courses` | `Progress` | Tracks completion of `Content` per student | **Critical** |
| `assessments` | `Test` | Quiz or assessment linked to a `Topic` | **Critical** |
| `assessments` | `Question` | Single question within a `Test` | **Important** |
| `assessments` | `Option` | Answer choices for a `Question` | **Important** |
| `assessments` | `StudentAttempt` | Student attempt record and calculated score | **Critical** |
| `assessments` | `StudentAnswer` | Student selected options for each question | **Critical** |
| `materials` | `StudentMaterial` | Personal student upload/note (has soft delete) | **Critical** |
| `materials` | `MaterialAccess` | Explicit access grants for shared student materials | **Important** |
| `materials` | `MaterialUserNote` | Private student notes on shared materials | **Important** |
| `materials` | `MaterialComment` | Discussion comments on shared materials | **Disposable** |
| `gamification` | `Badge` | System badges for tasks, focus time, tests, streaks | **Important** |
| `gamification` | `UserBadge` | Earned badge instances per student | **Critical** |
| `gamification` | `UserStats` | XP, level, total study minutes, task counts, streak | **Critical** |
| `notifications`| `Notification` | System notifications sent to users | **Disposable** |
| `focus` | `FocusSession` | Pomodoro/study session logs (time, status, mode) | **Critical** |
| `tasks` | `Task` | Student study TODO items | **Important** |
| `ai` | `AdminContentChunk` | Embeddings for admin study content (RAG) | **Disposable** |
| `ai` | `StudentNote` | Student personal notes for AI RAG | **Important** |
| `ai` | `StudentContentChunk` | Embeddings for student notes (RAG) | **Disposable** |
| `ai` | `ChatSession` | AI conversation thread | **Important** |
| `ai` | `ChatMessage` | Single chat prompt or AI response | **Important** |
| `ai` | `ChatAttachment` | File attachments uploaded to AI chat | **Important** |
| `ai` | `AIRequestLog` | Immutable audit log of AI queries and tokens | **Critical** |

---

# Part 2 — Permanent Deletion Mapping

Locations where records are permanently deleted via `.delete()` or database triggers:

| File | Line | Snippet | Data Deleted | Trigger | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `courses/views.py` | L137 | `enrollment.delete()` | Student `Enrollment` record | User Initiated | **HIGH** |
| `focus/views.py` | L84 | `session.delete()` | Single `FocusSession` record | User Initiated | **MEDIUM** |
| `focus/views.py` | L102 | `deleted_count, _ = qs.delete()` | All ended `FocusSession` records | User Initiated | **HIGH** |
| `materials/views.py` | L248 | `obj.delete()` | Trashed `StudentMaterial` + files | User Initiated | **CRITICAL** |
| `materials/views.py` | L281 | `count, _ = qs.delete()` | Bulk trashed `StudentMaterial` | User Initiated | **CRITICAL** |
| `materials/views.py` | L288 | `count, _ = qs.delete()` | All trashed `StudentMaterial` | User Initiated | **CRITICAL** |
| `materials/views.py` | L369 | `access.delete()` | `MaterialAccess` grant | User Initiated | **LOW** |
| `materials/views.py` | L488 | `comment.delete()` | `MaterialComment` record | User Initiated | **LOW** |
| `ai/views.py` | L398 | `session.delete()` | `ChatSession` + all messages | User Initiated | **HIGH** |
| `ai/embeddings.py` | L84 | `AdminContentChunk...delete()` | Chunks re-embedded | System Auto | **LOW** |
| `ai/embeddings.py` | L132 | `StudentContentChunk...delete()`| Chunks re-embedded | System Auto | **LOW** |
| `ai/commands/archive_ai_logs.py` | L76 | `deleted, _ = target_qs.delete()`| Archived `AIRequestLog` | Admin Auto | **HIGH** |
| `accounts/views.py` | L113 | `instance.delete()` | Custom `Theme` record | User Initiated | **LOW** |
| `accounts/services/recovery_service.py` | L76 | `PasswordHistory...delete()` | Old password hashes (> 5) | System Auto | **LOW** |
| Standard DRF ViewSets | DRF standard | `ModelViewSet.destroy()` | `Course`, `Subject`, `Topic`, `Test`, `Question`, `Option` | Admin Initiated | **CRITICAL** |

---

# Part 3 — Cascade Deletion Analysis

### 1. The Course Hierarchy Cascade (Danger Level: CRITICAL)
When an admin deletes a `Course`, standard Django `on_delete=models.CASCADE` triggers a destructive chain:

* **Course** -> CASCADE -> **Subject** -> CASCADE -> **Topic**
  * -> CASCADE -> **Material**
  * -> CASCADE -> **Content** -> CASCADE -> **Progress** (Student checkmarks destroyed)
  * -> CASCADE -> **Test** -> CASCADE -> **Question** -> CASCADE -> **Option**
    * -> CASCADE -> **StudentAttempt** -> CASCADE -> **StudentAnswer** (All student quiz history destroyed)
* **Course** -> CASCADE -> **Enrollment** (Student enrollments destroyed)
* **Course** -> CASCADE -> **AdminContentChunk** (AI vector embeddings destroyed)
* **Course** -> SET_NULL -> `FocusSession`, `Task`, `AIRequestLog`

### 2. User Account Deletion Cascade (Danger Level: CRITICAL)
Deleting a `User` (student or admin) triggers an extensive cascade across almost all apps:

* **Account Data:** `User2FA`, `PasswordHistory`, `UserAppearance`, `UserPreference`, `NotificationPreference`, `LoginActivity`, `ActiveSession` (All `CASCADE`).
* **Learning & Progress:** `Enrollment`, `Progress` (All `CASCADE`).
* **Assessments:** `StudentAttempt` (and all nested `StudentAnswer` records), `Test`s created by the user (if admin) (All `CASCADE`).
* **Gamification:** `UserBadge`, `UserStats` (All `CASCADE`).
* **Personal Content:** `StudentMaterial`, `MaterialAccess`, `MaterialUserNote`, `MaterialComment`, `StudentNote`, `StudentContentChunk`, `ChatSession`, `ChatMessage` (All `CASCADE`).
* **Tasks & Focus:** `Task`, `FocusSession`, `Notification` (All `CASCADE`).
* **Audit Logs (Preserved via SET_NULL):** `OTPAttemptLog`, `AccountRecoveryLog`, `ManualRecoveryRequest`, `AIRequestLog`, `StudentMaterial.deleted_by`.

---

# Part 4 — User Progress Preservation

### Loss Scenarios & Impact

1. **Course Unenrollment (`CourseViewSet.unenroll`):**
   * Calling `enrollment.delete()` hard-deletes the `Enrollment` record.
   * *Issue:* If the student re-enrolls later, historical enrollment timestamps and course metrics are lost.
2. **Admin Course / Subject / Topic Deletion:**
   * If an admin deletes a `Topic` or `Content`, Django cascades to `Progress` (deleting completed checkmarks) and `Test` / `StudentAttempt` (deleting exam scores and certificates/grades).
3. **User Account Deletion:**
   * Deleting a `User` record wipes `UserStats` (total focus hours, level, XP, streak days), `UserBadge`s (all earned badges), and `StudentAttempt`s (all exam attempts and history). Dashboard analytics will lose all historical context for that student.

---

# Part 5 — Business Logic Impact

If soft deletes are introduced across the application, the following business rules must be enforced:

1. **Course Access & Visibility:**
   * If a `Course` is soft-deleted (`is_deleted=True`), it must be hidden from course discovery/catalog (`/api/courses/`).
   * *Enrolled Students:* Existing enrolled students should either retain read-only access to complete their ongoing progress or be gracefully redirected, depending on business requirements.
2. **Historical Progress Integrity:**
   * Soft-deleted materials or topics must remain recorded in a student's `Progress` history so overall course completion percentages and historical completion dates are not corrupted.
3. **Quiz & Certificate Validity:**
   * A soft-deleted `Test` must preserve its `StudentAttempt` records so students' historical test scores, badges, and transcripts remain intact.
4. **Restoration Capabilities:**
   * Admins must be able to restore soft-deleted `Course`, `Subject`, `Topic`, or `Test` items. Restoring a parent must cascade restoration to children or keep children in trash until explicitly restored.

---

# Part 6 — API Deletion Audit

Summary of all endpoints capable of triggering deletions:

| Method | Endpoint URL | View Class | Permission | Target Object | Current Delete Type | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DELETE` | `/api/courses/{id}/` | `CourseViewSet` | `IsAdmin` | `Course` | Hard Delete (Cascade) | **CRITICAL** |
| `POST` | `/api/courses/{id}/unenroll/` | `CourseViewSet` | `IsStudent` | `Enrollment` | Hard Delete | **HIGH** |
| `DELETE` | `/api/subjects/{id}/` | `SubjectViewSet` | `IsAdmin` | `Subject` | Hard Delete (Cascade) | **CRITICAL** |
| `DELETE` | `/api/topics/{id}/` | `TopicViewSet` | `IsAdmin` | `Topic` | Hard Delete (Cascade) | **CRITICAL** |
| `DELETE` | `/api/materials/{id}/` | `MaterialViewSet` | `IsAdmin` | `Material` | Hard Delete | **HIGH** |
| `DELETE` | `/api/tests/{id}/` | `TestViewSet` | `IsAdmin` | `Test` | Hard Delete (Cascade) | **CRITICAL** |
| `DELETE` | `/api/questions/{id}/` | `QuestionViewSet` | `IsAdmin` | `Question` | Hard Delete (Cascade) | **MEDIUM** |
| `DELETE` | `/api/options/{id}/` | `OptionViewSet` | `IsAdmin` | `Option` | Hard Delete | **LOW** |
| `DELETE` | `/api/student-materials/{id}/` | `StudentMaterialViewSet` | Owner Only | `StudentMaterial` | **Soft Delete** | **LOW** |
| `POST/DEL`| `/api/student-materials/{id}/permanent-delete/` | `StudentMaterialViewSet` | Owner Only | `StudentMaterial` | Hard Delete | **HIGH** |
| `DEL` | `/api/student-materials/bulk-permanent-delete/` | `StudentMaterialViewSet` | Owner Only | `StudentMaterial` | Hard Delete | **HIGH** |
| `DEL` | `/api/student-materials/empty-trash/` | `StudentMaterialViewSet` | Owner Only | `StudentMaterial` | Hard Delete | **HIGH** |
| `DELETE` | `/api/focus/sessions/{id}/` | `FocusSessionViewSet` | `IsStudent` | `FocusSession` | Hard Delete | **MEDIUM** |
| `DELETE` | `/api/focus/sessions/clear_history/` | `FocusSessionViewSet` | `IsStudent` | `FocusSession` (ended) | Hard Delete | **HIGH** |
| `DELETE` | `/api/ai/sessions/{id}/` | `ChatSessionViewSet` | Owner Only | `ChatSession` | Hard Delete (Cascade) | **MEDIUM** |
| `DELETE` | `/api/ai/student-notes/{id}/` | `StudentNoteDetailView` | Owner Only | `StudentNote` | Hard Delete | **MEDIUM** |
| `DELETE` | `/api/auth/themes/{id}/` | `ThemeDetailView` | Owner Only | `Theme` | Hard Delete | **LOW** |

---

# Part 7 — Django Admin Audit

All registered models in `admin.py` files (`accounts`, `courses`, `assessments`, `materials`, `gamification`, `notifications`, `focus`, `tasks`, `ai`) currently use Django's default `ModelAdmin`, which includes the **"Delete selected items"** bulk action.

### Admin Recommendations per Model:

1. **Replace with Soft Delete in Admin:**
   * `Course`, `Subject`, `Topic`, `Material`, `Test`, `Question`, `User`, `StudentMaterial`.
2. **Disable Deletion Completely in Admin:**
   * `StudentAttempt`, `StudentAnswer`, `Progress`, `Enrollment`, `UserStats`, `UserBadge`, `AIRequestLog`, `OTPAttemptLog`, `AccountRecoveryLog`, `LoginActivity`.
3. **Keep Hard Delete Allowed in Admin:**
   * `Theme` (custom non-active ones), `AdminContentChunk`, `StudentContentChunk`, `ChatSession` (test sessions), `ActiveSession`.

---

# Part 8 — Unique Constraint Compatibility

The codebase contains several unique constraints that would conflict with soft deletes if `is_deleted=True` rows remain in the table:

1. **`CourseCategory`:** `name` and `slug` have `unique=True`.
2. **`Course`:** `slug` has `unique=True`.
3. **`Subject`:** `unique_together = [['course', 'slug']]`.
4. **`Topic`:** `unique_together = [['subject', 'slug']]`.
5. **`Material`:** `unique_together = [['topic', 'slug']]`.
6. **`Enrollment`:** `UniqueConstraint(fields=['student', 'course'], name='unique_enrollment_per_user_course')`.
7. **`Progress`:** `unique_together = ('student', 'content')`.
8. **`StudentAnswer`:** `unique_together = ('attempt', 'question')`.
9. **`MaterialAccess` / `MaterialUserNote`:** `unique_together = ('material', 'user')`.

### Problem Example:
If a student's `Enrollment` is soft-deleted, and they attempt to re-enroll in the same `Course`, `unique_enrollment_per_user_course` will throw an `IntegrityError` unless:
* A conditional unique constraint (PostgreSQL `condition=Q(is_deleted=False)`) is added, OR
* Re-enrollment restores the soft-deleted row instead of performing an `INSERT`.

---

# Part 9 — Query Compatibility Audit

Currently, managers use default `objects.all()`. Introducing a Soft Delete Manager (`objects.filter(is_deleted=False)`) requires reviewing key query locations:

1. **Student Dashboard & Analytics Services:**
   * `analytics/services.py` (`StudentAnalyticsService`): Queries `FocusSession`, `Task`, `Progress`, `AIRequestLog`. Needs to filter out soft-deleted courses/topics while retaining historical completed progress counts.
   * `dashboard/services.py` (`DashboardService`): Queries active enrollments and progress.
2. **RAG Retrieval Engine (`ai/retrieval.py` & `ai/embeddings.py`):**
   * Searches `AdminContentChunk` and `StudentContentChunk`. Must filter out chunks belonging to soft-deleted `Course`, `Topic`, or `StudentNote` records.
3. **Course Tree & Hierarchy Navigation (`courses/views.py`):**
   * `CourseViewSet.get_queryset()` and nested serializers must filter soft-deleted subjects/topics/materials.
4. **Admin Interface:**
   * Must use an `all_objects` manager to allow admins to view and restore soft-deleted records in the trash bin.

---

# Part 10 — User Account Deletion

### Assessment of Options for User Deletion:
* **Option A (Hard Delete):** **DO NOT USE.** Destroys all student analytics, audit logs, test attempts, and progress records across the entire platform.
* **Option B (Soft Delete):** Adds `is_deleted` to `User`. Keeps data intact, but leaves user credentials in active tables unless sanitized.
* **Option C (Disable Deletion & set `is_active=False` + Anonymization):** **RECOMMENDED.**

### Justification:
The StudyHub `User` model already contains an `is_active_user` boolean flag (`accounts/models.py`, L12). Setting `is_active=False` (or `is_active_user=False`) revokes login access immediately while preserving all historical enrollment stats, focus sessions, test attempt averages, and AI usage audit logs. For GDPR/privacy compliance, user PII (email, username, name) can be anonymized (`deleted_user_<id>@studyhub.local`) while keeping key ID references intact.

---

# Part 11 — Security Compatibility

Soft deletes introduce security risks if deleted resources are accidentally exposed through direct ID lookups (IDOR):

1. **Direct Object Lookups (`/api/courses/{id}/`, `/api/materials/{id}/`):**
   * If `get_object()` or `get_queryset()` does not filter `is_deleted=False`, unauthorized users or students might read soft-deleted draft/removed materials via explicit ID endpoints.
2. **Access Control Safeguards:**
   * DRF `get_queryset()` in all `ModelViewSet` classes must default to filtering out `is_deleted=False` for standard users.
   * Admin endpoints or explicit `/trash/` endpoints must verify `IsAdmin` or explicit object ownership before exposing soft-deleted objects.

---

# Part 12 — Performance Impact

Soft deletes increase table size over time as deleted rows remain in storage.

### Index Recommendations:
1. **Single Column Index:**
   * Add `db_index=True` to `is_deleted` on high-traffic models (`Course`, `Subject`, `Topic`, `Material`, `Test`, `FocusSession`).
2. **Composite Indexes:**
   * `StudentMaterial`: Already has `(student, is_deleted)` and `(student, is_deleted, deleted_at)`.
   * `Enrollment`: `(student, course, is_deleted)`.
   * `Progress`: `(student, content, is_deleted)`.
   * `FocusSession`: `(student, status, is_deleted)`.
   * `AIRequestLog`: Already indexed on `(is_archived, timestamp)`.

---

# Part 13 — Background Tasks & Scheduled Jobs

Inspection of background processes and management commands:

1. **`ai/management/commands/archive_ai_logs.py`:**
   * Uses `is_archived` boolean to soft-archive logs older than 90 days. Has a `--purge` flag for hard deletion. Needs to ensure soft-archived logs are handled consistently.
2. **`seed_ds_content.py` / `seed_badges.py` / `seed_themes.py`:**
   * Seed scripts currently re-initialize data. Seed scripts should check `is_deleted` flags to avoid recreating duplicate items.

---

# Part 14 — Media & File Storage Audit

Models storing uploaded files on disk (`MEDIA_ROOT = BASE_DIR / 'media'`):

* `Course`: `thumbnail` (`course_thumbnails/`)
* `Subject`: `thumbnail` (`subject_thumbnails/`)
* `Topic`: `thumbnail` (`topic_thumbnails/`)
* `Material`: `file` (`course_files/`), `thumbnail` (`material_thumbnails/`)
* `Content`: `file` (`course_files/`)
* `StudentMaterial`: `file` (`student_materials/`)
* `Badge`: `icon` (`badges/`)
* `ChatAttachment`: `file` (`chat_attachments/%Y/%m/`)
* `Theme`: `background_image` (`themes/backgrounds/`)

### File Deletion Policy Recommendation:
* **During Soft Delete:** Do **NOT** remove files from disk. Keep media accessible in case the object is restored.
* **During Permanent Delete / Trash Purge:** Trigger `file.delete(save=False)` upon explicit hard deletion to prevent orphaned files on disk.

---

# Part 15 — Restore Consistency

Restoring a parent object must restore cascade integrity:

```
Course Restored (is_deleted: True -> False)
 └── Subjects (Should remain soft-deleted UNLESS explicitly restored)
      └── Topics
           └── Materials
```

### Dependency Rules:
1. **Parent-Child Integrity:** A child object (e.g., `Topic`) cannot be active if its parent (`Subject` or `Course`) is soft-deleted.
2. **Restoration Strategy:** Restoring a `Course` makes the course visible, but leaves previously deleted child subjects in the trash until an admin chooses to "Restore All Children" or selectively restore subjects.

---

# Part 16 — Analytics & Reporting Integrity

How soft deletes should affect system metrics:

1. **Dashboard Active Counts:** Exclude soft-deleted courses/materials from active course catalogs and current enrollment counters.
2. **Historical Performance & Reports:** Include soft-deleted object data in historical totals (e.g., total study hours completed, past test average scores, total XP earned) so student progress reports remain accurate over time.

---

# Part 17 — Final Recommendations & Summary Matrix

### Summary Table

| Model | Business Critical | Soft Delete | Hard Delete | Reason | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `User` | Yes | **No** (Use `is_active`) | No | Preserves user logs, stats, and audit history | **MUST IMPLEMENT** |
| `Course` | Yes | **Yes** | No | Prevents accidental wipe of subjects, topics, and enrollments | **MUST IMPLEMENT** |
| `Subject` | Yes | **Yes** | No | Prevents cascade loss of topics and materials | **MUST IMPLEMENT** |
| `Topic` | Yes | **Yes** | No | Prevents cascade loss of tests and progress | **MUST IMPLEMENT** |
| `Material` | Yes | **Yes** | No | Preserves study content and view metrics | **MUST IMPLEMENT** |
| `Content` | Yes | **Yes** | No | Legacy proxy for `Material`, keeps `Progress` intact | **MUST IMPLEMENT** |
| `Enrollment` | Yes | **Yes** | No | Preserves enrollment history and date metrics | **SHOULD IMPLEMENT** |
| `Progress` | Yes | **Yes** | No | Prevents accidental loss of student completion records | **SHOULD IMPLEMENT** |
| `Test` | Yes | **Yes** | No | Protects student test history and attempt records | **MUST IMPLEMENT** |
| `Question` | Yes | **Yes** | No | Protects question metrics and answer options | **SHOULD IMPLEMENT** |
| `Option` | No | **Yes** | No | Preserves choices selected in student attempts | **OPTIONAL** |
| `StudentAttempt`| Yes | **No** | No | Immutable exam history; should never be deleted | **DO NOT IMPLEMENT** |
| `StudentAnswer` | Yes | **No** | No | Immutable answer audit; should never be deleted | **DO NOT IMPLEMENT** |
| `StudentMaterial`| Yes | **Already Implemented**| Trash Purge | Currently has working soft delete & trash system | **ALREADY DONE** |
| `FocusSession` | Yes | **Yes** | History Purge | Prevents loss of study analytics time | **SHOULD IMPLEMENT** |
| `Task` | No | **Yes** | Optional | Allows students to restore accidentally deleted tasks | **OPTIONAL** |
| `AIRequestLog` | Yes | **Already Implemented**| Purge > 180d | Managed via `archive_ai_logs` command | **ALREADY DONE** |

---

### Implementation Roadmap & Complexity

1. **Safest Implementation Order:**
   * **Phase 1:** Core Course Hierarchy (`Course`, `Subject`, `Topic`, `Material`, `Content`).
   * **Phase 2:** Assessments (`Test`, `Question`, `Option`).
   * **Phase 3:** User Activity & Enrollments (`Enrollment`, `Progress`, `FocusSession`, `Task`).
2. **Implementation Complexity:** **Medium** (Requires base `SoftDeleteModel` abstract class, custom `SoftDeleteManager`, updating unique constraints to `UniqueConstraint(..., condition=Q(is_deleted=False))`, and updating DRF view querysets).
3. **Potential Breaking Changes:** Unique constraint violations during re-creation if constraints are not updated to conditional indexes.
4. **Blockers to Resolve First:** Standardize the legacy `Content` vs upgraded `Material` model usage across `courses` and `focus` apps.
