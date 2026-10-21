from django.contrib import admin
from .models import Category, Job, JobApplication, Review, JobStage, GuaranteeClaim


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'customer', 'status', 'price', 'is_extended', 'created_at']
    list_filter = ['status', 'category', 'is_extended']
    search_fields = ['title', 'description']


@admin.register(JobStage)
class JobStageAdmin(admin.ModelAdmin):
    list_display = ['job', 'order', 'title', 'status', 'responsible']
    list_filter = ['status', 'responsible']


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['job', 'contractor', 'status', 'created_at']
    list_filter = ['status']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['job', 'reviewer', 'reviewee', 'rating', 'created_at']
    list_filter = ['rating']


@admin.register(GuaranteeClaim)
class GuaranteeClaimAdmin(admin.ModelAdmin):
    list_display = ['job', 'customer', 'status', 'created_at']
    list_filter = ['status']
