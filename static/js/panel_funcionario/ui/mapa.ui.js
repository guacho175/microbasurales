import { construirPopup } from "./popup.ui.js";

export function crearMarcadorDenuncia(
    mapLayers,
    denuncia,
    { obtenerColorDenuncia, obtenerEtiquetaEstado }
) {
    if (!denuncia.latitud || !denuncia.longitud) {
        return null;
    }

    const color = obtenerColorDenuncia(denuncia);
    const marker = L.circleMarker([denuncia.latitud, denuncia.longitud], {
        radius: 16,
        fillColor: color,
        color: "#ffffff",
        weight: 3,
        fillOpacity: 1,
    });

    marker.bindPopup(construirPopup(denuncia, { obtenerEtiquetaEstado, obtenerColorDenuncia }));
    mapLayers.markerLayer.addLayer(marker);
    mapLayers.marcadoresPorId.set(Number(denuncia.id), marker);
    return marker;
}
