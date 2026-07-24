"""Tests para la app de usuarios."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class RolesModelTests(TestCase):
    def test_rol_funcionario_municipal_eliminado(self):
        valores = {v for v, _ in get_user_model().Roles.choices}
        self.assertNotIn("funcionario_municipal", valores)
        self.assertEqual(
            valores,
            {"ciudadano", "jefe_cuadrilla", "fiscalizador", "administrador"},
        )

    def test_puede_gestionar_denuncias_solo_fiscalizador_y_admin(self):
        u = get_user_model()
        ciudadano = u(username="c", rol=u.Roles.CIUDADANO)
        fiscalizador = u(username="f", rol=u.Roles.FISCALIZADOR)
        admin = u(username="a", rol=u.Roles.ADMINISTRADOR)
        jefe = u(username="j", rol=u.Roles.JEFE_CUADRILLA)
        self.assertFalse(ciudadano.puede_gestionar_denuncias)
        self.assertTrue(fiscalizador.puede_gestionar_denuncias)
        self.assertTrue(admin.puede_gestionar_denuncias)
        self.assertFalse(jefe.puede_gestionar_denuncias)


class MeViewTests(TestCase):
    def test_me_devuelve_rol_real(self):
        u = get_user_model()
        fiscalizador = u.objects.create_user(
            username="fisc", password="pass1234", rol=u.Roles.FISCALIZADOR
        )
        api = APIClient()
        api.force_authenticate(fiscalizador)
        resp = api.get(reverse("me"))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["rol"], "fiscalizador")
        self.assertEqual(data["rol_display"], "Fiscalizador")


class LoginRedireccionPorRolTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        u = get_user_model()
        cls.ciudadano = u.objects.create_user(
            username="ciud", password="pass1234", rol=u.Roles.CIUDADANO
        )
        cls.jefe = u.objects.create_user(
            username="jefe", password="pass1234", rol=u.Roles.JEFE_CUADRILLA
        )
        cls.fiscalizador = u.objects.create_user(
            username="fisc", password="pass1234", rol=u.Roles.FISCALIZADOR
        )

    def _login(self, username):
        return self.client.post(
            reverse("login_django"),
            {"username": username, "password": "pass1234"},
        )

    def test_ciudadano_redirige_a_home(self):
        resp = self._login("ciud")
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(resp.url, reverse("home"))

    def test_jefe_redirige_a_panel_cuadrilla(self):
        resp = self._login("jefe")
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(resp.url, reverse("panel_cuadrilla"))

    def test_fiscalizador_redirige_a_panel(self):
        resp = self._login("fisc")
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(resp.url, reverse("panel_fiscalizador_activos"))
