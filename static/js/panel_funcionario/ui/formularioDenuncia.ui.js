export function inicializarFormularioActualizacion(contenedor, deps) {
    if (!contenedor) {
        return;
    }

    const {
        roles,
        denunciasApi,
        cargarDenuncias,
        gestorRechazo,
        denunciasPorId,
        prepararSelectorJefe,
    } = deps;

    const formulario = contenedor.querySelector(".update-form");
    const feedback = contenedor.querySelector(".feedback");
    const wrapperConId =
        contenedor.dataset.id
            ? contenedor
            : contenedor.closest("[data-id], [data-denuncia-id]");
    const denunciaId = wrapperConId
        ? wrapperConId.dataset.id || wrapperConId.dataset.denunciaId
        : null;

    if (!formulario || !denunciaId) {
        return;
    }

    if (formulario.dataset.listenerAttached === "true") {
        return;
    }
    formulario.dataset.listenerAttached = "true";

    if (prepararSelectorJefe) {
        prepararSelectorJefe(contenedor);
    }

    formulario.addEventListener("submit", async (evt) => {
        evt.preventDefault();
        if (feedback) {
            feedback.textContent = "Guardando cambios...";
            feedback.className = "feedback mt-2 text-muted";
        }

        const formData = new FormData(formulario);
        const payload = {
            reporte_cuadrilla: (formData.get("reporte_cuadrilla") || "").trim(),
        };
        const cuadrillaAsignada = formData.get("cuadrilla_asignada");
        if (cuadrillaAsignada !== null) {
            payload.cuadrilla_asignada = (cuadrillaAsignada || "").trim();
        }
        const jefeSeleccionado = formData.get("jefe_cuadrilla_asignado_id");
        if (jefeSeleccionado) {
            payload.jefe_cuadrilla_asignado_id = Number(jefeSeleccionado);
        }

        const estadoObjetivo = formData.get("estado");
        if (estadoObjetivo) {
            payload.estado = estadoObjetivo;
        }

        if (
            roles.esFiscalizador &&
            payload.estado === "en_gestion" &&
            !payload.jefe_cuadrilla_asignado_id
        ) {
            if (feedback) {
                feedback.textContent =
                    "Debes seleccionar un jefe de cuadrilla antes de continuar.";
                feedback.className = "feedback mt-2 text-danger";
            }
            return;
        }

        if (
            roles.esFiscalizador &&
            formulario.dataset.estadoActual === "en_gestion" &&
            payload.estado === "realizado" &&
            !payload.reporte_cuadrilla
        ) {
            if (feedback) {
                feedback.textContent =
                    "Debes adjuntar el reporte de cuadrilla antes de marcar la denuncia como realizada.";
                feedback.className = "feedback mt-2 text-danger";
            }
            return;
        }

        try {
            await denunciasApi.enviarActualizacionDenuncia(denunciaId, payload);
            if (feedback) {
                feedback.textContent = "Cambios guardados correctamente";
                feedback.className = "feedback mt-2 text-success";
            }
            cargarDenuncias();
        } catch (error) {
            if (feedback) {
                feedback.textContent =
                    error.message || "No se pudieron guardar los cambios";
                feedback.className = "feedback mt-2 text-danger";
            }
        }
    });

    const botonRechazo = contenedor.querySelector(
        ".btn-rechazar-denuncia"
    );
    if (botonRechazo) {
        botonRechazo.addEventListener("click", () => {
            const denuncia = denunciasPorId.get(Number(denunciaId));
            if (denuncia) {
                gestorRechazo.abrirModalRechazo(denuncia);
            }
        });
    }
}
