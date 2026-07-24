import { crearMarcadorDenuncia } from "../ui/mapa.ui.js";

export function crearMapaManager({ mapaElemento, estadosUtils, onPopupReady }) {
    const map = L.map(mapaElemento, {
        scrollWheelZoom: true,
    }).setView([-33.4507, -70.6671], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
    }).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);
    const marcadoresPorId = new Map();

    function limpiar() {
        markerLayer.clearLayers();
        marcadoresPorId.clear();
    }

    function agregarMarcador(denuncia, bounds = []) {
        const marker = crearMarcadorDenuncia(
            { markerLayer, marcadoresPorId },
            denuncia,
            estadosUtils
        );
        if (marker && bounds) {
            bounds.push([denuncia.latitud, denuncia.longitud]);
        }
    }

    function ajustarMapa(bounds) {
        if (!bounds.length) {
            return;
        }
        const leafletBounds = L.latLngBounds(bounds);
        map.fitBounds(leafletBounds, { padding: [10, 10] });
    }

    function centrarDenunciaEnMapa(denunciaId, { enfocarFormulario = false } = {}) {
        const marker = marcadoresPorId.get(Number(denunciaId));

        if (!marker) {
            return false;
        }

        const latLng = marker.getLatLng();
        map.setView(latLng, Math.max(map.getZoom(), 15), { animate: true });
        marker.openPopup();

        if (enfocarFormulario) {
            setTimeout(() => {
                const popup = marker.getPopup();
                if (!popup) {
                    return;
                }
                const popupElement = popup.getElement();
                if (!popupElement) {
                    return;
                }
                const primerCampo = popupElement.querySelector(
                    ".update-form select, .update-form input"
                );
                if (primerCampo) {
                    primerCampo.focus();
                }
            }, 300);
        }
        return true;
    }

    map.on("popupopen", (event) => {
        const popupElement = event.popup.getElement();
        if (!popupElement) {
            return;
        }
        const contenedor = popupElement.querySelector(".popup-denuncia");
        if (!contenedor || !onPopupReady) {
            return;
        }
        onPopupReady(contenedor);
    });

    return {
        map,
        markerLayer,
        marcadoresPorId,
        limpiar,
        agregarMarcador,
        ajustarMapa,
        centrarDenunciaEnMapa,
    };
}
