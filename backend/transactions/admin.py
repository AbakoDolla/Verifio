from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPCode


class OTPCodeInline(admin.TabularInline):
    model      = OTPCode
    extra      = 0
    readonly_fields = ['code', 'is_used', 'expires_at', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['phone', 'name', 'role', 'kyc_status', 'is_active', 'created_at']
    list_filter   = ['role', 'kyc_status', 'is_active']
    search_fields = ['phone', 'name']
    ordering      = ['-created_at']
    readonly_fields = ['otp_verified_at', 'created_at', 'updated_at']
    inlines       = [OTPCodeInline]

    fieldsets = (
        ('Informations', {
            'fields': ('phone', 'name', 'role')
        }),
        ('Statut KYC', {
            'fields': ('kyc_status', 'otp_verified_at')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'name', 'role', 'password1', 'password2'),
        }),
    )

    # Remplacer username par phone
    filter_horizontal   = ('groups', 'user_permissions',)


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display  = ['user', 'code', 'is_used', 'expires_at', 'created_at']
    list_filter   = ['is_used']
    readonly_fields = ['code', 'created_at']
    search_fields = ['user__phone']
