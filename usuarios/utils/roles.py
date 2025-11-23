# usuarios/utils/roles.py

from typing import Optional
from django.contrib.auth import get_user_model

Usuario = get_user_model()


def tiene_rol(usuario, *roles: str) -> bool:
    """
    Versión funcional de chequeo de rol.

    - Ignora usuarios no autenticados o None.
    - Devuelve True si usuario.rol está en roles.
    """
    if not usuario or not getattr(usuario, "is_authenticated", False):
        return False

    if not roles:
        return False

    return getattr(usuario, "rol", None) in roles


def puede_gestionar_denuncias(usuario) -> bool:
    """
    Helper centralizado para saber si un usuario puede gestionar denuncias.

    - Si el modelo expone la propiedad `puede_gestionar_denuncias`, se delega en ella.
    - Si no, se hace un fallback usando roles conocidos.
    """
    if not usuario or not getattr(usuario, "is_authenticated", False):
        return False

    # Si el modelo ya tiene la propiedad, la usamos
    if hasattr(usuario, "puede_gestionar_denuncias"):
        return bool(usuario.puede_gestionar_denuncias)

    # Fallback por rol (por si algún día se reusa con otro modelo de usuario)
    return tiene_rol(
        usuario,
        Usuario.Roles.FISCALIZADOR,
        Usuario.Roles.ADMINISTRADOR,
    ) or getattr(usuario, "is_superuser", False)


def redireccion_por_rol(usuario) -> Optional[str]:
    """
    Devuelve el nombre de la URL a la que debe ser redirigido un usuario según su rol.

    Reglas (igual que ahora en tus vistas):

    - CIUDADANO            -> "home"
    - JEFE_CUADRILLA       -> "panel_cuadrilla"
    - FISCALIZADOR/ADMIN   -> "panel_fiscalizador_activos"
    """
    if not usuario or not getattr(usuario, "is_authenticated", False):
        return None

    rol_usuario = getattr(usuario, "rol", None)
    roles_validos = {choice[0] for choice in Usuario.Roles.choices}

    if not rol_usuario or rol_usuario not in roles_validos:
        return None

    if rol_usuario == Usuario.Roles.CIUDADANO:
        return "home"

    if rol_usuario == Usuario.Roles.JEFE_CUADRILLA:
        return "panel_cuadrilla"

    if rol_usuario in {Usuario.Roles.FISCALIZADOR, Usuario.Roles.ADMINISTRADOR}:
        return "panel_fiscalizador_activos"

    # Superusuario sin rol "clásico": lo mando al panel de fiscalizador/admin
    if getattr(usuario, "is_superuser", False):
        return "panel_fiscalizador_activos"

    return None
