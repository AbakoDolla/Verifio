from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class Roles(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    VENDOR = 'vendor', 'Vendeur'
    BUYER = 'buyer', 'Acheteur'

class KYCStatus(models.TextChoices):
    PENDING = 'pending', 'En attente'
    APPROVED = 'approved', 'Approuvé'
    REJECTED = 'rejected', 'Rejeté'


class User(AbstractUser, BaseUserManager):
    
    phone = models.CharField(max_length=20, blank=False, null=False)
    name = models.CharField(max_length=100, blank=False, null=False)
    role = models.CharField(choices=Roles.choices, max_length=20)
    trust_score = models.FloatField(default=0.0)
    kyc_statut = models.CharField(choices=KYCStatus.choices, null = False, blank=False, default=KYCStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['name', 'role']

# Create your models here.
