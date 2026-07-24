import { clonarContenido, limpiarElemento, actualizarContador, renderList } from "../utils/dom.js";
import { construirAccordionPendiente } from "../ui/accordionPendientes.ui.js";

export function crearGestorPendientes({
    esFiscalizador,
    contenedor,
    plantillaVacia,
    contador,
    helpers,
    enviarActualizacionDenuncia,
    mostrarMensajeGlobal,
    recargarDenuncias,
}) {
    function prepararAsignacionPendientes(root) {
        if (!esFiscalizador) {
            return;
        }

        root.querySelectorAll(".asignar-btn").forEach((boton) => {
            if (boton.dataset.listenerAttached === "true") {
                return;
            }

            boton.dataset.listenerAttached = "true";
            boton.addEventListener("click", async () => {
                const denunciaId = boton.dataset.denunciaId;
                const item = boton.closest(".accordion-item");
                const select = item
                    ? item.querySelector(
                          ".jefe-cuadrilla-select[data-denuncia-id='" + denunciaId + "']"
                      )
                    : null;
                const errorElemento = item
                    ? item.querySelector("[data-error-denuncia='" + denunciaId + "']")
                    : null;
                const jefeId = select ? select.value : "";

                if (errorElemento) {
                    errorElemento.textContent = "";
                    errorElemento.classList.add("d-none");
                }

                if (!jefeId) {
                    if (errorElemento) {
                        errorElemento.textContent =
                            "Debe seleccionar un jefe de cuadrilla antes de asignar.";
                        errorElemento.classList.remove("d-none");
                    }
                    return;
                }

                const textoOriginal = boton.textContent;
                boton.disabled = true;
                boton.textContent = "Asignando...";

                try {
                    await enviarActualizacionDenuncia(denunciaId, {
                        estado: "en_gestion",
                        jefe_cuadrilla_asignado_id: Number(jefeId),
                    });
                    mostrarMensajeGlobal(
                        "Denuncia asignada y marcada en gestión correctamente.",
                        "success"
                    );
                    recargarDenuncias();
                } catch (error) {
                    if (errorElemento) {
                        errorElemento.textContent =
                            error.message || "No se pudo asignar la denuncia en este momento.";
                        errorElemento.classList.remove("d-none");
                    }
                } finally {
                    boton.disabled = false;
                    boton.textContent = textoOriginal;
                }
            });
        });
    }

    function renderPendientes(denuncias) {
        renderList({
            contenedor,
            items: denuncias,
            plantillaVacia,
            contadorElemento: contador,
            renderItem: (denuncia) => {
                const item = construirAccordionPendiente(denuncia, helpers);
                if (helpers.inicializarFormulario) {
                    helpers.inicializarFormulario(item);
                }
                return item;
            }
        });

        prepararAsignacionPendientes(contenedor);
    }

    return {
        renderPendientes,
    };
}
