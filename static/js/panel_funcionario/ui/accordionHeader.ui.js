import { escapeHtml } from "../utils/html.js";
import { formatearFecha } from "../utils/formatters.js";

export function construirCabeceraAccordion(denuncia, helpers = {}) {
    // Estado visual
    const estado = helpers.obtenerEtiquetaEstado ? helpers.obtenerEtiquetaEstado(denuncia) : (denuncia.estado_display || denuncia.estado);
    const color = helpers.obtenerColorDenuncia ? helpers.obtenerColorDenuncia(denuncia) : '#888';
    // Dirección
    const direccion = escapeHtml(denuncia.direccion_textual || denuncia.direccion || "Sin dirección");
    // Fecha
    const fechaFormateada = formatearFecha(
        denuncia.fecha_creacion || denuncia.fecha || denuncia.created_at || denuncia.fecha_registro
    );
    // Denunciante
    let denunciante = "-";
    if (denuncia.usuario && (denuncia.usuario.nombre || denuncia.usuario.username)) {
        denunciante = escapeHtml(denuncia.usuario.nombre || denuncia.usuario.username);
    }
    // ID
    const id = escapeHtml(denuncia.id);

    // Cabecera visual mejorada
    return `
        <span class="badge" style="background:${color};color:#fff;font-weight:600;">${escapeHtml(estado)}</span>
        <span class="ms-2"><strong>#${id}</strong></span>
        <span class="ms-2">${fechaFormateada}</span>
        <span class="ms-2"><i class="bi bi-person"></i> ${denunciante}</span>
        <span class="ms-2"><i class="bi bi-geo-alt"></i> ${direccion}</span>
    `;
}
