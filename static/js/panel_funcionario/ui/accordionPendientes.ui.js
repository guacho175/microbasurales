import { escapeAttribute, escapeHtml } from "../utils/html.js";
import { formatearFecha } from "../utils/formatters.js";
import { construirDenunciaHtml } from "./tarjetaDenuncia.ui.js";

export function construirAccordionPendiente(denuncia, helpers) {
    const headingId = `pendiente-heading-${escapeAttribute(denuncia.id)}`;
    const collapseId = `pendiente-collapse-${escapeAttribute(denuncia.id)}`;
    const item = document.createElement("div");
    item.className = "accordion-item";
    item.dataset.id = String(denuncia.id);
    const descripcion = escapeHtml(denuncia.descripcion || "Sin descripción registrada");
    const fechaCreacion = formatearFecha(denuncia.fecha_creacion);
    const jefeActual =
        (denuncia.jefe_cuadrilla_asignado && denuncia.jefe_cuadrilla_asignado.id) || "";

    item.innerHTML = `
        <h2 class="accordion-header" id="${headingId}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                <div class="d-flex flex-column gap-2 w-100">
                    <div class="d-flex justify-content-between align-items-center accordion-meta small fw-semibold">
                        <span>ID: #${escapeHtml(denuncia.id)}</span>
                        <span>${escapeHtml(fechaCreacion)}</span>
                    </div>
                    <div class="d-flex flex-column flex-md-row gap-1 w-100 justify-content-between align-items-start align-items-md-center">
                        <span class="fw-semibold">${descripcion}</span>
                    </div>
                </div>
            </button>
        </h2>
        <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#pendientes-accordion">
            <div class="accordion-body d-flex flex-column gap-3">
                ${construirDenunciaHtml(denuncia, helpers)}
                <div class="d-flex flex-column flex-lg-row gap-2 align-items-lg-center">
                    <select class="form-select jefe-cuadrilla-select" data-denuncia-id="${escapeAttribute(
                        denuncia.id
                    )}">
                        ${helpers.construirOpcionesJefes(jefeActual)}
                    </select>
                    <button class="btn btn-primary asignar-btn" data-denuncia-id="${escapeAttribute(
                        denuncia.id
                    )}">Asignar y marcar en gestión</button>
                    <div class="text-danger small d-none" data-error-denuncia="${escapeAttribute(
                        denuncia.id
                    )}"></div>
                </div>
            </div>
        </div>
    `;

    return item;
}
