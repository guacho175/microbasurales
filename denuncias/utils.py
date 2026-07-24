"""Utilidades de geocodificación inversa para denuncias.

El geocoding usa Nominatim (OpenStreetMap). Para no degradar la creación de denuncias:
- Es opcional (``GEOCODING_ENABLED``, por defecto activo salvo en pruebas).
- Cachea resultados por coordenada redondeada.
- Usa un timeout corto y, ante cualquier fallo, devuelve "" (zona pendiente) sin bloquear.

Las denuncias con zona pendiente pueden completarse luego con el comando
``manage.py backfill_zonas`` (apto para una tarea programada).
"""

import logging

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
CACHE_TIMEOUT = 60 * 60 * 24 * 30  # 30 días
REQUEST_TIMEOUT = 3  # segundos


def _clave_cache(lat, lon):
    # Redondeo a ~100 m para reutilizar zonas de puntos cercanos.
    return f"zona:{round(float(lat), 3)}:{round(float(lon), 3)}"


def obtener_zona_por_coordenadas(lat, lon):
    """Devuelve la zona (suburb/barrio) para unas coordenadas, o "" si no se pudo.

    Nunca lanza excepción: si falla, devuelve "" para no bloquear la creación.
    """

    if not getattr(settings, "GEOCODING_ENABLED", True):
        return ""

    try:
        clave = _clave_cache(lat, lon)
    except (TypeError, ValueError):
        return ""

    cacheada = cache.get(clave)
    if cacheada is not None:
        return cacheada

    zona = _consultar_nominatim(lat, lon)
    if zona:
        cache.set(clave, zona, CACHE_TIMEOUT)
    return zona


def _consultar_nominatim(lat, lon):
    try:
        respuesta = requests.get(
            NOMINATIM_URL,
            params={
                "format": "json",
                "lat": lat,
                "lon": lon,
                "addressdetails": 1,
            },
            headers={"User-Agent": "microbasurales-app/1.0"},
            timeout=REQUEST_TIMEOUT,
        )
        if respuesta.status_code != 200:
            return ""

        address = respuesta.json().get("address", {})
        candidatos = [
            address.get("suburb"),
            address.get("neighbourhood"),
            address.get("city"),
            address.get("town"),
            address.get("village"),
            address.get("municipality"),
            address.get("state"),
        ]
        for zona in candidatos:
            if zona and zona.strip():
                return zona.strip()
        return ""
    except requests.RequestException:
        logger.warning("Geocoding falló para (%s, %s); zona queda pendiente.", lat, lon)
        return ""
