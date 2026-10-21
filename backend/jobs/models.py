from django.db import models
from django.contrib.auth import get_user_model
from datetime import timedelta

User = get_user_model()


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Job(models.Model):
    STATUS_CHOICES = [
        ('open', 'Открыта'),
        ('in_progress', 'В работе'),
        ('completed', 'Завершена'),
        ('cancelled', 'Отменена'),
    ]

    PAYMENT_CHOICES = [
        ('cash', 'Наличными'),
        ('card', 'Переводом на карту'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_jobs')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    latitude = models.DecimalField(max_digits=20, decimal_places=15)
    longitude = models.DecimalField(max_digits=20, decimal_places=15)
    address = models.CharField(max_length=300)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    contractor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='cash')
    contractor_rating = models.IntegerField(null=True, blank=True)

    is_extended = models.BooleanField(default=False)
    guarantee_days = models.PositiveIntegerField(default=0)
    guarantee_description = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'jobs'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def guarantee_until(self):
        if not self.completed_at or not self.guarantee_days:
            return None
        return self.completed_at + timedelta(days=self.guarantee_days)


class JobStage(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Запланирован'),
        ('in_progress', 'Выполняется'),
        ('done', 'Завершён'),
    ]

    RESPONSIBLE_CHOICES = [
        ('contractor', 'Исполнитель'),
        ('customer', 'Заказчик'),
        ('both', 'Совместно'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='stages')
    order = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    planned_start = models.DateTimeField(null=True, blank=True)
    planned_end = models.DateTimeField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    resources = models.TextField(blank=True, help_text='Материалы и ресурсы, требуемые для этапа')
    responsible = models.CharField(max_length=20, choices=RESPONSIBLE_CHOICES, default='contractor')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'job_stages'
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.job.title} / {self.title}"


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('accepted', 'Принята'),
        ('rejected', 'Отклонена'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    contractor = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    proposed_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'job_applications'
        unique_together = ['job', 'contractor']

    def __str__(self):
        return f"{self.contractor.username} -> {self.job.title}"


class Review(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'

    def __str__(self):
        return f"Отзыв от {self.reviewer.username} для {self.reviewee.username}"


class GuaranteeClaim(models.Model):
    STATUS_CHOICES = [
        ('open', 'Открыто'),
        ('in_review', 'На рассмотрении'),
        ('resolved', 'Устранено'),
        ('declined', 'Отклонено'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='guarantee_claims')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='guarantee_claims_made')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'guarantee_claims'
        ordering = ['-created_at']

    def __str__(self):
        return f"Гарантия по «{self.job.title}» ({self.status})"
