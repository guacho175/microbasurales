"""Cobertura de endpoints REST para denuncias."""

import io
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from denuncias.models import Denuncia, EstadoDenuncia


Usuario = get_user_model()


def crear_imagen_prueba(nombre="foto.jpg"):
    buffer = io.BytesIO()
    imagen = Image.new("RGB", (10, 10), color=(255, 0, 0))
    imagen.save(buffer, format="JPEG")
    buffer.seek(0)
    return SimpleUploadedFile(nombre, buffer.read(), content_type="image/jpeg")


class DenunciasAPITests(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._temp_media = tempfile.mkdtemp()
        cls._media_override = override_settings(MEDIA_ROOT=cls._temp_media)
        cls._media_override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._media_override.disable()
        shutil.rmtree(cls._temp_media, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.ciudadano = Usuario.objects.create_user(
            username="vecino", password="clave123", rol=Usuario.Roles.CIUDADANO
        )
        self.otro_usuario = Usuario.objects.create_user(
            username="otro", password="clave123", rol=Usuario.Roles.CIUDADANO
        )
        self.fiscalizador = Usuario.objects.create_user(
            username="fiscalizador",
            password="clave123",
            rol=Usuario.Roles.FISCALIZADOR,
        )
        self.jefe_cuadrilla = Usuario.objects.create_user(
            username="jefe",
            password="clave123",
            rol=Usuario.Roles.JEFE_CUADRILLA,
        )
        self.admin = Usuario.objects.create_user(
            username="admin",
            password="clave123",
            rol=Usuario.Roles.ADMINISTRADOR,
        )

    def obtener_token(self, usuario):
        return str(RefreshToken.for_user(usuario).access_token)

    def autenticar(self, usuario):
        token = self.obtener_token(usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def crear_denuncia(self, usuario=None, **kwargs):
        usuario = usuario or self.ciudadano
        defaults = {
            "usuario": usuario,
            "descripcion": "Basural en la calle",
            "direccion_textual": "Calle falsa 123",
            "latitud": -33.45,
            "longitud": -70.66,
        }
        defaults.update(kwargs)
        return Denuncia.objects.create(**defaults)

    def test_listado_requiere_autenticacion(self):
        url = reverse("denuncias_list_create")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creacion_denuncia_exitosa(self):
        url = reverse("denuncias_list_create")
        self.autenticar(self.ciudadano)
        payload = {
            "descripcion": "Basural detectado",
            "direccion_textual": "Av. Principal 123",
            "latitud": -33.45,
            "longitud": -70.66,
            "imagen": crear_imagen_prueba(),
        }

        response = self.client.post(url, payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Denuncia.objects.filter(usuario=self.ciudadano).exists())

    def test_creacion_denuncia_sin_imagen_retorna_errores(self):
        url = reverse("denuncias_list_create")
        self.autenticar(self.ciudadano)
        payload = {
            "descripcion": "Basural detectado",
            "direccion_textual": "Av. Principal 123",
            "latitud": -33.45,
            "longitud": -70.66,
        }

        response = self.client.post(url, payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("imagen", response.data)

    def test_mis_denuncias_devuelve_solo_propias(self):
        propia = self.crear_denuncia(usuario=self.ciudadano)
        self.crear_denuncia(usuario=self.otro_usuario)
        url = reverse("mis_denuncias")
        self.autenticar(self.ciudadano)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], propia.id)

    def test_detalle_denuncia_ajena_retorna_404(self):
        denuncia_otro = self.crear_denuncia(usuario=self.otro_usuario)
        url = reverse("mi_denuncia_detalle", args=[denuncia_otro.id])
        self.autenticar(self.ciudadano)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_actualizacion_estado_requiere_permiso(self):
        denuncia = self.crear_denuncia(estado=EstadoDenuncia.PENDIENTE)
        url = reverse("denuncias_admin_update", args=[denuncia.id])
        self.autenticar(self.ciudadano)

        response = self.client.patch(
            url,
            {"estado": EstadoDenuncia.EN_GESTION, "jefe_cuadrilla_asignado_id": self.jefe_cuadrilla.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_fiscalizador_no_puede_rechazar_sin_motivo(self):
        denuncia = self.crear_denuncia(estado=EstadoDenuncia.PENDIENTE)
        url = reverse("denuncias_admin_update", args=[denuncia.id])
        self.autenticar(self.fiscalizador)

        response = self.client.patch(url, {"estado": EstadoDenuncia.RECHAZADA}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("motivo_rechazo", response.data)

    def test_fiscalizador_asigna_en_gestion_con_jefe(self):
        denuncia = self.crear_denuncia(estado=EstadoDenuncia.PENDIENTE)
        url = reverse("denuncias_admin_update", args=[denuncia.id])
        self.autenticar(self.fiscalizador)

        response = self.client.patch(
            url,
            {
                "estado": EstadoDenuncia.EN_GESTION,
                "jefe_cuadrilla_asignado_id": self.jefe_cuadrilla.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        denuncia.refresh_from_db()
        self.assertEqual(denuncia.estado, EstadoDenuncia.EN_GESTION)
        self.assertEqual(denuncia.jefe_cuadrilla_asignado, self.jefe_cuadrilla)

    def test_jefes_cuadrilla_restringido_a_roles_validos(self):
        url = reverse("jefes-cuadrilla")

        # Sin autenticar
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Autenticado pero rol ciudadano
        self.autenticar(self.ciudadano)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Fiscalizador autorizado
        self.autenticar(self.fiscalizador)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(jefe["id"] == self.jefe_cuadrilla.id for jefe in response.data))

