"""Tests para la app de denuncias."""

import io
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from PIL import Image

from .models import Denuncia, EstadoDenuncia, ReporteCuadrilla


def _crear_denuncia(usuario, **extra):
    valores = {
        "usuario": usuario,
        "descripcion": "Basural",
        "direccion_textual": "Calle 123",
        "latitud": -29.90,
        "longitud": -71.25,
        "estado": EstadoDenuncia.PENDIENTE,
    }
    valores.update(extra)
    return Denuncia.objects.create(**valores)


class DenunciaApiPermisosTests(TestCase):
    """Cubre la regresión de la fuga de datos C-2 y el aislamiento por usuario."""

    @classmethod
    def setUpTestData(cls):
        u = get_user_model()
        cls.ciudadano = u.objects.create_user(
            username="ciud", password="pass1234", rol=u.Roles.CIUDADANO
        )
        cls.otro_ciudadano = u.objects.create_user(
            username="ciud2", password="pass1234", rol=u.Roles.CIUDADANO
        )
        cls.fiscalizador = u.objects.create_user(
            username="fisc", password="pass1234", rol=u.Roles.FISCALIZADOR
        )
        cls.den_propia = _crear_denuncia(cls.ciudadano, descripcion="mia")
        cls.den_ajena = _crear_denuncia(cls.otro_ciudadano, descripcion="ajena")

    def setUp(self):
        self.api = APIClient()

    def test_listado_general_prohibido_para_ciudadano(self):
        """C-2: un ciudadano NO puede listar todas las denuncias."""
        self.api.force_authenticate(self.ciudadano)
        resp = self.api.get(reverse("denuncias_list_create"))
        self.assertEqual(resp.status_code, 403)

    def test_listado_general_permitido_para_gestion(self):
        self.api.force_authenticate(self.fiscalizador)
        resp = self.api.get(reverse("denuncias_list_create"))
        self.assertEqual(resp.status_code, 200)

    def test_ciudadano_solo_ve_sus_denuncias(self):
        self.api.force_authenticate(self.ciudadano)
        resp = self.api.get(reverse("mis_denuncias"))
        self.assertEqual(resp.status_code, 200)
        descripciones = {d["descripcion"] for d in resp.json()}
        self.assertEqual(descripciones, {"mia"})

    @override_settings(GEOCODING_ENABLED=False)
    def test_ciudadano_puede_crear_denuncia(self):
        self.api.force_authenticate(self.ciudadano)
        imagen = SimpleUploadedFile("f.jpg", b"\xff\xd8\xff\xe0fake", content_type="image/jpeg")
        resp = self.api.post(
            reverse("denuncias_list_create"),
            {
                "descripcion": "nueva",
                "direccion_textual": "Av Siempre Viva 1",
                "latitud": "-29.9",
                "longitud": "-71.2",
                "imagen": imagen,
            },
            format="multipart",
        )
        self.assertEqual(resp.status_code, 201)

    def test_ciudadano_no_accede_a_panel_admin(self):
        self.api.force_authenticate(self.ciudadano)
        resp = self.api.get(reverse("denuncias_admin_list"))
        self.assertEqual(resp.status_code, 403)

    def test_mapa_publico_sin_datos_personales(self):
        self.api.force_authenticate(self.ciudadano)
        resp = self.api.get(reverse("denuncias_mapa_publico"))
        self.assertEqual(resp.status_code, 200)
        datos = resp.json()
        self.assertEqual(len(datos), 2)  # ve todas las denuncias en el mapa
        campos = set(datos[0].keys())
        # No debe exponer información personal del denunciante.
        for prohibido in ("usuario", "descripcion", "direccion_textual", "imagen"):
            self.assertNotIn(prohibido, campos)
        self.assertIn("latitud", campos)
        self.assertIn("estado", campos)

    def test_mapa_publico_accesible_sin_autenticar(self):
        """El mapa público es anónimo y aun así no expone PII."""
        resp = self.api.get(reverse("denuncias_mapa_publico"))  # sin autenticar
        self.assertEqual(resp.status_code, 200)
        datos = resp.json()
        self.assertEqual(len(datos), 2)
        for prohibido in ("usuario", "descripcion", "direccion_textual", "imagen"):
            self.assertNotIn(prohibido, set(datos[0].keys()))


class DenunciaTransicionesTests(TestCase):
    """Cubre las reglas de transición de estado del flujo de gestión."""

    @classmethod
    def setUpTestData(cls):
        u = get_user_model()
        cls.ciudadano = u.objects.create_user(
            username="ciud", password="pass1234", rol=u.Roles.CIUDADANO,
            email="ciudadano@example.com",
        )
        cls.fiscalizador = u.objects.create_user(
            username="fisc", password="pass1234", rol=u.Roles.FISCALIZADOR
        )
        cls.admin = u.objects.create_user(
            username="admin1", password="pass1234", rol=u.Roles.ADMINISTRADOR
        )
        cls.jefe = u.objects.create_user(
            username="jefe", password="pass1234", rol=u.Roles.JEFE_CUADRILLA
        )

    def setUp(self):
        self.api = APIClient()

    def _url(self, denuncia):
        return reverse("denuncias_admin_update", args=[denuncia.id])

    def test_en_gestion_requiere_jefe(self):
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.PENDIENTE)
        self.api.force_authenticate(self.fiscalizador)
        resp = self.api.patch(self._url(den), {"estado": "en_gestion"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_fiscalizador_mueve_a_en_gestion_con_jefe(self):
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.PENDIENTE)
        self.api.force_authenticate(self.fiscalizador)
        resp = self.api.patch(
            self._url(den),
            {"estado": "en_gestion", "jefe_cuadrilla_asignado_id": self.jefe.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        den.refresh_from_db()
        self.assertEqual(den.estado, EstadoDenuncia.EN_GESTION)
        self.assertEqual(den.jefe_cuadrilla_asignado, self.jefe)

    def test_rechazo_requiere_motivo(self):
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.PENDIENTE)
        self.api.force_authenticate(self.fiscalizador)
        resp = self.api.patch(self._url(den), {"estado": "rechazada"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_admin_finaliza_operativo_realizado(self):
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.REALIZADO)
        self.api.force_authenticate(self.admin)
        resp = self.api.patch(self._url(den), {"estado": "finalizado"}, format="json")
        self.assertEqual(resp.status_code, 200)
        den.refresh_from_db()
        self.assertEqual(den.estado, EstadoDenuncia.FINALIZADO)

    def test_ciudadano_no_puede_actualizar_estado(self):
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.PENDIENTE)
        self.api.force_authenticate(self.ciudadano)
        resp = self.api.patch(self._url(den), {"estado": "en_gestion"}, format="json")
        self.assertEqual(resp.status_code, 403)

    @override_settings(
        NOTIFICACIONES_EMAIL_ENABLED=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_cambio_estado_envia_email_y_notificacion(self):
        from django.core import mail
        from .models import DenunciaNotificacion

        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.REALIZADO)
        self.api.force_authenticate(self.admin)
        resp = self.api.patch(self._url(den), {"estado": "finalizado"}, format="json")
        self.assertEqual(resp.status_code, 200)
        # Notificación in-app creada.
        self.assertTrue(
            DenunciaNotificacion.objects.filter(denuncia=den, usuario=self.ciudadano).exists()
        )
        # Email enviado al ciudadano (backend en memoria del test runner).
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("ciudadano@example.com", mail.outbox[0].to)

    def test_admin_no_puede_rechazar(self):
        """Solo el fiscalizador puede rechazar; el admin no."""
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.PENDIENTE)
        self.api.force_authenticate(self.admin)
        resp = self.api.patch(
            self._url(den),
            {"estado": "rechazada", "motivo_rechazo": "no_verificada"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
        den.refresh_from_db()
        self.assertEqual(den.estado, EstadoDenuncia.PENDIENTE)

    def test_jefe_cuadrilla_no_accede_a_update_admin(self):
        """Un jefe de cuadrilla no tiene permiso de gestión sobre el endpoint admin."""
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.PENDIENTE)
        self.api.force_authenticate(self.jefe)
        resp = self.api.patch(self._url(den), {"estado": "en_gestion"}, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_fiscalizador_no_puede_finalizar(self):
        """Finalizar (operativo_realizado -> finalizado) es exclusivo del admin."""
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.REALIZADO)
        self.api.force_authenticate(self.fiscalizador)
        resp = self.api.patch(self._url(den), {"estado": "finalizado"}, format="json")
        self.assertEqual(resp.status_code, 400)
        den.refresh_from_db()
        self.assertEqual(den.estado, EstadoDenuncia.REALIZADO)

    def test_no_admin_no_edita_denuncia_finalizada(self):
        """Una denuncia finalizada solo puede modificarla un administrador."""
        den = _crear_denuncia(self.ciudadano, estado=EstadoDenuncia.FINALIZADO)
        self.api.force_authenticate(self.fiscalizador)
        resp = self.api.patch(self._url(den), {"estado": "en_gestion"}, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_en_gestion_a_realizado_requiere_reporte(self):
        """Pasar de en_gestion a operativo_realizado por la API exige un reporte de cuadrilla."""
        den = _crear_denuncia(
            self.ciudadano,
            estado=EstadoDenuncia.EN_GESTION,
            jefe_cuadrilla_asignado=self.jefe,
        )
        self.api.force_authenticate(self.fiscalizador)
        resp = self.api.patch(
            self._url(den), {"estado": "operativo_realizado"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)
        den.refresh_from_db()
        self.assertEqual(den.estado, EstadoDenuncia.EN_GESTION)


class PanelCuadrillaViewTests(TestCase):
    """Cobertura básica sobre el flujo del panel de cuadrilla."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._media_root = tempfile.mkdtemp()
        cls._override = override_settings(MEDIA_ROOT=cls._media_root)
        cls._override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._override.disable()
        shutil.rmtree(cls._media_root, ignore_errors=True)
        super().tearDownClass()

    @classmethod
    def setUpTestData(cls):
        usuario_model = get_user_model()
        cls.jefe = usuario_model.objects.create_user(
            username="jefe", password="pass1234", rol=usuario_model.Roles.JEFE_CUADRILLA
        )
        cls.ciudadano = usuario_model.objects.create_user(
            username="vecino", password="pass1234", rol=usuario_model.Roles.CIUDADANO
        )

    def crear_denuncia(self, **extra):
        valores = {
            "usuario": self.ciudadano,
            "descripcion": extra.get("descripcion", "Basural"),
            "direccion_textual": extra.get("direccion_textual", "Calle 123"),
            "latitud": extra.get("latitud", -33.45),
            "longitud": extra.get("longitud", -70.66),
            "estado": extra.get("estado", EstadoDenuncia.PENDIENTE),
        }
        valores.update(extra)
        return Denuncia.objects.create(**valores)

    def _crear_imagen(self):
        buffer = io.BytesIO()
        imagen = Image.new("RGB", (10, 10), color=(255, 0, 0))
        imagen.save(buffer, format="JPEG")
        buffer.seek(0)
        return SimpleUploadedFile("foto.jpg", buffer.read(), content_type="image/jpeg")

    def test_panel_requiere_rol_jefe(self):
        self.client.login(username="vecino", password="pass1234")
        response = self.client.get(reverse("panel_cuadrilla"))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("home_ciudadano"))

    def test_panel_lista_solo_en_gestion(self):
        # El panel del jefe muestra solo denuncias EN_GESTION asignadas a ese jefe.
        denuncia_en_gestion = self.crear_denuncia(
            estado=EstadoDenuncia.EN_GESTION,
            jefe_cuadrilla_asignado=self.jefe,
        )
        self.crear_denuncia(estado=EstadoDenuncia.PENDIENTE)

        self.client.login(username="jefe", password="pass1234")
        response = self.client.get(reverse("panel_cuadrilla"))
        self.assertEqual(response.status_code, 200)
        denuncias_contexto = list(response.context["denuncias"])
        self.assertIn(denuncia_en_gestion, denuncias_contexto)
        self.assertTrue(all(d.estado == EstadoDenuncia.EN_GESTION for d in denuncias_contexto))

    def test_envio_reporte_crea_registro(self):
        denuncia = self.crear_denuncia(
            estado=EstadoDenuncia.EN_GESTION,
            jefe_cuadrilla_asignado=self.jefe,
        )
        self.client.login(username="jefe", password="pass1234")

        imagen = self._crear_imagen()
        response = self.client.post(
            reverse("panel_cuadrilla"),
            {
                "denuncia_id": denuncia.id,
                "comentario": "Trabajo realizado",
                "foto_trabajo": imagen,
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("panel_cuadrilla"))

        denuncia.refresh_from_db()
        self.assertIsNotNone(denuncia.reporte_cuadrilla)
        self.assertEqual(denuncia.estado, EstadoDenuncia.REALIZADO)
        reporte = ReporteCuadrilla.objects.get(denuncia=denuncia)
        self.assertEqual(reporte.jefe_cuadrilla, self.jefe)
        self.assertEqual(reporte.comentario, "Trabajo realizado")


class GeocodingResilienciaTests(TestCase):
    """El geocoding nunca debe lanzar excepción ni romper la creación de denuncias."""

    @override_settings(GEOCODING_ENABLED=True)
    def test_fallo_de_red_devuelve_zona_vacia(self):
        import requests

        from unittest.mock import patch

        from .utils import obtener_zona_por_coordenadas

        with patch(
            "denuncias.utils.requests.get",
            side_effect=requests.RequestException("sin red"),
        ):
            # Coordenadas inusuales para evitar choques con la caché de otros tests.
            zona = obtener_zona_por_coordenadas(-12.3456, -65.4321)

        self.assertEqual(zona, "")
