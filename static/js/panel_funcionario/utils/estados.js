const DEFAULT_MARKER_COLOR = "#1d3557";

const ESTADOS_EQUIVALENCIAS = new Map([
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

function normalizarEstado(valor) {
    if (!valor) {
        return valor;
    }
    const clave = valor
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[-\s]+/g, "_");
    return ESTADOS_EQUIVALENCIAS.get(clave) || clave;
}

export function crearEstadosUtils(estadosConfig) {
    const estadosMap = new Map(
        estadosConfig.map((estado) => [estado.value, estado])
    );
    const ESTADO_DEFECTO =
        (estadosMap.has("pendiente")
            ? "pendiente"
            : estadosConfig[0] && estadosConfig[0].value) || "pendiente";

    function obtenerConfigEstado(valor) {
        return estadosMap.get(normalizarEstado(valor));
    }

    function obtenerColorDenuncia(denuncia) {
        if (denuncia && denuncia.color) {
            return denuncia.color;
        }

        const estado = denuncia ? normalizarEstado(denuncia.estado) : null;
        const config = denuncia ? obtenerConfigEstado(estado) : null;
        return (config && config.color) || DEFAULT_MARKER_COLOR;
    }

    function obtenerEtiquetaEstado(denuncia) {
        if (!denuncia) {
            return "";
        }

        if (denuncia.estado_display) {
            return denuncia.estado_display;
        }

        const config = obtenerConfigEstado(denuncia.estado);
        if (config && config.label) {
            return config.label;
        }

        return denuncia.estado;
    }

    return {
        normalizarEstado,
        obtenerConfigEstado,
        obtenerColorDenuncia,
        obtenerEtiquetaEstado,
        ESTADO_DEFECTO,
    };
}

export { DEFAULT_MARKER_COLOR, normalizarEstado };
