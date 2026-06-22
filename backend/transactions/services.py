import random
import string
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from .models import OTPCode

User = get_user_model()


def generate_otp_code():
    """Génère un code OTP à 6 chiffres."""
    return ''.join(random.choices(string.digits, k=6))


def create_otp_for_user(user):
    """
    Crée un OTP valide 10 minutes pour l'utilisateur.
    Invalide les anciens OTP non utilisés.
    """
    # Invalider les anciens OTP
    OTPCode.objects.filter(user=user, is_used=False).update(is_used=True)

    otp = OTPCode.objects.create(
        user=user,
        code=generate_otp_code(),
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    return otp


def send_otp_whatsapp(phone, code):
    """
    Envoie le code OTP via Twilio WhatsApp.
    En développement, affiche juste le code dans la console.
    """
    import os

    if os.getenv('DJANGO_ENV') == 'production':
        from twilio.rest import Client
        client = Client(
            os.getenv('TWILIO_ACCOUNT_SID'),
            os.getenv('TWILIO_AUTH_TOKEN')
        )
        client.messages.create(
            from_=f"whatsapp:{os.getenv('TWILIO_WHATSAPP_NUMBER')}",
            to=f"whatsapp:{phone}",
            body=f"Votre code Verifio est : *{code}*\nValable 10 minutes. Ne le partagez jamais."
        )
    else:
        # Mode développement — afficher dans la console
        print(f"\n{'='*40}")
        print(f"  OTP pour {phone} : {code}")
        print(f"{'='*40}\n")


def verify_otp(phone, code):
    """
    Vérifie le code OTP.
    Retourne (True, user) si valide, (False, message_erreur) sinon.
    """
    try:
        user = User.objects.get(phone=phone)
    except User.DoesNotExist:
        return False, "Numéro introuvable."

    otp = OTPCode.objects.filter(
        user=user,
        code=code,
        is_used=False,
    ).order_by('-created_at').first()

    if not otp:
        return False, "Code OTP invalide."

    if not otp.is_valid:
        return False, "Code OTP expiré. Demandez un nouveau code."

    # Marquer l'OTP comme utilisé
    otp.is_used = True
    otp.save(update_fields=['is_used'])

    # Mettre à jour la date de vérification OTP
    user.otp_verified_at = timezone.now()
    user.kyc_status = User.KycStatus.VERIFIED
    user.save(update_fields=['otp_verified_at', 'kyc_status'])

    return True, user
