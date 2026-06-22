from django.contrib import admin
from django.utils.html import format_html
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = [
        'recipient', 'channel_badge', 'notif_type',
        'status_badge', 'retry_count', 'sent_at', 'created_at'
    ]
    list_filter   = ['channel', 'notif_type', 'status']
    search_fields = ['recipient__phone', 'external_id']
    readonly_fields = [
        'id', 'external_id', 'sent_at',
        'delivered_at', 'retry_count', 'error_message', 'created_at'
    ]
    ordering = ['-created_at']

    fieldsets = (
        ('Destinataire', {
            'fields': ('recipient', 'transaction')
        }),
        ('Message', {
            'fields': ('channel', 'notif_type', 'message')
        }),
        ('Statut', {
            'fields': ('status', 'external_id', 'sent_at', 'delivered_at')
        }),
        ('Erreurs', {
            'fields': ('retry_count', 'error_message')
        }),
        ('Dates', {
            'fields': ('created_at',)
        }),
    )

    actions = ['retry_failed']

    @admin.action(description="Rejouer les notifications échouées")
    def retry_failed(self, request, queryset):
        from .services import _dispatch
        count = 0
        for notif in queryset.filter(status='failed', retry_count__lt=3):
            notif.retry_count += 1
            notif.save(update_fields=['retry_count'])
            if _dispatch(notif):
                count += 1
        self.message_user(request, f"{count} notification(s) renvoyée(s).")

    def channel_badge(self, obj):
        colors = {
            'whatsapp': '#25D366',
            'sms':      '#007AFF',
            'push':     '#FF9500',
            'email':    '#636366',
        }
        color = colors.get(obj.channel, '#999')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.channel.upper()
        )
    channel_badge.short_description = 'Canal'

    def status_badge(self, obj):
        colors = {
            'queued':    '#FF9500',
            'sent':      '#007AFF',
            'delivered': '#34C759',
            'failed':    '#FF3B30',
        }
        color = colors.get(obj.status, '#999')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = 'Statut'
