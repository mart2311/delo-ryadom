from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ContractorProfile

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'first_name', 'last_name']
    list_filter = ['role']
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительно', {'fields': ('role', 'phone', 'avatar')}),
    )

@admin.register(ContractorProfile)
class ContractorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'rating', 'completed_jobs', 'hourly_rate']
