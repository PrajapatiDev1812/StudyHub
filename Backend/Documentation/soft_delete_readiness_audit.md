# Soft Delete Readiness & Data Retention Audit Report (v1)

> **Stack:** Django 6.0 / DRF / PostgreSQL / React (Vite) / Tailwind CSS  
> **Audit Type:** Comprehensive Soft Delete Readiness & Data Retention Audit  
> **Target Scope:** All 24 Models across 11 Apps in `StudyHub/Backend`  
> **Execution Mode:** Read-Only Audit (No Code Modified)

---

## SECTION 0 — Executive Summary

1. **Current Soft Delete State (Critical Finding)**: Out of 24 Django models in the StudyHub platform, **only 1 model (`StudentMaterial` in `materials`)** currently implements a soft-delete mechanism (`is_deleted`, `deleted_at`, `deleted_by`). The remaining 23 models rely on standard Django hard deletion.
2. **Cascade Data Destruction Risk (Critical Risk)**: Standard `on_delete=models.CASCADE` relationships cause catastrophic cascading data loss when parent objects (`Course`, `Subject`, `Topic`, `Test`, `User`) are deleted. Deleting a single `Course` wipes all `Subject`s, `Topic`s, `Material`s, `Content`s, `Test`s, `Question`s, `Option`s, student `StudentAttempt` exam histories, `StudentAnswer` logs, `Enrollment`s, `Progress` checkmarks, and AI RAG embeddings (`AdminContentChunk`).
3. **User Account Deletion Vulnerability (Critical Risk)**: Hard-deleting a `User` record cascades to delete all earned badges (`UserBadge`), student statistics (`UserStats`), focus sessions (`FocusSession`), exam attempts (`StudentAttempt`), progress records, and personal materials.
4. **Unique Constraint Conflicts (Integrity Risk)**: Models like `Enrollment`, `Subject`, `Topic`, `Material`, `Progress`, and `MaterialAccess` use `unique=True` or `unique_together`. Soft-deleting records without migrating to PostgreSQL conditional unique constraints (`condition=Q(is_deleted=False)`) will cause `IntegrityError`s when students re-enroll or re-create items with identical slugs.
5. **RAG Search Contamination (Security & AI Risk)**: AI vector search in `ai/retrieval.py` does not check parent soft-deletion flags, meaning soft-deleted study notes or materials could still be retrieved by Gemini AI.
6. **File Storage Orphan Risk**: 9 models contain `FileField` or `ImageField` attributes. A clear distinction between soft delete (retain physical file) and trash purge (trigger `file.delete(save=False)`) must be established.
7. **Audit Recommendation Summary**: 12 models require Soft Delete (`MUST/SHOULD IMPLEMENT`), 2 models require User Deactivation (`is_active_user=False`), 2 models already have deletion management (`StudentMaterial`, `AIRequestLog`), and 8 models must be kept immutable or hard-deleted.

---

## SECTION 1 — Project Overview & Soft Delete Objectives

- **System Context**: StudyHub is an educational platform operating on a decoupled architecture (Django REST Framework backend + React SPA frontend). 
- **Core Domain Hierarchy**:  
  `Course Category` ➔ `Course` ➔ `Subject` ➔ `Topic` ➔ `Material` / `Content` ➔ `Test` / `Progress`
- **Soft Delete Audit Objective**: Analyze the codebase to determine how soft delete should be safely integrated across all models without breaking existing analytics, quiz attempts, enrollment records, security controls, or background workers.

---

## SECTION 2 — Project Model Inventory

Inventory of all 24 Django models across all 11 apps:

| App | Model Name | Primary Purpose | Business Importance | Classification |
| :--- | :--- | :--- | :--- | :--- |
| `accounts` | `User` | Custom user model (roles: `admin`, `student`) | Core user identity anchor | **Critical** |
| `accounts` | `User2FA` | TOTP secret, backup codes, lockout tracking | Security & 2FA configuration | **Critical** |
| `accounts` | `OTPAttemptLog` | Audit log for 2FA OTP attempts | Temporary security audit | **Disposable** |
| `accounts` | `AccountRecoveryLog` | Audit log for password/username recovery | Security audit trail | **Disposable** |
| `accounts` | `ManualRecoveryRequest` | Form for manual admin recovery requests | Recovery workflow ticket | **Important** |
| `accounts` | `PasswordHistory` | Stores past password hashes (prevents reuse) | Password policy enforcement | **Important** |
| `accounts` | `Theme` | CSS variable themes (built-in vs custom) | UI appearance configuration | **Important** |
| `accounts` | `UserAppearance` | Selected theme mapping per user | User preference state | **Disposable** |
| `accounts` | `UserPreference` | Student AI, Focus, & notification settings | App behavior settings | **Important** |
| `accounts` | `NotificationPreference` | Email & push alert toggles | Notification configuration | **Important** |
| `accounts` | `LoginActivity` | IP address and device login history | Security audit history | **Disposable** |
| `accounts` | `ActiveSession` | Active JWT session key / jti tracker | Active session state | **Disposable** |
| `courses` | `CourseCategory` | Predefined course categories | Curriculum grouping | **Important** |
| `courses` | `Course` | Master course entity created by admins | Primary curriculum container | **Critical** |
| `courses` | `Subject` | Chapter/module within a Course | Sub-curriculum container | **Critical** |
| `courses` | `Topic` | Specific topic within a Subject | Unit-level curriculum | **Critical** |
| `courses` | `Material` | Main study content (Video, PDF, Notes, Link) | Primary study resource | **Critical** |
| `courses` | `Content` | Legacy proxy model kept for backward compat | Legacy progress tracker | **Important** |
| `courses` | `Enrollment` | Links student to a Course | Registration record | **Critical** |
| `courses` | `Progress` | Tracks completion of `Content` per student | Student progress history | **Critical** |
| `assessments` | `Test` | Quiz or assessment linked to a `Topic` | Student evaluation test | **Critical** |
| `assessments` | `Question` | Single question within a `Test` | Quiz item | **Important** |
| `assessments` | `Option` | Answer choices for a `Question` | Quiz answer choice | **Important** |
| `assessments` | `StudentAttempt` | Student test attempt score & pass status | Official student transcript | **Critical** |
| `assessments` | `StudentAnswer` | Student choice for each question in an attempt | Detailed exam response audit | **Critical** |
| `materials` | `StudentMaterial` | Personal student upload/note | Personal material file | **Critical** |
| `materials` | `MaterialAccess` | Explicit access grants for shared materials | Sharing permissions | **Important** |
| `materials` | `MaterialUserNote` | Private student notes on shared materials | Student study notes | **Important** |
| `materials` | `MaterialComment` | Discussion comments on shared materials | Peer comments | **Disposable** |
| `gamification` | `Badge` | System badge definitions | Achievement rules | **Important** |
| `gamification` | `UserBadge` | Earned badge instances per student | Student reward record | **Critical** |
| `gamification` | `UserStats` | XP, level, total study minutes, streak | Student rank & gamification | **Critical** |
| `notifications`| `Notification` | System notifications sent to users | User notifications | **Disposable** |
| `focus` | `FocusSession` | Pomodoro/study session timer logs | Study analytics log | **Critical** |
| `tasks` | `Task` | Student study TODO items | Task management | **Important** |
| `ai` | `AdminContentChunk` | Embeddings for admin study content (RAG) | AI vector index | **Disposable** |
| `ai` | `StudentNote` | Student personal notes for AI RAG | Personal AI knowledge note | **Important** |
| `ai` | `StudentContentChunk` | Embeddings for student notes (RAG) | Personal AI vector index | **Disposable** |
| `ai` | `ChatSession` | AI conversation thread | Chat session thread | **Important** |
| `ai` | `ChatMessage` | Single chat prompt or AI response | Conversation message | **Important** |
| `ai` | `ChatAttachment` | File attachments uploaded to AI chat | Chat attachment media | **Important** |
| `ai` | `AIRequestLog` | Immutable audit log of AI queries & tokens | AI usage audit & analytics | **Critical** |

---

## SECTION 3 — Permanent Deletion Location Mapping

Audit of all code locations executing database `.delete()` or permanent removals:

| File Location | Line | Exact Code Snippet | Target Data Deleted | Trigger | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `courses/views.py` | L137 | `enrollment.delete()` | Student `Enrollment` record | User Action | **HIGH** |
| `focus/views.py` | L84 | `session.delete()` | Single `FocusSession` record | User Action | **MEDIUM** |
| `focus/views.py` | L102 | `deleted_count, _ = qs.delete()` | Ended `FocusSession` records | User Action | **HIGH** |
| `materials/views.py` | L248 | `obj.delete()` | Trashed `StudentMaterial` + file | User Action | **CRITICAL** |
| `materials/views.py` | L281 | `count, _ = qs.delete()` | Bulk trashed `StudentMaterial` | User Action | **CRITICAL** |
| `materials/views.py` | L288 | `count, _ = qs.delete()` | All trashed `StudentMaterial` items | User Action | **CRITICAL** |
| `materials/views.py` | L369 | `access.delete()` | `MaterialAccess` grant record | User Action | **LOW** |
| `materials/views.py` | L488 | `comment.delete()` | `MaterialComment` record | User Action | **LOW** |
| `ai/views.py` | L398 | `session.delete()` | `ChatSession` + all messages | User Action | **HIGH** |
| `ai/embeddings.py` | L84 | `AdminContentChunk...delete()` | Old chunks before re-embedding | System Auto | **LOW** |
| `ai/embeddings.py` | L132 | `StudentContentChunk...delete()`| Old chunks before re-embedding | System Auto | **LOW** |
| `ai/commands/archive_ai_logs.py` | L76 | `deleted, _ = target_qs.delete()`| Archived `AIRequestLog` entries | Admin Auto | **HIGH** |
| `accounts/views.py` | L113 | `instance.delete()` | Custom `Theme` record | User Action | **LOW** |
| `accounts/services/recovery_service.py` | L76 | `PasswordHistory...delete()` | Old password hashes (> 5 limit) | System Auto | **LOW** |
| Standard DRF ViewSets | DRF standard | `viewsets.ModelViewSet.destroy()` | `Course`, `Subject`, `Topic`, `Test`, `Question`, `Option` | Admin Action | **CRITICAL** |

---

## SECTION 4 — Cascade Deletion & Graph Analysis

### 4a. Course Curriculum Hierarchy Cascade Diagram

```text
[Course] (Admin Deletes Course)
   |
   +-- CASCADE --> [Subject]
   |                  |
   |                  +-- CASCADE --> [Topic]
   |                                     |
   |                                     +-- CASCADE --> [Material]
   |                                     +-- CASCADE --> [Content]
   |                                     |                  |
   |                                     |                  +-- CASCADE --> [Progress]  <-- (CRITICAL LOSS: Student completion checkmarks)
   |                                     |
   |                                     +-- CASCADE --> [Test]
   |                                                        |
   |                                                        +-- CASCADE --> [Question]
   |                                                        |                  |
   |                                                        |                  +-- CASCADE --> [Option]
   |                                                        |                  +-- CASCADE --> [StudentAnswer]
   |                                                        |
   |                                                        +-- CASCADE --> [StudentAttempt] <-- (CRITICAL LOSS: Student exam transcripts & scores)
   |
   +-- CASCADE --> [Enrollment]  <-- (CRITICAL LOSS: Student course registrations)
   +-- CASCADE --> [AdminContentChunk]  <-- (AI RAG Embeddings wiped)
   +-- SET_NULL -> [FocusSession]
   +-- SET_NULL -> [Task]
   +-- SET_NULL -> [AIRequestLog]
```

### 4b. User Account Deletion Cascade Diagram

```text
[User] (Admin Deletes User)
   |
   +-- CASCADE --> [User2FA], [PasswordHistory], [UserAppearance], [UserPreference], [NotificationPreference], [LoginActivity], [ActiveSession]
   +-- CASCADE --> [Enrollment], [Progress]
   +-- CASCADE --> [StudentAttempt] --> [StudentAnswer]
   +-- CASCADE --> [UserBadge], [UserStats]  <-- (CRITICAL LOSS: XP, level, streak, earned rewards)
   +-- CASCADE --> [StudentMaterial], [MaterialAccess], [MaterialUserNote], [MaterialComment]
   +-- CASCADE --> [StudentNote], [StudentContentChunk], [ChatSession], [ChatMessage]
   +-- CASCADE --> [Task], [FocusSession], [Notification]
   +-- SET_NULL -> [OTPAttemptLog], [AccountRecoveryLog], [ManualRecoveryRequest], [AIRequestLog]
```

---

## SECTION 5 — User Progress & Historical Data Preservation Analysis

1. **Course Unenrollment Scenario**:
   - Calling `enrollment.delete()` hard-deletes the `Enrollment` record.
   - *Data Loss*: If the student re-enrolls later, historical enrollment timestamps and enrollment analytics are lost.
2. **Admin Course / Subject / Topic Deletion**:
   - If an admin deletes a `Topic` or `Content`, Django cascades to `Progress` (deleting completed checkmarks) and `Test` / `StudentAttempt` (deleting exam scores, passing status, and transcripts).
3. **User Account Deletion**:
   - Deleting a `User` record wipes `UserStats` (total focus hours, level, XP, streak days), `UserBadge`s (all earned badges), and `StudentAttempt`s (all exam attempts and history).

---

## SECTION 6 — Business Logic Impact & State Transition Rules

1. **Course Discovery & Catalog Visibility**:
   - Soft-deleted courses (`is_deleted=True`) must be filtered out of `/api/courses/`. Enrolled students retain access or see a clear "Archived Course" message depending on university requirements.
2. **Progress Report Integrity**:
   - Soft-deleted materials or topics must remain recorded in a student's `Progress` history so overall course completion percentages and historical completion dates are not corrupted.
3. **Quiz & Certificate Validity**:
   - A soft-deleted `Test` must preserve its `StudentAttempt` records so students' historical test scores, badges, and transcripts remain valid.
4. **Restoration Capabilities**:
   - Admins can restore soft-deleted `Course`, `Subject`, `Topic`, or `Test` items from an admin trash bin. Restoring a parent allows optional cascading restoration of child objects.

---

## SECTION 7 — Complete API Deletion Endpoint Audit

| Method | Endpoint URL | View Class | Permission Class | Target Object | Current Delete Type | Risk Assessment |
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

## SECTION 8 — Django Admin Deletion Controls & Audit

All registered models in `admin.py` files (`accounts`, `courses`, `assessments`, `materials`, `gamification`, `notifications`, `focus`, `tasks`, `ai`) currently use Django's default `ModelAdmin`, which includes the **"Delete selected items"** bulk action.

### Admin Action Recommendations:

1. **Replace with Soft Delete Action in Admin**: `Course`, `Subject`, `Topic`, `Material`, `Test`, `Question`, `User`, `StudentMaterial`.
2. **Disable Deletion Completely in Admin**: `StudentAttempt`, `StudentAnswer`, `Progress`, `Enrollment`, `UserStats`, `UserBadge`, `AIRequestLog`, `OTPAttemptLog`, `AccountRecoveryLog`, `LoginActivity`.
3. **Keep Hard Delete Allowed in Admin**: `Theme` (custom non-active ones), `AdminContentChunk`, `StudentContentChunk`, `ChatSession` (test sessions), `ActiveSession`.

---

## SECTION 9 — Unique Constraints & DB Integrity Compatibility Analysis

Unique constraints in the existing models:

1. **`CourseCategory`**: `name` and `slug` (`unique=True`).
2. **`Course`**: `slug` (`unique=True`).
3. **`Subject`**: `unique_together = [['course', 'slug']]`.
4. **`Topic`**: `unique_together = [['subject', 'slug']]`.
5. **`Material`**: `unique_together = [['topic', 'slug']]`.
6. **`Enrollment`**: `UniqueConstraint(fields=['student', 'course'], name='unique_enrollment_per_user_course')`.
7. **`Progress`**: `unique_together = ('student', 'content')`.
8. **`StudentAnswer`**: `unique_together = ('attempt', 'question')`.
9. **`MaterialAccess` / `MaterialUserNote`**: `unique_together = ('material', 'user')`.

### Problem & Migration Strategy:
If a student's `Enrollment` is soft-deleted, and they attempt to re-enroll in the same `Course`, `unique_enrollment_per_user_course` will throw an `IntegrityError`.
- **Solution**: Replace standard unique constraints with PostgreSQL conditional constraints: `UniqueConstraint(fields=['student', 'course'], condition=Q(is_deleted=False))`.

---

## SECTION 10 — Query Compatibility & Manager Audit

Currently, managers across all apps use default `objects.all()`. Introducing a Soft Delete Manager (`objects.filter(is_deleted=False)`) requires updating key query locations:

1. **Student Dashboard & Analytics Services** (`analytics/services.py`, `dashboard/services.py`): Must filter out soft-deleted items while retaining historical completed progress counts.
2. **RAG Retrieval Engine** (`ai/retrieval.py` & `ai/embeddings.py`): Must filter out chunks belonging to soft-deleted `Course`, `Topic`, or `StudentNote` records.
3. **Course Hierarchy Navigation** (`courses/views.py`): `CourseViewSet.get_queryset()` must filter soft-deleted items by default.
4. **Admin Interface**: Must use an `all_objects` manager to allow admins to view and restore soft-deleted records in the trash bin.

---

## SECTION 11 — User Account Deletion Strategy & GDPR/Audit Compliance

- **Option A (Hard Delete)**: **DO NOT USE.** Destroys all student analytics, audit logs, test attempts, and progress records across the entire platform.
- **Option B (Soft Delete)**: Adds `is_deleted` to `User`. Keeps data intact, but leaves user credentials in active tables unless sanitized.
- **Option C (Disable Deletion & set `is_active_user=False` + Anonymization)**: **RECOMMENDED.**

Setting `is_active_user=False` revokes login access immediately while preserving all historical enrollment stats, focus sessions, test attempt averages, and AI usage audit logs. For GDPR/privacy compliance, user PII (email, username, name) can be anonymized (`deleted_user_<id>@studyhub.local`) while keeping key ID references intact.

---

## SECTION 12 — Security & IDOR Compatibility Audit

Soft deletes introduce security risks if deleted resources are accidentally exposed through direct ID lookups (IDOR):

1. **Direct Object Lookups (`/api/courses/{id}/`, `/api/materials/{id}/`)**:
   - If `get_object()` or `get_queryset()` does not filter `is_deleted=False`, unauthorized users or students might read soft-deleted draft/removed materials via explicit ID endpoints.
2. **Access Control Safeguards**:
   - DRF `get_queryset()` in all `ModelViewSet` classes must default to filtering out `is_deleted=False` for standard users.
   - Admin endpoints or explicit `/trash/` endpoints must verify `IsAdmin` or explicit object ownership before exposing soft-deleted objects.

---

## SECTION 13 — Performance & Database Indexing Strategy

Soft deletes increase table size over time as deleted rows remain in storage.

### Index Recommendations:
1. **Single Column Index**: Add `db_index=True` to `is_deleted` on high-traffic models (`Course`, `Subject`, `Topic`, `Material`, `Test`, `FocusSession`).
2. **Composite Indexes**:
   - `StudentMaterial`: `(student, is_deleted)` and `(student, is_deleted, deleted_at)`.
   - `Enrollment`: `(student, course, is_deleted)`.
   - `Progress`: `(student, content, is_deleted)`.
   - `FocusSession`: `(student, status, is_deleted)`.
   - `AIRequestLog`: `(is_archived, timestamp)`.

---

## SECTION 14 — Background Workers, Scheduled Jobs & Seeds Audit

1. **`ai/management/commands/archive_ai_logs.py`**: Uses `is_archived` boolean to soft-archive logs older than 90 days. Has a `--purge` flag for hard deletion.
2. **Seed Scripts (`seed_ds_content.py`, `seed_badges.py`, `seed_themes.py`)**: Seed scripts should check `is_deleted` flags to avoid recreating duplicate items.

---

## SECTION 15 — Media Storage & File Storage Audit

Models storing uploaded files on disk (`MEDIA_ROOT = BASE_DIR / 'media'`):
`Course`, `Subject`, `Topic`, `Material`, `Content`, `StudentMaterial`, `Badge`, `ChatAttachment`, `Theme`.

- **During Soft Delete**: Do **NOT** remove files from disk. Keep media accessible in case the object is restored.
- **During Permanent Delete / Trash Purge**: Trigger `file.delete(save=False)` upon explicit hard deletion to prevent orphaned files on disk.

---

## SECTION 16 — Parental Restoration & Consistency Rules

Restoring a parent object must restore cascade integrity:

```text
Course Restored (is_deleted: True -> False)
 └── Subjects (Should remain soft-deleted UNLESS explicitly restored)
      └── Topics
           └── Materials
```

- **Parent-Child Integrity**: A child object (e.g., `Topic`) cannot be active if its parent (`Subject` or `Course`) is soft-deleted.
- **Restoration Strategy**: Restoring a `Course` makes the course visible, but leaves previously deleted child subjects in the trash until an admin chooses to "Restore All Children" or selectively restore subjects.

---

## SECTION 17 — Analytics & Reporting Integrity Rules

1. **Dashboard Active Counts**: Exclude soft-deleted courses/materials from active course catalogs and current enrollment counters.
2. **Historical Performance & Reports**: Include soft-deleted object data in historical totals (e.g., total study hours completed, past test average scores, total XP earned) so student progress reports remain accurate over time.

---

## SECTION 18 — Summary Scorecard & Final Recommendation Matrix

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

## SECTION 19 — Phased Implementation Roadmap & Complexity Assessment

1. **Safest Implementation Order**:
   - **Phase 1**: Core Course Hierarchy (`Course`, `Subject`, `Topic`, `Material`, `Content`).
   - **Phase 2**: Assessments (`Test`, `Question`, `Option`).
   - **Phase 3**: User Activity & Enrollments (`Enrollment`, `Progress`, `FocusSession`, `Task`).
2. **Implementation Complexity**: **Medium** (Requires base `SoftDeleteModel` abstract class, custom `SoftDeleteManager`, updating unique constraints to `UniqueConstraint(..., condition=Q(is_deleted=False))`, and updating DRF view querysets).
3. **Potential Breaking Changes**: Unique constraint violations during re-creation if constraints are not updated to conditional indexes.
4. **Blockers to Resolve First**: Standardize the legacy `Content` vs upgraded `Material` model usage across `courses` and `focus` apps.

---

## SECTION 20 — Developer Action Items & Hand-Off Checklist

```text
Developer Action Checklist (to execute upon user approval):
[ ] Create `config/soft_delete.py` with `SoftDeleteQuerySet`, `SoftDeleteManager`, and `SoftDeleteModel`.
[ ] Update `courses/models.py` to inherit `Course`, `Subject`, `Topic`, `Material`, `Content`, `Enrollment`, `Progress` from `SoftDeleteModel`.
[ ] Update unique constraints in `courses/models.py` to PostgreSQL conditional unique constraints (`condition=Q(is_deleted=False)`).
[ ] Update DRF ViewSets in `courses/views.py`, `assessments/views.py`, `focus/views.py` to default `get_queryset()` to `is_deleted=False`.
[ ] Update `ai/retrieval.py` to filter out soft-deleted materials in Gemini vector searches.
[ ] Add automated unit tests in `courses/tests_soft_delete.py`.
```
