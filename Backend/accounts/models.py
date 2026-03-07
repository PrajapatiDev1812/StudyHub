from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class User(AbstractUser):

    ROLE_CHOICES = (
        ('admin','Admin'),
        ('student','Student'),
    )

    role = models.CharField(max_length = 10, choices = ROLE_CHOICES)
    is_active_user = models.BooleanField(default = True)

    def __str__(self):
        return self.username