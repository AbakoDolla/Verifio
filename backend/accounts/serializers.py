from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import OTPCode

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Profil complet de l'utilisateur connecté."""
    is_vendor   = serializers.BooleanField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model  = User
        fields = [
            'id',
            'phone',
            'name',
            'role',
            'kyc_status',
            'is_verified',
            'is_vendor',
            'otp_verified_at',
            'created_at',
        ]
        read_only_fields = [
            'id', 'phone', 'role', 'kyc_status',
            'is_verified', 'is_vendor', 'otp_verified_at', 'created_at'
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    """Mise à jour du nom uniquement."""

    class Meta:
        model  = User
        fields = ['name']


class RequestOTPSerializer(serializers.Serializer):
    """Demande d'envoi d'un code OTP."""
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        # Normaliser le numéro (retirer espaces)
        value = value.replace(' ', '').strip()
        if not value.startswith('+'):
            raise serializers.ValidationError(
                "Le numéro doit commencer par l'indicatif pays (ex: +226)."
            )
        return value


class VerifyOTPSerializer(serializers.Serializer):
    """Vérification du code OTP reçu."""
    phone = serializers.CharField(max_length=20)
    code  = serializers.CharField(max_length=6, min_length=6)

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Le code OTP doit contenir 6 chiffres.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    """Création d'un nouveau compte utilisateur."""

    class Meta:
        model  = User
        fields = ['phone', 'name', 'role']

    def validate_phone(self, value):
        value = value.replace(' ', '').strip()
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Ce numéro est déjà enregistré.")
        if not value.startswith('+'):
            raise serializers.ValidationError(
                "Le numéro doit commencer par l'indicatif pays (ex: +226)."
            )
        return value

    def validate_role(self, value):
        # Un utilisateur ne peut pas s'inscrire comme admin
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Rôle non autorisé.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            phone=validated_data['phone'],
            name=validated_data['name'],
            role=validated_data.get('role', User.Role.BUYER),
        )
        return user


class TokenSerializer(serializers.Serializer):
    """Tokens JWT retournés après authentification."""
    access  = serializers.CharField()
    refresh = serializers.CharField()
    user    = UserSerializer()
