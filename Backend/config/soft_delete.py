"""
config/soft_delete.py
─────────────────────────────────────────────────────────────────────────────
Production-Grade Soft Delete Architecture for StudyHub
─────────────────────────────────────────────────────────────────────────────

Provides:
    SoftDeleteQuerySet   — custom QuerySet with .delete(), .restore(), .hard_delete()
    SoftDeleteManager    — default manager (returns is_deleted=False only)
    AllObjectsManager    — returns ALL records (active + soft-deleted)
    SoftDeleteModel      — abstract base model to inherit across all apps

Usage:
    from config.soft_delete import SoftDeleteModel

    class Course(SoftDeleteModel):
        title = models.CharField(max_length=200)
        ...

    # Soft-delete a single instance
    course.delete()                    # Sets is_deleted=True, deleted_at=now()
    course.delete(user=request.user)   # Also records deleted_by

    # Restore a soft-deleted instance
    course.restore()

    # Permanently remove from DB (irreversible)
    course.hard_delete()

    # QuerySet operations
    Course.objects.all()               # Only active records
    Course.objects.with_deleted.all()  # Active + soft-deleted
    Course.objects.deleted_only()      # Only soft-deleted records
    Course.objects.filter(title='X').delete()   # Soft-delete queryset
    Course.objects.filter(title='X').restore()  # Restore queryset
"""

# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.conf import settings


User = settings.AUTH_USER_MODEL


# ── QuerySet ──────────────────────────────────────────────────────────────────

class SoftDeleteQuerySet(models.QuerySet):
    """
    Custom QuerySet that provides soft-delete, restore, and hard-delete
    operations on a queryset level.
    """

    def delete(self, soft=True, user=None):
        """
        Soft-delete all objects in the queryset by default.

        Args:
            soft (bool): If True (default), sets is_deleted=True. If False,
                         performs a real database delete (use with caution).
            user: Optional user performing the deletion (recorded in deleted_by).
        """
        if soft:
            now = timezone.now()
            update_kwargs = {'is_deleted': True, 'deleted_at': now}
            if user is not None:
                update_kwargs['deleted_by'] = user
            return self.update(**update_kwargs)
        else:
            return super().delete()

    def restore(self):
        """Restore all soft-deleted objects in the queryset."""
        return self.update(
            is_deleted=False,
            deleted_at=None,
            deleted_by=None,
        )

    def hard_delete(self):
        """Permanently delete all objects in the queryset from the database."""
        return super().delete()

    def alive(self):
        """Return only non-deleted records. Alias for filter(is_deleted=False)."""
        return self.filter(is_deleted=False)

    def dead(self):
        """Return only soft-deleted records. Alias for filter(is_deleted=True)."""
        return self.filter(is_deleted=True)


# ── Managers ──────────────────────────────────────────────────────────────────

class SoftDeleteManager(models.Manager):
    """
    Default manager for soft-delete models.
    Returns ONLY active (non-deleted) records.

    This ensures that all standard ORM queries (all(), filter(), get(), etc.)
    automatically exclude soft-deleted records without any extra effort.
    """

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def deleted_only(self):
        """Return only soft-deleted records."""
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=True)

    def with_deleted(self):
        """Return all records (active + soft-deleted)."""
        return SoftDeleteQuerySet(self.model, using=self._db)


class AllObjectsManager(models.Manager):
    """
    Manager that returns ALL records, regardless of soft-delete status.
    Use this for admin panels, analytics, and internal reporting tools.

    Access as: MyModel.all_objects.all()
    """

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


# ── Abstract Model ─────────────────────────────────────────────────────────────

class SoftDeleteModel(models.Model):
    """
    Abstract base model providing soft-delete functionality.

    Fields:
        is_deleted (bool):      Whether the record is soft-deleted. Indexed for
                                 performance on large tables.
        deleted_at (datetime):  UTC timestamp of when the record was soft-deleted.
        deleted_by (FK→User):   The user who performed the soft-delete (optional).

    Managers:
        objects       → SoftDeleteManager (active records only, default)
        all_objects   → AllObjectsManager (all records including deleted)

    Instance Methods:
        .delete(soft=True, user=None)   → Soft-delete this record.
        .restore()                       → Restore a soft-deleted record.
        .hard_delete()                   → Permanently delete from DB.

    Properties:
        .is_active    → bool (True if not soft-deleted)
    """

    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text='If True, this record has been soft-deleted and is hidden from normal queries.',
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='UTC datetime when this record was soft-deleted.',
    )
    deleted_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',   # No reverse accessor to avoid clashes across models
        help_text='The user who soft-deleted this record.',
    )

    # ── Managers ──────────────────────────────────────────────────────────────
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    # ── Instance Methods ──────────────────────────────────────────────────────

    def delete(self, using=None, keep_parents=False, soft=True, user=None):
        """
        Override Django's default .delete() to perform a soft delete by default.

        Args:
            soft (bool): If True (default), sets is_deleted=True. If False,
                         performs a hard database delete.
            user:        Optional user performing the deletion.
        """
        if soft:
            self.is_deleted = True
            self.deleted_at = timezone.now()
            if user is not None:
                self.deleted_by = user
            self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])
        else:
            super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        """
        Restore a soft-deleted record by resetting is_deleted, deleted_at,
        and deleted_by back to their default values.
        """
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    def hard_delete(self, using=None, keep_parents=False):
        """
        Permanently delete this record from the database.
        This action is IRREVERSIBLE. Use with caution.
        """
        super().delete(using=using, keep_parents=keep_parents)

    # ── Properties ────────────────────────────────────────────────────────────

    @property
    def is_active(self):
        """True if this record is NOT soft-deleted."""
        return not self.is_deleted
