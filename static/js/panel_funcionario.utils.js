// static/js/panel_funcionario.utils.js
// Utilidades generales y constantes compartidas

export const DEFAULT_MARKER_COLOR = "#1d3557";

export const ESTADOS_EQUIVALENCIAS = new Map([
    ["nuevo", "pendiente"],
    ["nueva", "pendiente"],
    ["nuevos", "pendiente"],
    ["nuevas", "pendiente"],
    ["pendientes", "pendiente"],
    ["en_proceso", "en_gestion"],
    ["en-proceso", "en_gestion"],
    ["enproceso", "en_gestion"],
    ["gestion", "en_gestion"],
    ["rechazada", "rechazada"],
    ["rechazadas", "rechazada"],
    ["rechazado", "rechazada"],
    ["resuelta", "finalizado"],
    ["resueltas", "finalizado"],
    ["resuelto", "finalizado"],
    ["resueltos", "finalizado"],
    ["finalizada", "finalizado"],
    ["finalizadas", "finalizado"],
    ["finalizo", "finalizado"],
    ["finalizados", "finalizado"],
    ["realizada", "realizado"],
    ["realizadas", "realizado"],
    ["realizados", "realizado"],
    ["operativo_realizado", "realizado"],
    ["operativo-realizado", "realizado"],
    ["operativo realizado", "realizado"],
]);

export const MOTIVOS_RECHAZO_TEXTOS = {
    foto_insuficiente:
        "La denuncia no puede procesarse: evidencia insuficiente (foto poco clara).",
    no_verificada: "No se logró verificar el microbasural en terreno.",
    datos_insuficientes:
        "El reporte no contiene datos suficientes para acudir al lugar.",
    ya_gestionada:
        "La denuncia ya está siendo gestionada bajo otro caso activo. (denuncia duplicada)",
};

export const MOTIVOS_RECHAZO_PREDEFINIDOS = new Set(
    Object.values(MOTIVOS_RECHAZO_TEXTOS)
);

export function normalizarEstado(valor) {
    if (!valor) return valor;
    const clave = valor
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[-\s]+/g, "_");
    return ESTADOS_EQUIVALENCIAS.get(clave) || clave;
}

export function escapeHtml(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function escapeAttribute(texto) {
    return escapeHtml(texto);
}

export function ordenarDenunciasPorFecha(denuncias) {
    denuncias.sort((a, b) => {
        const fechaA = a.fecha_creacion ? new Date(a.fecha_creacion) : null;
        const fechaB = b.fecha_creacion ? new Date(b.fecha_creacion) : null;

        if (fechaA && fechaB) return fechaA - fechaB;
        if (fechaA) return -1;
        if (fechaB) return 1;
        return 0;
    });
}

export function formatearFecha(fechaIso) {
    if (!fechaIso) return "-";
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return "-";
    return fecha.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatearCoordenadas(latitud, longitud) {
    const lat = Number(latitud);
    const lng = Number(longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function actualizarContador(elemento, total) {
    if (!elemento) return;
    elemento.textContent = `${total}`;
    const etiqueta = `${total} ${total === 1 ? "caso" : "casos"}`;
    elemento.setAttribute("title", etiqueta);
    elemento.setAttribute("aria-label", etiqueta);
}

export function obtenerCSRFToken() {
    const nombre = "csrftoken";
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const cookie of cookies) {
        const partes = cookie.trim().split("=");
        const clave = partes.shift();
        if (clave === nombre) {
            return decodeURIComponent(partes.join("="));
        }
    }
    return null;
}

export async function extraerMensajeDeError(respuesta) {
    const generico = "No se pudieron guardar los cambios";
    try {
        const data = await respuesta.clone().json();
        if (!data) return generico;

        if (typeof data === "string") return data;
        if (data.detail) return data.detail;

        const valores = Object.values(data)
            .flat()
            .map((item) =>
                typeof item === "string" ? item : JSON.stringify(item)
            )
            .filter(Boolean);

        if (valores.length) {
            return valores.join(" ");
        }
    } catch (error) {
        console.warn("No fue posible interpretar el error", error);
    }
    return generico;
}

export function mostrarMensajeGlobal(mapaElemento, mensaje, tipo = "info") {
    if (!mapaElemento) return;
    const contenedor = document.createElement("div");
    contenedor.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
    contenedor.setAttribute("role", "alert");
    contenedor.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    mapaElemento.insertAdjacentElement("afterend", contenedor);
    setTimeout(() => {
        contenedor.remove();
    }, 6000);
}
