export function crearGestorEstados({
    esFiscalizador,
    esAdministrador,
    esFuncionario,
    normalizarEstado,
    obtenerConfigEstado,
}) {
    function puedeEditarDenuncia(denuncia) {
        const estadoActual = normalizarEstado(denuncia.estado);
        if (esAdministrador) {
            return estadoActual === "realizado";
        }
        if (esFiscalizador) {
            return estadoActual === "pendiente";
        }
        if (esFuncionario) {
            return estadoActual === "pendiente";
        }
        return false;
    }

    function obtenerOpcionesEstadoParaUsuario(denuncia) {
        const estadoActual = normalizarEstado(denuncia.estado);
        if (esAdministrador) {
            if (estadoActual === "realizado") {
                return [estadoActual, "finalizado"];
            }
            return [estadoActual];
        }

        if (esFiscalizador) {
            if (estadoActual === "pendiente") {
                return [estadoActual, "en_gestion"];
            }
            return [estadoActual];
        }

        if (esFuncionario) {
            return [estadoActual];
        }

        return [estadoActual];
    }

    function obtenerTextoAyudaEstado(estadoActual) {
        if (esAdministrador && estadoActual === "realizado") {
            return "Al finalizar se notificará automáticamente al denunciante.";
        }
        if (esAdministrador && estadoActual !== "realizado") {
            return "Solo puedes finalizar denuncias marcadas como realizadas.";
        }
        if (esFiscalizador && estadoActual === "realizado") {
            return "Pendiente de revisión administrativa para cierre definitivo.";
        }
        if (esFiscalizador && estadoActual === "en_gestion") {
            return "Debes adjuntar el reporte de cuadrilla antes de marcarla como realizada.";
        }
        if (esFuncionario && estadoActual === "pendiente") {
            return "Puedes eliminar denuncias pendientes indicando el motivo.";
        }
        return "";
    }

    return {
        puedeEditarDenuncia,
        puedeEliminarDenuncia: (denuncia) => {
            const estadoActual = normalizarEstado(denuncia.estado);
            if (esFiscalizador) {
                return estadoActual === "pendiente";
            }
            if (esFuncionario) {
                return estadoActual === "pendiente";
            }
            return false;
        },
        obtenerOpcionesEstadoParaUsuario,
        obtenerTextoAyudaEstado,
        obtenerConfigEstado,
    };
}
