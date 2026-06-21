from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    UserUpdateSerializer,
    RequestOTPSerializer,
    VerifyOTPSerializer,
    RegisterSerializer,
)
from .services import create_otp_for_user, send_otp_whatsapp, verify_otp

User = get_user_model()


def get_tokens_for_user(user):
    """Génère les tokens JWT pour un utilisateur."""
    refresh = RefreshToken.for_user(user)
    return {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    }


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Crée un nouveau compte et envoie un OTP de vérification.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Envoyer l'OTP de vérification
        otp = create_otp_for_user(user)
        send_otp_whatsapp(user.phone, otp.code)

        return Response(
            {
                "detail": f"Compte créé. Un code de vérification a été envoyé au {user.phone}.",
                "phone": user.phone,
            },
            status=status.HTTP_201_CREATED
        )


class RequestOTPView(APIView):
    """
    POST /api/auth/request-otp/
    Demande un code OTP pour se connecter.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            # Ne pas révéler si le numéro existe ou non (sécurité)
            return Response({
                "detail": f"Si ce numéro est enregistré, un code sera envoyé."
            })

        if not user.is_active:
            return Response(
                {"detail": "Ce compte est désactivé."},
                status=status.HTTP_403_FORBIDDEN
            )

        otp = create_otp_for_user(user)
        send_otp_whatsapp(phone, otp.code)

        return Response({
            "detail": f"Code OTP envoyé au {phone}. Valable 10 minutes."
        })


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/
    Vérifie le code OTP et retourne les tokens JWT.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']
        code  = serializer.validated_data['code']

        success, result = verify_otp(phone, code)

        if not success:
            return Response(
                {"detail": result},
                status=status.HTTP_400_BAD_REQUEST
            )

        user   = result
        tokens = get_tokens_for_user(user)

        return Response({
            "access":  tokens['access'],
            "refresh": tokens['refresh'],
            "user":    UserSerializer(user).data,
        })


class RefreshTokenView(APIView):
    """
    POST /api/auth/refresh/
    Renouvelle le token d'accès avec le refresh token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {"detail": "Refresh token manquant."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                "access": str(refresh.access_token)
            })
        except Exception:
            return Response(
                {"detail": "Refresh token invalide ou expiré."},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Invalide le refresh token (blacklist).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {"detail": "Refresh token manquant."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Déconnexion réussie."})
        except Exception:
            return Response(
                {"detail": "Token invalide."},
                status=status.HTTP_400_BAD_REQUEST
            )


class MeView(APIView):
    """
    GET /api/auth/me/   → profil de l'utilisateur connecté
    PUT /api/auth/me/   → modifier le nom
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
