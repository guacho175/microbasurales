export function activarTab(refs, estadosUtils, estadoObjetivo) {
    if (!estadoObjetivo) {
        estadoObjetivo = estadosUtils.ESTADO_DEFECTO;
    }

    const estadoExiste = Array.from(refs.estadoTabs).some(
        (tab) => tab.dataset.estado === estadoObjetivo
    );

    const estadoActivo = estadoExiste ? estadoObjetivo : estadosUtils.ESTADO_DEFECTO;

    refs.estadoTabs.forEach((tab) => {
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
