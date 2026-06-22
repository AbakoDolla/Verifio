from django.contrib import admin
from django.utils.html import format_html
from .models import Dispute, Evidence


class EvidenceInline(admin.TabularInline):
    model       = Evidence
    extra       = 0
    readonly_fields = ['uploaded_by', 'type', 'storage_url', 'hash_sha256', 'created_at']
    can_delete  = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display  = [
        'id_short', 'transaction_token', 'reason', 'status',
        'sla_display', 'decision', 'created_at'
    ]
    list_filter   = ['status', 'reason', 'decision']
    search_fields = ['transaction__token', 'opened_by__phone']
    readonly_fields = [
        'id', 'transaction', 'opened_by', 'created_at',
        'updated_at', 'sla_hours_remaining'
    ]
    ordering      = ['-created_at']
    inlines       = [EvidenceInline]

    fieldsets = (
        ('Transaction', {
            'fields': ('id', 'transaction', 'opened_by')
        }),
        ('Litige', {
            'fields': ('reason', 'status', 'description', 'sla_hours_remaining')
        }),
        ('Decision', {
            'fields': ('decision', 'decision_by', 'decision_at', 'notes')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def id_short(self, obj):
        return str(obj.id)[:8] + '...'
    id_short.short_description = 'ID'

    def transaction_token(self, obj):
        return obj.transaction.token[:12] + '...'
    transaction_token.short_description = 'Transaction'

    def sla_display(self, obj):
        hours = obj.sla_hours_remaining
        if hours == 0:
            return format_html('<span style="color:red">SLA dépassé</span>')
        elif hours < 4:
            return format_html(f'<span style="color:orange">{hours:.1f}h</span>')
        return format_html(f'<span style="color:green">{hours:.1f}h</span>')
    sla_display.short_description = 'SLA restant'


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display  = ['dispute', 'type', 'uploaded_by', 'created_at']
    list_filter   = ['type']
    readonly_fields = ['hash_sha256', 'created_at']
    search_fields = ['dispute__id', 'uploaded_by__phone']
