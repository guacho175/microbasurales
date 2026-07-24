"""Permisos personalizados para el módulo de denuncias."""

from rest_framework import permissions

from .models import Denuncia


class PuedeGestionarDenuncias(permissions.BasePermission):
    """Permite el acceso a personal autorizado para gestionar denuncias.

    Fuente única de verdad: ``Usuario.puede_gestionar_denuncias`` (fiscalizador o
    administrador).
    """

    def has_permission(self, request, view):
        user = request.user

        if not (user and user.is_authenticated):
            return False

        return bool(getattr(user, "puede_gestionar_denuncias", False))


# Alias retrocompatible (el nombre anterior aludía a un rol ya eliminado).
IsFuncionarioMunicipal = PuedeGestionarDenuncias


class PuedeEditarDenunciasFinalizadas(permissions.BasePermission):
    """Restringe la edición de denuncias finalizadas a administradores."""

    message = (
        "Solo cuentas administradoras pueden modificar una denuncia finalizada."
    )

    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, Denuncia):
            return True

        if obj.estado != Denuncia.EstadoDenuncia.FINALIZADO:
            return True

        return bool(getattr(request.user, "es_administrador", False))
