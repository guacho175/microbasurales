export function conectarFiltros({ formulario, recargarBtn, onFiltrar, obtenerFiltrosActuales }) {
    if (formulario) {
        formulario.addEventListener("submit", (event) => {
            event.preventDefault();
            const filtros = {
                estado: formulario.estado.value,
                zona: formulario.zona.value,
                fecha_desde: formulario.fecha_desde.value,
                fecha_hasta: formulario.fecha_hasta.value,
            };
            onFiltrar(filtros);
        });
    }

    if (recargarBtn) {
        recargarBtn.addEventListener("click", () => {
            const filtros = obtenerFiltrosActuales ? obtenerFiltrosActuales() : {};
            onFiltrar(filtros);
        });
    }
}
