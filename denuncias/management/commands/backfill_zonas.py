"""Completa la zona de denuncias que quedaron con zona pendiente (vacía).

Pensado para ejecutarse como tarea programada (p. ej. el scheduled task diario de
PythonAnywhere):

    python manage.py backfill_zonas --limite 40
"""

import time

from django.core.management.base import BaseCommand

from denuncias.models import Denuncia
from denuncias.utils import obtener_zona_por_coordenadas


class Command(BaseCommand):
    help = "Rellena la zona de denuncias con zona pendiente usando geocoding inverso."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limite",
            type=int,
            default=40,
            help="Máximo de denuncias a procesar (respeta el rate-limit de Nominatim).",
        )

    def handle(self, *args, **options):
        limite = options["limite"]
        pendientes = Denuncia.objects.filter(zona="").order_by("fecha_creacion")[:limite]

        actualizadas = 0
        for denuncia in pendientes:
            zona = obtener_zona_por_coordenadas(denuncia.latitud, denuncia.longitud)
            if zona:
                denuncia.zona = zona
                denuncia.save(update_fields=["zona"])
                actualizadas += 1
            # Nominatim pide máximo 1 petición por segundo.
            time.sleep(1)

        self.stdout.write(
            self.style.SUCCESS(
                f"Zonas completadas: {actualizadas} (de {len(pendientes)} pendientes procesadas)."
            )
        )
