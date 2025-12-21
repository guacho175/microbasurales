import { conectarFiltros } from "./filtros.logic.js";

export function registrarEventosPanel(refs, config, { cargarDenuncias }) {
    const { modalImagenElemento, modalImagen, modalImagenImg, estadoTabs, filtrosForm, recargarBtn } = refs;
    const { estadosUtils } = config;

    function activarTab(estadoObjetivo) {
        if (!estadoObjetivo) {
            estadoObjetivo = estadosUtils.ESTADO_DEFECTO;
        }

        const estadoExiste = Array.from(estadoTabs).some(
            (tab) => tab.dataset.estado === estadoObjetivo
        );

        const estadoActivo = estadoExiste ? estadoObjetivo : estadosUtils.ESTADO_DEFECTO;

        estadoTabs.forEach((tab) => {
            if (tab.dataset.estado === estadoActivo) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });

        refs.estadoPaneles.forEach((panel) => {
            if (panel.dataset.estado === estadoActivo) {
                panel.classList.remove("d-none");
                panel.classList.add("active");
            } else {
                panel.classList.add("d-none");
                panel.classList.remove("active");
            }
        });
    }

    estadoTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            activarTab(tab.dataset.estado);
        });
    });

    if (modalImagenElemento && modalImagenImg && modalImagen) {
        modalImagenElemento.addEventListener("hidden.bs.modal", () => {
            modalImagenImg.src = "";
            modalImagenImg.alt = "Vista ampliada de la denuncia";
        });
    }

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest(".ver-imagen");
        if (!trigger || !modalImagen || !modalImagenImg) {
            return;
        }

        const imagenUrl = trigger.dataset.img;
        if (!imagenUrl) {
            return;
        }

        const caseId = trigger.dataset.case || "";
        modalImagenImg.src = imagenUrl;
        modalImagenImg.alt = caseId
            ? `Imagen ampliada del caso ${caseId}`
            : "Imagen ampliada de la denuncia";
        modalImagen.show();
    });

    conectarFiltros({
        formulario: filtrosForm,
        recargarBtn,
        onFiltrar: (filtros) => cargarDenuncias(filtros),
        obtenerFiltrosActuales: () => ({}),
    });
}
