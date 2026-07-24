from django.urls import path

from .views import (
    aviso_legal_view,
    crear_funcionario_view,
    home_view,
    login_view,
    logout_view,
    PerfilPasswordUpdateView,
    PerfilView,
    politica_privacidad_view,
    register_view,
    UsuarioEditarView,
    UsuarioEliminarView,
    UsuariosSistemaView,
)


# Rutas HTML (sesión). Las rutas de la API REST viven en ``usuarios/api_urls.py``.
urlpatterns = [
    # LOGIN HTML (plantilla roja)
    path('login-django/', login_view, name='login_django'),
    path('registrarse/', register_view, name='register'),
    path('aviso-legal/', aviso_legal_view, name='aviso_legal'),
    path('politica-de-privacidad/', politica_privacidad_view, name='politica_privacidad'),

    path('logout/', logout_view, name='logout'),

    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('perfil/cambiar-clave/', PerfilPasswordUpdateView.as_view(), name='perfil_cambiar_clave'),
    path('funcionarios/crear/', crear_funcionario_view, name='crear_funcionario'),
    path('panel/usuarios-sistema/', UsuariosSistemaView.as_view(), name='usuarios_sistema'),
    path('usuarios/editar/<int:pk>/', UsuarioEditarView.as_view(), name='usuarios_editar'),
    path('usuarios/eliminar/<int:pk>/', UsuarioEliminarView.as_view(), name='usuarios_eliminar'),

    path('home/', home_view, name="home"),
]
