import { formatearFecha } from "../utils/formatters.js";
import { escapeAttribute, escapeHtml } from "../utils/html.js";

export function construirPopup(denuncia, { obtenerEtiquetaEstado, obtenerColorDenuncia }) {
    const wrapper = document.createElement("div");
    wrapper.className = "popup-denuncia";
    wrapper.dataset.id = denuncia.id;

    const estadoEtiqueta = escapeHtml(obtenerEtiquetaEstado(denuncia));
    const color = obtenerColorDenuncia(denuncia);
    const fecha = formatearFecha(denuncia.fecha_creacion);
    const denuncianteNombre = escapeHtml(
        (denuncia.usuario && denuncia.usuario.nombre) || "Sin registro"
    );
    const zona = escapeHtml(denuncia.zona || "No asignada");
    const miniaturaFuente = denuncia.imagen
        ? denuncia.imagen
        : denuncia.reporte_cuadrilla && denuncia.reporte_cuadrilla.foto_trabajo
          ? denuncia.reporte_cuadrilla.foto_trabajo
          : null;
    const miniaturaHtml = miniaturaFuente
        ? `<img src="${escapeAttribute(
              miniaturaFuente
          )}" alt="Vista previa del caso ${escapeAttribute(
              denuncia.id
          )}" class="img-fluid rounded">`
        : `<div class="denuncia-card__thumb-placeholder">Sin imagen</div>`;

    wrapper.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="fw-semibold">Caso #${escapeHtml(denuncia.id)}</div>
            <span class="badge" style="background-color: ${escapeAttribute(
                color
            )}; color: #fff;">${estadoEtiqueta}</span>
        </div>
        <div class="mb-3 popup-denuncia__thumb">${miniaturaHtml}</div>
        <ul class="list-unstyled mb-0 small">
            <li><strong>Estado:</strong> ${estadoEtiqueta}</li>
            <li><strong>Denunciante:</strong> ${denuncianteNombre}</li>
            <li><strong>Zona:</strong> ${zona}</li>
            <li><strong>Fecha:</strong> ${fecha}</li>
        </ul>
    `;

    return wrapper.outerHTML;
}
