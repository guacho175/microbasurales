"""Tests para la app de analítica."""

import json

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from denuncias.models import Denuncia, EstadoDenuncia


class AnaliticaAccesoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        u = get_user_model()
        cls.ciudadano = u.objects.create_user(
            username="ciud", password="pass1234", rol=u.Roles.CIUDADANO
        )
        cls.fiscalizador = u.objects.create_user(
            username="fisc", password="pass1234", rol=u.Roles.FISCALIZADOR
        )
        cls.admin = u.objects.create_user(
            username="admin1", password="pass1234", rol=u.Roles.ADMINISTRADOR
        )
        Denuncia.objects.create(
            usuario=cls.ciudadano,
            descripcion="x",
            direccion_textual="y",
            latitud=-29.9,
            longitud=-71.2,
            estado=EstadoDenuncia.PENDIENTE,
            zona="Centro",
        )

    def test_dashboard_solo_admin(self):
        self.client.login(username="ciud", password="pass1234")
        self.assertNotEqual(
            self.client.get(reverse("analitica:dashboard")).status_code, 200
        )
        self.client.login(username="admin1", password="pass1234")
        self.assertEqual(
            self.client.get(reverse("analitica:dashboard")).status_code, 200
        )

    def test_export_csv_para_gestion(self):
        # Fiscalizador (gestión) puede acceder a la pantalla de exportación.
        self.client.login(username="fisc", password="pass1234")
        self.assertEqual(
            self.client.get(reverse("analitica:exportar_csv")).status_code, 200
        )

    def test_export_csv_descarga(self):
        self.client.login(username="admin1", password="pass1234")
        resp = self.client.get(reverse("analitica:exportar_csv"), {"descargar": "1"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp["Content-Type"], "text/csv")

    def test_export_csv_prohibido_a_ciudadano(self):
        self.client.login(username="ciud", password="pass1234")
        self.assertNotEqual(
            self.client.get(reverse("analitica:exportar_csv")).status_code, 200
        )

    def test_powerbi_dataset_prohibido_a_ciudadano(self):
        self.client.login(username="ciud", password="pass1234")
        self.assertNotEqual(
            self.client.get(reverse("analitica:powerbi_api")).status_code, 200
        )

    def test_powerbi_dataset_admin_devuelve_lista(self):
        self.client.login(username="admin1", password="pass1234")
        resp = self.client.get(reverse("analitica:powerbi_api"))
        self.assertEqual(resp.status_code, 200)
        datos = json.loads(resp.content)
        self.assertIsInstance(datos, list)
        self.assertEqual(len(datos), 1)  # la denuncia creada en setUpTestData
        registro = datos[0]
        for campo in (
            "id",
            "estado",
            "zona",
            "latitud",
            "longitud",
            "tiene_reporte_cuadrilla",
        ):
            self.assertIn(campo, registro)
