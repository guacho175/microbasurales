import { clonarContenido, limpiarElemento, actualizarContador } from "../utils/dom.js";
import { construirAccordionPendiente } from "../ui/accordionPendientes.ui.js";
import { crearTarjetaDenuncia } from "../ui/tarjetaDenuncia.ui.js";

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

    function prepararToggleAccordion(accordion) {
        accordion.querySelectorAll(".accordion-button").forEach((boton) => {
            if (boton.dataset.toggleAttached === "true") {
                return;
            }

            const targetSelector = boton.getAttribute("data-bs-target");
            if (!targetSelector) {
                return;
            }

            const destino = accordion.querySelector(targetSelector);
            if (!destino) {
                return;
            }

            const colapsoInstancia =
                window.bootstrap?.Collapse?.getOrCreateInstance(destino, {
                    toggle: false,
                }) || null;

            boton.dataset.toggleAttached = "true";
            boton.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (colapsoInstancia) {
                    colapsoInstancia.toggle();
                    return;
                }

                const abierto = destino.classList.contains("show");

                accordion.querySelectorAll(".accordion-collapse.show").forEach((item) => {
                    if (item === destino) {
                        return;
                    }
                    item.classList.remove("show");
                    const header = accordion.querySelector(
                        `button[data-bs-target='#${item.id}']`
                    );
                    if (header) {
                        header.classList.add("collapsed");
                        header.setAttribute("aria-expanded", "false");
                    }
                });

                if (abierto) {
                    destino.classList.remove("show");
                    boton.classList.add("collapsed");
                    boton.setAttribute("aria-expanded", "false");
                } else {
                    destino.classList.add("show");
                    boton.classList.remove("collapsed");
                    boton.setAttribute("aria-expanded", "true");
                }
            });
        });
    }

    function renderPendientes(denuncias) {
        if (!contenedor) {
            return;
        }

        limpiarElemento(contenedor);

        if (!denuncias.length) {
            if (plantillaVacia) {
                const vacio = clonarContenido(plantillaVacia);
                if (vacio) {
                    contenedor.appendChild(vacio);
                }
            }
            actualizarContador(contador, denuncias.length);
            return;
        }

        if (!esFiscalizador) {
            denuncias.forEach((denuncia) => {
                contenedor.appendChild(crearTarjetaDenuncia(denuncia, helpers));
            });
            actualizarContador(contador, denuncias.length);
            return;
        }

        const accordion = document.createElement("div");
        accordion.className = "accordion";
        accordion.id = "pendientes-accordion";

        denuncias.forEach((denuncia) => {
            const item = construirAccordionPendiente(denuncia, helpers);
            if (helpers.inicializarFormulario) {
                helpers.inicializarFormulario(item);
            }
            accordion.appendChild(item);
        });

        contenedor.appendChild(accordion);
        prepararAsignacionPendientes(accordion);
        prepararToggleAccordion(accordion);

        actualizarContador(contador, denuncias.length);
    }

    return {
        renderPendientes,
    };
}
