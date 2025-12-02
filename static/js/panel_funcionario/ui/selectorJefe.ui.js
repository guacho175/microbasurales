import { escapeAttribute, escapeHtml } from "../utils/html.js";

export function construirOpcionesJefes(jefesCuadrillaDatos, selectedId = "") {
    const opciones = [
        '<option value="">Seleccione jefe de cuadrilla</option>',
    ];
    jefesCuadrillaDatos.forEach((jefe) => {
        const id = jefe.id;
        const nombre = jefe.full_name || jefe.username || id;
        const seleccionado = String(id) === String(selectedId) ? "selected" : "";
        opciones.push(
            `<option value="${escapeAttribute(id)}" ${seleccionado}>${escapeHtml(
                nombre
            )}</option>`
        );
    });
    return opciones.join("");
}

export function prepararSelectorJefe(contenedor, { roles, jefesCuadrillaUrl, jefesCuadrillaDatos, cargarJefesCuadrilla }) {
    if (!roles.esFiscalizador) {
        return;
    }
    const wrapper = contenedor.querySelector("[data-selector-jefe]");
    if (!wrapper || wrapper.dataset.ready === "true") {
        return;
    }
    wrapper.dataset.ready = "true";
    const lista = wrapper.querySelector("[data-lista-jefes]");
    const loading = wrapper.querySelector("[data-jefes-loading]");
    const inputJefe = wrapper.querySelector('input[name="jefe_cuadrilla_asignado_id"]');
    const inputCuadrilla = wrapper.querySelector('input[name="cuadrilla_asignada"]');
    const seleccionTexto = wrapper.querySelector("[data-jefe-seleccion]");

    if (!lista) {
        return;
    }

    if (!jefesCuadrillaUrl) {
        if (loading) {
            loading.textContent =
                "No hay jefes de cuadrilla disponibles para asignar.";
        }
        lista.classList.remove("d-none");
        lista.innerHTML =
            "<li class='list-group-item small text-muted'>No hay jefes de cuadrilla configurados.</li>";
        return;
    }

    function actualizarSeleccionVisual(jefe) {
        if (seleccionTexto) {
            const texto = jefe
                ? `Seleccionado: ${escapeHtml(jefe.username)}`
                : "Seleccionado: No asignado";
            seleccionTexto.textContent = texto;
        }
        if (inputCuadrilla) {
            inputCuadrilla.value = jefe ? jefe.username : "";
        }
        if (inputJefe) {
            inputJefe.value = jefe ? jefe.id : "";
        }
    }

    lista.addEventListener("click", (event) => {
        const opcion = event.target.closest(".jefe-cuadrilla-opcion");
        if (!opcion) {
            return;
        }
        const jefeId = Number(opcion.dataset.jefeId);
        const jefe = jefesCuadrillaDatos.find((item) => Number(item.id) === jefeId);
        lista
            .querySelectorAll(".jefe-cuadrilla-opcion")
            .forEach((item) => item.classList.remove("active"));
        opcion.classList.add("active");
        actualizarSeleccionVisual(jefe || null);
    });

    lista.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }
        const opcion = event.target.closest(".jefe-cuadrilla-opcion");
        if (!opcion) {
            return;
        }
        event.preventDefault();
        opcion.click();
    });

    cargarJefesCuadrilla()
        .then((jefes) => {
            lista.innerHTML = "";
            if (!jefes.length) {
                lista.innerHTML =
                    "<li class='list-group-item small text-muted'>No hay jefes de cuadrilla disponibles.</li>";
            } else {
                const seleccionadoId = inputJefe ? inputJefe.value : "";
                jefes.forEach((jefe) => {
                    const item = document.createElement("li");
                    item.className =
                        "list-group-item list-group-item-action jefe-cuadrilla-opcion d-flex justify-content-between align-items-center";
                    item.dataset.jefeId = jefe.id;
                    item.tabIndex = 0;
                    item.innerHTML = `<span>${escapeHtml(
                        jefe.username
                    )}</span><span class="text-muted small">#${escapeHtml(
                        jefe.id
                    )}</span>`;
                    if (String(jefe.id) === String(seleccionadoId)) {
                        item.classList.add("active");
                    }
                    lista.appendChild(item);
                });
            }
            lista.classList.remove("d-none");
            if (loading) {
                loading.classList.add("d-none");
            }
        })
        .catch(() => {
            lista.innerHTML =
                "<li class='list-group-item text-danger small'>No se pudo cargar la lista de jefes de cuadrilla.</li>";
            lista.classList.remove("d-none");
            if (loading) {
                loading.classList.add("d-none");
            }
        });
}
