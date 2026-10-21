from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Заказчик'),
        ('contractor', 'Исполнитель'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    telegram_username = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'users'


class ContractorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='contractor_profile')
    bio = models.TextField(blank=True)
    experience_years = models.IntegerField(default=0)
    skills = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    portfolio = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    completed_jobs = models.IntegerField(default=0)

    class Meta:
        db_table = 'contractor_profiles'

    def __str__(self):
        return f"Профиль {self.user.username}"
