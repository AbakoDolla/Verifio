import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):

    def create_user(self, phone, name, password=None, **extra_fields):
        if not phone:
            raise ValueError("Le numéro de téléphone est obligatoire.")
        user = self.model(phone=phone, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, name, password=None, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        BUYER  = 'buyer',  'Acheteur'
        SELLER = 'seller', 'Vendeur'
        ADMIN  = 'admin',  'Administrateur'

    class KycStatus(models.TextChoices):
        PENDING  = 'pending',  'En attente'
        VERIFIED = 'verified', 'Vérifié'
        FAILED   = 'failed',   'Échoué'

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone           = models.CharField(max_length=20, unique=True)
    name            = models.CharField(max_length=100)
    role            = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    kyc_status      = models.CharField(max_length=10, choices=KycStatus.choices, default=KycStatus.PENDING)
    otp_verified_at = models.DateTimeField(blank=True, null=True)
    is_active       = models.BooleanField(default=True)
    is_staff        = models.BooleanField(default=False)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD  = 'phone'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.name} ({self.phone})"

    @property
    def is_vendor(self):
        return self.role == self.Role.SELLER and hasattr(self, 'vendor')

    @property
    def is_verified(self):
        return self.kyc_status == self.KycStatus.VERIFIED


class OTPCode(models.Model):
    """Code OTP temporaire envoyé par WhatsApp/SMS."""

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes')
    code       = models.CharField(max_length=6)
    is_used    = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otp_codes'
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP {self.code} — {self.user.phone}"

    @property
    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and self.expires_at > timezone.now()
