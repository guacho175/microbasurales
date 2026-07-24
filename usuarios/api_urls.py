"""Rutas de la API REST de usuarios (montadas bajo /api/usuarios/).

Se mantienen separadas de las rutas HTML (``usuarios/urls.py``) para evitar que los
endpoints de API queden duplicados en la raíz del sitio y para no colisionar el
nombre ``login`` (HTML) con el de obtención de token JWT.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegistroUsuarioView, me_view


urlpatterns = [
    # REGISTRO API
    path("registro/", RegistroUsuarioView.as_view(), name="registro"),

    # LOGIN JWT (obtención de par de tokens)
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),

    # REFRESH JWT
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Endpoint protegido /me/ (rol real del usuario autenticado)
    path("me/", me_view, name="me"),
]
