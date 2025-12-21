import { construirTextoMotivoRechazo } from "../utils/formatters.js";

export function crearGestorRechazo({
    modalElement,
    formElement,
    selectMotivo,
    comentarioInput,
    comentarioWrapper,
    feedbackElement,
    bootstrap,
    enviarActualizacionDenuncia,
    mostrarMensajeGlobal,
    manejarRechazoLocal,
}) {
    const rechazoModal = modalElement && bootstrap ? new bootstrap.Modal(modalElement) : null;
    let denunciaRechazoActual = null;

    function mostrarErrorRechazo(mensaje) {
        if (!feedbackElement) {
            return;
        }
        feedbackElement.textContent = mensaje;
        feedbackElement.classList.remove("d-none");
    }

    function ocultarErrorRechazo() {
        if (!feedbackElement) {
            return;
        }
        feedbackElement.textContent = "";
        feedbackElement.classList.add("d-none");
    }

    function actualizarVisibilidadComentarioRechazo() {
        if (!comentarioWrapper || !selectMotivo) {
            return;
        }
        const opcion = selectMotivo.value;
        if (opcion === "otro") {
            comentarioWrapper.classList.remove("d-none");
        } else {
            comentarioWrapper.classList.add("d-none");
        }
    }

    function abrirModalRechazo(denuncia) {
        if (!rechazoModal || !selectMotivo) {
            return;
        }
        denunciaRechazoActual = denuncia;
        if (selectMotivo) {
            selectMotivo.value = "";
        }
        if (comentarioInput) {
            comentarioInput.value = "";
        }
        ocultarErrorRechazo();
        actualizarVisibilidadComentarioRechazo();
        rechazoModal.show();
    }

    if (selectMotivo) {
        selectMotivo.addEventListener("change", actualizarVisibilidadComentarioRechazo);
        actualizarVisibilidadComentarioRechazo();
    }

    if (formElement && rechazoModal) {
        formElement.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!denunciaRechazoActual) {
                mostrarErrorRechazo("No pudimos identificar la denuncia que deseas rechazar.");
                return;
            }
            ocultarErrorRechazo();
            const opcion = selectMotivo ? selectMotivo.value : "";
            const comentario = comentarioInput ? comentarioInput.value : "";
            const motivoFinal = construirTextoMotivoRechazo(opcion, comentario);

            if (!motivoFinal) {
                const mensaje =
                    opcion === "otro"
                        ? "Debes ingresar un comentario para rechazar la denuncia."
                        : "Debes seleccionar un motivo para rechazar la denuncia.";
                mostrarErrorRechazo(mensaje);
                return;
            }

            try {
                const denunciaId = denunciaRechazoActual.id;
                await enviarActualizacionDenuncia(denunciaId, {
                    estado: "rechazada",
                    motivo_rechazo: motivoFinal,
                });
                rechazoModal.hide();
                denunciaRechazoActual = null;
                mostrarMensajeGlobal(
                    "La denuncia fue rechazada correctamente.",
                    "success"
                );
                manejarRechazoLocal(denunciaId, motivoFinal);
            } catch (error) {
                const mensaje =
                    error.message || "No se pudo rechazar la denuncia en este momento.";
                mostrarErrorRechazo(mensaje);
            }
        });
    }

    return {
        abrirModalRechazo,
    };
}
