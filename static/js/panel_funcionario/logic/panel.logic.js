import { crearDenunciasApi } from "../api/denuncias.api.js";
import { crearJefesApi } from "../api/jefes.api.js";
import { crearEstadosUtils } from "../utils/estados.js";
import { escapeAttribute, escapeHtml } from "../utils/html.js";
import { clonarContenido, actualizarContador, limpiarElemento } from "../utils/dom.js";
import { crearRoles } from "../utils/roles.js";
import { crearGestorEstados } from "./en_gestion.logic.js";
import { crearMapaManager } from "./mapa.logic.js";
import { crearGestorPendientes } from "./pendientes.logic.js";
import { crearGestorRechazo } from "./rechazo.logic.js";
import { conectarFiltros } from "./filtros.logic.js";
import { crearTarjetaDenuncia } from "../ui/tarjetaDenuncia.ui.js";

export function initPanelFuncionario() {
    const mapaElemento = document.getElementById("mapa-denuncias");
    if (!mapaElemento) {
        return;
    }

    const token = mapaElemento.dataset.token;
    const apiUrl = mapaElemento.dataset.apiUrl;
    const updateUrlTemplate = mapaElemento.dataset.updateUrl || "";
    const updateBaseUrl = updateUrlTemplate.replace(/0\/?$/, "");
    const roles = crearRoles(mapaElemento.dataset);
    const jefesCuadrillaUrl = mapaElemento.dataset.jefesUrl || "";
    let jefesCuadrillaDatos = [];

    const jefesScript = document.getElementById("jefes-cuadrilla-data");
    if (jefesScript) {
        try {
            const parsed = JSON.parse(jefesScript.textContent || "[]");
            if (Array.isArray(parsed)) {
                jefesCuadrillaDatos = parsed;
            }
        } catch (error) {
            console.warn("No se pudieron cargar los jefes de cuadrilla embebidos", error);
        }
    }

    const modalImagenElemento = document.getElementById("modalImagenDenuncia");
    const modalImagen =
        modalImagenElemento && window.bootstrap
            ? new window.bootstrap.Modal(modalImagenElemento)
            : null;
    const modalImagenImg = modalImagenElemento
        ? modalImagenElemento.querySelector("[data-imagen-ampliada]")
        : null;

    const ultimaActualizacion = document.getElementById("ultima-actualizacion");
    const filtrosForm = document.getElementById("filtros-form");
    const recargarBtn = document.getElementById("recargar-btn");
    const listaPendientes = document.getElementById("denuncias-pendientes-list");
    const sinDenunciasRow = document.getElementById("sin-denuncias-pendientes");
    const contadorPendientes = document.getElementById("contador-pendientes");
    const sinDenunciasTemplate = clonarContenido(sinDenunciasRow);

    const estadoTabs = document.querySelectorAll(".estado-tab");
    const estadoPaneles = document.querySelectorAll(".estado-panel");

    if (sinDenunciasRow) {
        sinDenunciasRow.remove();
    }

    const listaEnGestion = document.getElementById("denuncias-en-gestion-list");
    const sinEnGestionElemento = document.getElementById("sin-denuncias-en-gestion");
    const contadorEnGestion = document.getElementById("contador-en-gestion");
    const sinEnGestionTemplate = clonarContenido(sinEnGestionElemento);

    if (sinEnGestionElemento) {
        sinEnGestionElemento.remove();
    }

    const listaRealizado = document.getElementById("denuncias-realizado-list");
    const sinRealizadoElemento = document.getElementById("sin-denuncias-realizado");
    const contadorRealizados = document.getElementById("contador-realizados");
    const sinRealizadoTemplate = clonarContenido(sinRealizadoElemento);

    if (sinRealizadoElemento) {
        sinRealizadoElemento.remove();
    }

    const listaFinalizado = document.getElementById("denuncias-finalizado-list");
    const sinFinalizadoElemento = document.getElementById("sin-denuncias-finalizado");
    const contadorFinalizados = document.getElementById("contador-finalizados");
    const sinFinalizadoTemplate = clonarContenido(sinFinalizadoElemento);

    if (sinFinalizadoElemento) {
        sinFinalizadoElemento.remove();
    }

    const listaRechazadas = document.getElementById("denuncias-rechazadas-list");
    const sinRechazadasElemento = document.getElementById("sin-denuncias-rechazadas");
    const contadorRechazadas = document.getElementById("contador-rechazadas");
    const sinRechazadasTemplate = clonarContenido(sinRechazadasElemento);

    if (sinRechazadasElemento) {
        sinRechazadasElemento.remove();
    }

    const rechazoModalElement = document.getElementById("modalRechazoDenuncia");
    const rechazoForm = document.getElementById("formRechazoDenuncia");
    const rechazoError = document.getElementById("rechazo-error");
    const motivoRechazoSelect = document.getElementById("motivo_rechazo_select");
    const motivoRechazoComentarioWrapper = document.getElementById(
        "motivoRechazoComentarioWrapper"
    );
    const motivoRechazoComentario = document.getElementById(
        "motivo_rechazo_comentario"
    );
    const denunciasPorId = new Map();
    const denunciasPorEstado = {
        pendiente: [],
        en_gestion: [],
        realizado: [],
        finalizado: [],
        rechazada: [],
    };
    let denunciasCargadas = [];
    const resumenEstadoConfig = {
        en_gestion: {
            contenedor: listaEnGestion,
            plantilla: sinEnGestionTemplate,
            contador: contadorEnGestion,
        },
        realizado: {
            contenedor: listaRealizado,
            plantilla: sinRealizadoTemplate,
            contador: contadorRealizados,
        },
        finalizado: {
            contenedor: listaFinalizado,
            plantilla: sinFinalizadoTemplate,
            contador: contadorFinalizados,
        },
        rechazada: {
            contenedor: listaRechazadas,
            plantilla: sinRechazadasTemplate,
            contador: contadorRechazadas,
        },
    };

    const estadosConfigElement = document.getElementById("estados-config");
    const DEFAULT_ESTADOS_CONFIG = [
        { value: "pendiente", label: "Pendiente", color: "#d32f2f" },
        { value: "rechazada", label: "Rechazada", color: "#c62828" },
        { value: "en_gestion", label: "En gestión", color: "#f57c00" },
        { value: "realizado", label: "Realizado", color: "#1976d2" },
        { value: "finalizado", label: "Finalizado", color: "#388e3c" },
    ];

    let estadosConfig = DEFAULT_ESTADOS_CONFIG;
    if (estadosConfigElement) {
        try {
            const parsed = JSON.parse(estadosConfigElement.textContent || "");
            if (Array.isArray(parsed) && parsed.length) {
                estadosConfig = parsed;
            }
        } catch (error) {
            console.warn("No fue posible interpretar la configuración de estados", error);
        }
    }

    const estadosUtils = crearEstadosUtils(estadosConfig);
    const gestorEstados = crearGestorEstados({
        esFiscalizador: roles.esFiscalizador,
        esAdministrador: roles.esAdministrador,
        esFuncionario: roles.esFuncionario,
        normalizarEstado: estadosUtils.normalizarEstado,
        obtenerConfigEstado: estadosUtils.obtenerConfigEstado,
    });

    const denunciasApi = crearDenunciasApi({ apiUrl, token, updateBaseUrl });
    const jefesApi = crearJefesApi({
        token,
        url: jefesCuadrillaUrl,
        precargados: jefesCuadrillaDatos,
    });

    const mapManager = crearMapaManager({
        mapaElemento,
        estadosUtils,
        onPopupReady: (contenedor) => inicializarFormularioActualizacion(contenedor),
    });

    const helpersComunes = {
        ...estadosUtils,
        ...gestorEstados,
        esFiscalizador: roles.esFiscalizador,
        esAdministrador: roles.esAdministrador,
        esFuncionario: roles.esFuncionario,
        centrarDenunciaEnMapa: (id, opciones) => centrarDenunciaEnMapa(id, opciones),
        inicializarFormulario: (nodo) => inicializarFormularioActualizacion(nodo),
        construirOpcionesJefes,
    };

    const gestorPendientes = crearGestorPendientes({
        esFiscalizador: roles.esFiscalizador,
        contenedor: listaPendientes,
        plantillaVacia: sinDenunciasTemplate,
        contador: contadorPendientes,
        helpers: helpersComunes,
        enviarActualizacionDenuncia,
        mostrarMensajeGlobal,
        recargarDenuncias: () => cargarDenuncias(filtrosActivos),
    });

    const gestorRechazo = crearGestorRechazo({
        modalElement: rechazoModalElement,
        formElement: rechazoForm,
        selectMotivo: motivoRechazoSelect,
        comentarioInput: motivoRechazoComentario,
        comentarioWrapper: motivoRechazoComentarioWrapper,
        feedbackElement: rechazoError,
        bootstrap: window.bootstrap,
        enviarActualizacionDenuncia,
        mostrarMensajeGlobal,
        manejarRechazoLocal,
    });

    let filtrosActivos = {};

    function ordenarDenunciasPorFecha(denuncias) {
        denuncias.sort((a, b) => {
            const fechaA = a.fecha_creacion ? new Date(a.fecha_creacion) : null;
            const fechaB = b.fecha_creacion ? new Date(b.fecha_creacion) : null;

            if (fechaA && fechaB) {
                return fechaA - fechaB;
            }

            if (fechaA) {
                return -1;
            }

            if (fechaB) {
                return 1;
            }

            return 0;
        });
    }

    function construirOpcionesJefes(selectedId = "") {
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

    async function cargarJefesCuadrilla() {
        if (!roles.esFiscalizador || !jefesCuadrillaUrl) {
            return [];
        }

        jefesCuadrillaDatos = await jefesApi.cargarJefesCuadrilla();
        return jefesCuadrillaDatos;
    }

    function prepararSelectorJefe(contenedor) {
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

    async function enviarActualizacionDenuncia(denunciaId, payload) {
        await denunciasApi.enviarActualizacionDenuncia(denunciaId, payload);
    }

    function inicializarFormularioActualizacion(contenedor) {
        if (!contenedor) {
            return;
        }

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

        prepararSelectorJefe(contenedor);

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
                await enviarActualizacionDenuncia(denunciaId, payload);
                if (feedback) {
                    feedback.textContent = "Cambios guardados correctamente";
                    feedback.className = "feedback mt-2 text-success";
                }
                cargarDenuncias(filtrosActivos);
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

    function mostrarMensajeGlobal(mensaje, tipo = "info") {
        const contenedor = document.createElement("div");
        contenedor.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
        contenedor.setAttribute("role", "alert");
        contenedor.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;
        mapaElemento.insertAdjacentElement("afterend", contenedor);
        setTimeout(() => {
            contenedor.remove();
        }, 6000);
    }

    function manejarRechazoLocal(denunciaId, motivo) {
        const denuncia = denunciasPorId.get(Number(denunciaId));
        if (!denuncia) {
            return;
        }
        denuncia.estado = "rechazada";
        denuncia.motivo_rechazo = motivo;
        cargarDenuncias(filtrosActivos);
    }

    function actualizarResumenEstado(denuncias, contenedor, plantillaVacia, contadorElemento) {
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
        } else {
            denuncias.forEach((denuncia) => {
                contenedor.appendChild(crearTarjetaDenuncia(denuncia, helpersComunes));
            });
        }

        actualizarContador(contadorElemento, denuncias.length);
    }

    function renderEstado(estado) {
        const coleccion = denunciasPorEstado[estado] || [];
        if (estado === "pendiente") {
            gestorPendientes.renderPendientes(coleccion);
            return;
        }
        const config = resumenEstadoConfig[estado];
        if (!config) {
            return;
        }
        actualizarResumenEstado(
            coleccion,
            config.contenedor,
            config.plantilla,
            config.contador
        );
    }

    function actualizarMarcaDeTiempo() {
        if (ultimaActualizacion) {
            ultimaActualizacion.textContent = new Date().toLocaleTimeString("es-CL");
        }
    }

    function centrarDenunciaEnMapa(denunciaId, opciones) {
        if (!mapManager.centrarDenunciaEnMapa(denunciaId, opciones)) {
            mostrarMensajeGlobal(
                "No encontramos la denuncia seleccionada en el mapa actual.",
                "warning"
            );
        }
    }

    function renderDenuncias(denuncias, bounds) {
        denunciasCargadas = denuncias.slice();
        denuncias.forEach((denuncia) => {
            mapManager.agregarMarcador(denuncia, bounds);
            denunciasPorId.set(Number(denuncia.id), denuncia);
            const estadoNormalizado = estadosUtils.normalizarEstado(denuncia.estado);
            const target = denunciasPorEstado[estadoNormalizado];
            if (target) {
                target.push(denuncia);
            }
        });
        Object.keys(denunciasPorEstado).forEach((estado) => {
            ordenarDenunciasPorFecha(denunciasPorEstado[estado]);
        });
    }

    function limpiarDenuncias() {
        mapManager.limpiar();
        denunciasPorId.clear();
        Object.keys(denunciasPorEstado).forEach((estado) => {
            denunciasPorEstado[estado] = [];
        });
    }

    async function cargarDenuncias(filtros = {}) {
        filtrosActivos = filtros;
        limpiarDenuncias();

        try {
            const bounds = [];
            const denuncias = await denunciasApi.cargarDenuncias(filtros);
            ordenarDenunciasPorFecha(denuncias);
            renderDenuncias(denuncias, bounds);
            mapManager.ajustarMapa(bounds);
            actualizarMarcaDeTiempo();
            renderEstado("pendiente");
            renderEstado("en_gestion");
            renderEstado("realizado");
            renderEstado("finalizado");
            renderEstado("rechazada");
            activarTab(estadosUtils.normalizarEstado(filtros.estado));
        } catch (error) {
            console.error(error);
            mostrarMensajeGlobal(
                "No se pudieron cargar las denuncias. Intenta nuevamente.",
                "danger"
            );
            renderEstado("pendiente");
            renderEstado("en_gestion");
            renderEstado("realizado");
            renderEstado("finalizado");
            renderEstado("rechazada");
        }
    }

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

        estadoPaneles.forEach((panel) => {
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
        obtenerFiltrosActuales: () => filtrosActivos,
    });

    cargarDenuncias();
}
