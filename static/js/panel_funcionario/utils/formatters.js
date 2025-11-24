import { escapeAttribute, escapeHtml } from "./html.js";

export function formatearFecha(fechaIso) {
    if (!fechaIso) {
        return "-";
    }
    try {
        const fecha = new Date(fechaIso);
        return fecha.toLocaleString("es-CL", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (error) {
        return fechaIso;
    }
}

export function formatearCoordenadas(latitud, longitud) {
    if (!latitud || !longitud) {
        return "Sin coordenadas";
    }
    const lat = Number(latitud).toFixed(6);
    const lng = Number(longitud).toFixed(6);
    return `${escapeHtml(lat)}, ${escapeHtml(lng)}`;
}

export function construirTextoMotivoRechazo(opcion, comentario) {
    const base = opcion ? opcion.textContent || "Motivo no especificado" : "Motivo no especificado";
    if (comentario) {
        return `${base} - Comentario: ${escapeAttribute(comentario)}`;
    }
    return base;
}
