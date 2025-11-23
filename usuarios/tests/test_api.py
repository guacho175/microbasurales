"""Pruebas para los endpoints y serializadores de usuarios."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from usuarios.serializers import UsuarioRegistroSerializer


Usuario = get_user_model()


class UsuarioModelTests(APITestCase):
    def test_creacion_usuario_usa_rol_por_defecto(self):
        usuario = Usuario.objects.create_user(username="vecino", password="clave123")

        self.assertEqual(usuario.rol, Usuario.Roles.CIUDADANO)
        self.assertTrue(usuario.check_password("clave123"))

    def test_superusuario_es_administrador(self):
        admin = Usuario.objects.create_superuser(
            username="admin", password="adminpass", email="admin@example.com"
        )

        self.assertTrue(admin.es_administrador)
        self.assertTrue(admin.is_superuser)


class UsuarioRegistroSerializerTests(APITestCase):
    def test_creacion_hashea_password(self):
        data = {
            "username": "nuevo", "email": "nuevo@example.com", "password": "segura123"
        }

        serializer = UsuarioRegistroSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        usuario = serializer.save()

        self.assertNotEqual(usuario.password, data["password"])
        self.assertTrue(usuario.check_password(data["password"]))


class UsuarioAPITests(APITestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            username="ciudadano", email="ciudadano@example.com", password="clave123"
        )

    def obtener_token(self, usuario=None):
        usuario = usuario or self.usuario
        refresh = RefreshToken.for_user(usuario)
        return str(refresh.access_token)

    def test_registro_api_exitoso(self):
        url = reverse("registro")
        payload = {
            "username": "nuevo_usuario",
            "email": "nuevo@correo.com",
            "password": "contraseña_segura",
            "rol": Usuario.Roles.CIUDADANO,
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(username="nuevo_usuario").exists())

    def test_registro_api_requiere_password(self):
        url = reverse("registro")
        payload = {"username": "sin_clave", "email": "sin@clave.com"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_login_jwt_exitoso(self):
        url = reverse("login")
        payload = {"username": "ciudadano", "password": "clave123"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_jwt_falla_con_credenciales_invalidas(self):
        url = reverse("login")
        payload = {"username": "ciudadano", "password": "incorrecta"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_endpoint_me_rechaza_sin_token(self):
        url = reverse("me")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_endpoint_me_responde_con_token(self):
        url = reverse("me")
        token = self.obtener_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.usuario.username)

