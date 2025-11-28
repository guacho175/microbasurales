import { escapeAttribute, escapeHtml } from "../utils/html.js";
import { construirDenunciaHtml } from "./tarjetaDenuncia.ui.js";

function formatearFecha(fechaISO) {
    if (!fechaISO) return "Fecha no disponible";
    const d = new Date(fechaISO);
    return d.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function construirAccordionPendiente(denuncia, helpers) {
    const headingId = `pendiente-heading-${escapeAttribute(denuncia.id)}`;
    const collapseId = `pendiente-collapse-${escapeAttribute(denuncia.id)}`;
    const item = document.createElement("div");
    item.className = "accordion-item";
    item.dataset.id = String(denuncia.id);

    const descripcion = escapeHtml(denuncia.descripcion || "Sin descripción registrada");
    const jefeActual =
        (denuncia.jefe_cuadrilla_asignado && denuncia.jefe_cuadrilla_asignado.id) || "";

    // ✔️ ESTAS DOS LÍNEAS ERAN LO QUE FALTABA
    const fechaFormateada = formatearFecha(denuncia.fecha_creacion);
    const descripcionCorta = descripcion.slice(0, 30) + (descripcion.length > 30 ? "..." : "");

    item.innerHTML = `
        <h2 class="accordion-header" id="${headingId}">
            <button class="accordion-button collapsed" type="button"
                data-bs-toggle="collapse"
                data-bs-target="#${collapseId}"
                aria-expanded="false"
                aria-controls="${collapseId}">
                
                <strong>Caso #${escapeHtml(denuncia.id)}</strong>
                &nbsp;–&nbsp;
                <span>${fechaFormateada}</span>
                &nbsp;–&nbsp;
                <span>${descripcionCorta}</span>

            </button>
        </h2>

        <div id="${collapseId}" class="accordion-collapse collapse"
            aria-labelledby="${headingId}"
            data-bs-parent="#pendientes-accordion">

            <div class="accordion-body d-flex flex-column gap-3">
                ${construirDenunciaHtml(denuncia, helpers)}
            </div>
        </div>
    `;

    return item;
}
