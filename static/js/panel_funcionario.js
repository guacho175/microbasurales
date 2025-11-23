// static/js/panel_funcionario.js
// Módulo principal — orquesta mapa, filtros y vistas

import {
    DEFAULT_MARKER_COLOR,
    MOTIVOS_RECHAZO_TEXTOS,
    MOTIVOS_RECHAZO_PREDEFINIDOS,
    normalizarEstado,
    escapeHtml,
    escapeAttribute,
    ordenarDenunciasPorFecha,
    formatearFecha,
    formatearCoordenadas,
    actualizarContador,
    mostrarMensajeGlobal,
} from "./panel_funcionario.utils.js";
import {
    obtenerOpcionesEstadoParaUsuario,
    obtenerTextoAyudaEstado,
    puedeEditarDenuncia,
} from "./panel_funcionario.roles.js";
import {
    enviarActualizacionDenuncia,
    cargarJefesCuadrilla,
    fetchTodasLasDenuncias,
} from "./panel_funcionario.api.js";
import {
    construirOpcionesJefes,
    construirPopup,
    construirFormularioGestion,
    construirDenunciaHtml,
    construirAccordionPendiente,
    renderDenuncia,
    actualizarResumenEstado,
    actualizarTablaPendientes,
} from "./panel_funcionario.templates.js";

(function () {
    const mapaElemento = document.getElementById("mapa-denuncias");
    if (!mapaElemento) return;

    const token = mapaElemento.dataset.token;
    const apiUrl = mapaElemento.dataset.apiUrl;
    const updateUrlTemplate = mapaElemento.dataset.updateUrl || "";
    const updateBaseUrl = updateUrlTemplate.replace(/0\/?$/, "");
    const esFiscalizador = mapaElemento.dataset.esFiscalizador === "true";
    const esAdministrador = mapaElemento.dataset.esAdministrador === "true";
    
    // ========================================================
    // 🔥 CARGA DE JEFES EMBEBIDOS DESDE DJANGO (json_script)
    // ========================================================
    let jefesCuadrillaDatos = [];

    const jefesScript = document.getElementById("jefes-cuadrilla-data");
    if (jefesScript) {
        try {
            const parsed = JSON.parse(jefesScript.textContent || "[]");
            if (Array.isArray(parsed)) {
                jefesCuadrillaDatos = parsed;
            }
            console.log("Jefes embebidos cargados:", jefesCuadrillaDatos);
        } catch (error) {
            console.warn("No se pudieron leer jefes embebidos:", error);
        }
    }

    // ========================================================
    // 🔥 REFRESCAR LOS JEFES DESDE API SI EXISTE LA URL
    // ========================================================
    let rawUrl = mapaElemento.dataset.jefesUrl;
    let jefesCuadrillaUrl =
        rawUrl && rawUrl !== "None" && rawUrl !== "null" && rawUrl !== ""
            ? rawUrl
            : null;

    if (esFiscalizador && jefesCuadrillaUrl) {
        cargarJefesCuadrilla({
            esFiscalizador,
            jefesCuadrillaUrl,
            token,
        })
            .then((lista) => {
                if (Array.isArray(lista) && lista.length > 0) {
                    jefesCuadrillaDatos = lista;
                    console.log("Jefes actualizados via API:", lista);
                }
            })
            .catch((err) =>
                console.warn("Error cargando jefes desde API", err)
            );
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
    const sinDenunciasTemplate = sinDenunciasRow ? sinDenunciasRow.cloneNode(true) : null;

    const estadoTabs = document.querySelectorAll(".estado-tab");
    const estadoPaneles = document.querySelectorAll(".estado-panel");

    if (sinDenunciasRow) sinDenunciasRow.remove();

    const listaEnGestion = document.getElementById("denuncias-en-gestion-list");
    const sinEnGestionElemento = document.getElementById("sin-denuncias-en-gestion");
    const contadorEnGestion = document.getElementById("contador-en-gestion");
    const sinEnGestionTemplate = sinEnGestionElemento
        ? sinEnGestionElemento.cloneNode(true)
        : null;
    if (sinEnGestionElemento) sinEnGestionElemento.remove();

    const listaRealizado = document.getElementById("denuncias-realizado-list");
    const sinRealizadoElemento = document.getElementById("sin-denuncias-realizado");
    const contadorRealizados = document.getElementById("contador-realizados");
    const sinRealizadoTemplate = sinRealizadoElemento
        ? sinRealizadoElemento.cloneNode(true)
        : null;
    if (sinRealizadoElemento) sinRealizadoElemento.remove();

    const listaFinalizado = document.getElementById("denuncias-finalizado-list");
    const sinFinalizadoElemento = document.getElementById("sin-denuncias-finalizado");
    const contadorFinalizados = document.getElementById("contador-finalizados");
    const sinFinalizadoTemplate = sinFinalizadoElemento
        ? sinFinalizadoElemento.cloneNode(true)
        : null;
    if (sinFinalizadoElemento) sinFinalizadoElemento.remove();

    const listaRechazadas = document.getElementById("denuncias-rechazadas-list");
    const sinRechazadasElemento = document.getElementById("sin-denuncias-rechazadas");
    const contadorRechazadas = document.getElementById("contador-rechazadas");
    const sinRechazadasTemplate = sinRechazadasElemento
        ? sinRechazadasElemento.cloneNode(true)
        : null;
    if (sinRechazadasElemento) sinRechazadasElemento.remove();

    const rechazoModalElement = document.getElementById("modalRechazoDenuncia");
    const rechazoModal =
        rechazoModalElement && window.bootstrap
            ? new window.bootstrap.Modal(rechazoModalElement)
            : null;
    const rechazoForm = document.getElementById("formRechazoDenuncia");
    const rechazoError = document.getElementById("rechazo-error");
    const motivoRechazoSelect = document.getElementById("motivo_rechazo_select");
    const motivoRechazoComentarioWrapper = document.getElementById(
        "motivoRechazoComentarioWrapper"
    );
    const motivoRechazoComentario = document.getElementById(
        "motivo_rechazo_comentario"
    );
    const rechazoDenunciaIdElemento = rechazoModalElement
        ? rechazoModalElement.querySelector("[data-rechazo-denuncia-id]")
        : null;

    let denunciaRechazoActual = null;
    const denunciasPorId = new Map();
    const denunciasPorEstado = {
        pendiente: [],
        en_gestion: [],
        realizado: [],
        finalizado: [],
        rechazada: [],
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

    const estadosMap = new Map(
        estadosConfig.map((estado) => [estado.value, estado])
    );
    const ESTADO_DEFECTO =
        (estadosMap.has("pendiente")
            ? "pendiente"
            : estadosConfig[0] && estadosConfig[0].value) || "pendiente";

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

    function obtenerConfigEstado(valor) {
        return estadosMap.get(normalizarEstado(valor));
    }

    function obtenerColorDenuncia(denuncia) {
        if (denuncia && denuncia.color) return denuncia.color;
        const estado = denuncia ? normalizarEstado(denuncia.estado) : null;
        const config = denuncia ? obtenerConfigEstado(estado) : null;
        return (config && config.color) || DEFAULT_MARKER_COLOR;
    }

    function obtenerEtiquetaEstado(denuncia) {
        if (!denuncia) return "";
        if (denuncia.estado_display) return denuncia.estado_display;
        const config = obtenerConfigEstado(denuncia.estado);
        if (config && config.label) return config.label;
        return denuncia.estado;
    }

    function activarTab(estadoObjetivo) {
        if (!estadoObjetivo) estadoObjetivo = ESTADO_DEFECTO;

        const estadoExiste = Array.from(estadoTabs).some(
            (tab) => tab.dataset.estado === estadoObjetivo
        );

        const estadoActivo = estadoExiste ? estadoObjetivo : ESTADO_DEFECTO;

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

    const map = L.map("mapa-denuncias", {
        scrollWheelZoom: true,
    }).setView([-33.4507, -70.6671], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
    }).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);
    const marcadoresPorId = new Map();
    let filtrosActivos = {};

    function agregarMarcador(denuncia, bounds) {
        if (!denuncia.latitud || !denuncia.longitud) return;

        const color = obtenerColorDenuncia(denuncia);
        const marker = L.circleMarker([denuncia.latitud, denuncia.longitud], {
            radius: 16,
            fillColor: color,
            color: "#ffffff",
            weight: 3,
            fillOpacity: 1,
        });

        marker.bindPopup(construirPopup(denuncia, obtenerColorDenuncia, obtenerEtiquetaEstado));
        markerLayer.addLayer(marker);
        marcadoresPorId.set(Number(denuncia.id), marker);
        bounds.push([denuncia.latitud, denuncia.longitud]);
    }

    function ajustarMapa(bounds) {
        if (!bounds.length) return;
        const leafletBounds = L.latLngBounds(bounds);
        map.fitBounds(leafletBounds, { padding: [10, 10] });
    }

    function actualizarMarcaDeTiempo() {
        if (ultimaActualizacion) {
            ultimaActualizacion.textContent = new Date().toLocaleTimeString("es-CL");
        }
    }

    async function cargarDenuncias(filtros = {}) {
        filtrosActivos = filtros;
        markerLayer.clearLayers();
        marcadoresPorId.clear();
        denunciasPorId.clear();
        Object.keys(denunciasPorEstado).forEach((estado) => {
            denunciasPorEstado[estado] = [];
        });

        try {
            const todas = await fetchTodasLasDenuncias({ apiUrl, token, filtros });

            const bounds = [];
            const pendientes = [];
            const enGestion = [];
            const realizados = [];
            const finalizados = [];
            const rechazadas = [];

            todas.forEach((denuncia) => {
                agregarMarcador(denuncia, bounds);
                denunciasPorId.set(Number(denuncia.id), denuncia);
                const estadoNormalizado = normalizarEstado(denuncia.estado);
                if (estadoNormalizado === "pendiente") {
                    pendientes.push(denuncia);
                } else if (estadoNormalizado === "en_gestion") {
                    enGestion.push(denuncia);
                } else if (estadoNormalizado === "realizado") {
                    realizados.push(denuncia);
                } else if (estadoNormalizado === "finalizado") {
                    finalizados.push(denuncia);
                } else if (estadoNormalizado === "rechazada") {
                    rechazadas.push(denuncia);
                }
            });

            ordenarDenunciasPorFecha(pendientes);
            ordenarDenunciasPorFecha(enGestion);
            ordenarDenunciasPorFecha(realizados);
            ordenarDenunciasPorFecha(finalizados);
            ordenarDenunciasPorFecha(rechazadas);

            denunciasPorEstado.pendiente = pendientes.slice();
            denunciasPorEstado.en_gestion = enGestion.slice();
            denunciasPorEstado.realizado = realizados.slice();
            denunciasPorEstado.finalizado = finalizados.slice();
            denunciasPorEstado.rechazada = rechazadas.slice();

            ajustarMapa(bounds);
            actualizarMarcaDeTiempo();
            renderEstado("pendiente");
            renderEstado("en_gestion");
            renderEstado("realizado");
            renderEstado("finalizado");
            renderEstado("rechazada");
            activarTab(normalizarEstado(filtros.estado));
        } catch (error) {
            console.error(error);
            mostrarMensajeGlobal(
                mapaElemento,
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

    function centrarDenunciaEnMapa(denunciaId, { enfocarFormulario = false } = {}) {
        const marker = marcadoresPorId.get(Number(denunciaId));

        if (!marker) {
            mostrarMensajeGlobal(
                mapaElemento,
                "No encontramos la denuncia seleccionada en el mapa actual.",
                "warning"
            );
            return;
        }

        const latLng = marker.getLatLng();
        map.setView(latLng, Math.max(map.getZoom(), 15), { animate: true });
        marker.openPopup();

        if (enfocarFormulario) {
            setTimeout(() => {
                const popup = marker.getPopup();
                if (!popup) return;
                const popupElement = popup.getElement();
                if (!popupElement) return;
                const primerCampo = popupElement.querySelector(
                    ".update-form select, .update-form input"
                );
                if (primerCampo) primerCampo.focus();
            }, 300);
        }
    }

    function prepararSelectorJefe(contenedor) {
        if (!esFiscalizador) return;
        const wrapper = contenedor.querySelector("[data-selector-jefe]");
        if (!wrapper || wrapper.dataset.ready === "true") return;

        wrapper.dataset.ready = "true";
        const lista = wrapper.querySelector("[data-lista-jefes]");
        const loading = wrapper.querySelector("[data-jefes-loading]");
        const inputJefe = wrapper.querySelector(
            'input[name="jefe_cuadrilla_asignado_id"]'
        );
        const inputCuadrilla = wrapper.querySelector(
            'input[name="cuadrilla_asignada"]'
        );
        const seleccionTexto = wrapper.querySelector("[data-jefe-seleccion]");

        if (!lista) return;

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
            if (!opcion) return;
            const jefeId = Number(opcion.dataset.jefeId);
            const jefe = jefesCuadrillaDatos.find(
                (item) => Number(item.id) === jefeId
            );
            lista
                .querySelectorAll(".jefe-cuadrilla-opcion")
                .forEach((item) => item.classList.remove("active"));
            opcion.classList.add("active");
            actualizarSeleccionVisual(jefe || null);
        });

        lista.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            const opcion = event.target.closest(".jefe-cuadrilla-opcion");
            if (!opcion) return;
            event.preventDefault();
            opcion.click();
        });

        cargarJefesCuadrilla({ esFiscalizador, jefesCuadrillaUrl, token })
            .then((jefes) => {
                jefesCuadrillaDatos = jefes; // cache local para selects
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
                if (loading) loading.classList.add("d-none");
            })
            .catch(() => {
                lista.innerHTML =
                    "<li class='list-group-item text-danger small'>No se pudo cargar la lista de jefes de cuadrilla.</li>";
                lista.classList.remove("d-none");
                if (loading) loading.classList.add("d-none");
            });
    }

    function inicializarFormularioActualizacion(contenedor) {
        if (!contenedor) return;

        const formulario = contenedor.querySelector(".update-form");
        const feedback = contenedor.querySelector(".feedback");
        const wrapperConId =
            contenedor.dataset.id
                ? contenedor
                : contenedor.closest("[data-id], [data-denuncia-id]");
        const denunciaId = wrapperConId
            ? wrapperConId.dataset.id || wrapperConId.dataset.denunciaId
            : null;

        if (!formulario || !denunciaId) return;
        if (formulario.dataset.listenerAttached === "true") return;
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
                esFiscalizador &&
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
                esFiscalizador &&
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
                await enviarActualizacionDenuncia(denunciaId, payload, { token, updateBaseUrl });
                if (feedback) {
                    feedback.textContent = "Cambios guardados correctamente";
                    feedback.className = "feedback mt-2 text-success";
                }
                cargarDenuncias(filtrosActivos);
            } catch (error) {
                console.error(error);
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
        if (botonRechazo && rechazoModal) {
            botonRechazo.addEventListener("click", () => {
                abrirModalRechazo(denunciaId);
            });
        }
    }

    function actualizarResumenEstadoWrapper(
        denuncias,
        contenedor,
        plantillaVacia,
        contadorElemento
    ) {
        actualizarResumenEstado(
            denuncias,
            contenedor,
            plantillaVacia,
            contadorElemento,
            {
                obtenerColorDenuncia,
                obtenerEtiquetaEstado,
                esFiscalizador,
                esAdministrador,
                obtenerConfigEstado,
                centrarDenunciaEnMapa,
                inicializarFormularioActualizacion,
                actualizarContador,
                construirOpcionesJefes,
            }
        );
    }

    function actualizarTablaPendientesWrapper(denuncias) {
        actualizarTablaPendientes(denuncias, {
            listaPendientes,
            sinDenunciasTemplate,
            contadorPendientes,
            esFiscalizador,
            construirAccordionPendiente: (denuncia, construirOpciones) =>
                construirAccordionPendiente(denuncia, construirOpciones),
            inicializarFormularioActualizacion,
            prepararAsignacionPendientes,
            renderDenuncia,
            renderOptions: {
                mostrarAcciones: true,
                obtenerColorDenuncia,
                obtenerEtiquetaEstado,
                esFiscalizador,
                esAdministrador,
                obtenerConfigEstado,
                centrarDenunciaEnMapa,
                inicializarFormularioActualizacion,
                actualizarContador,
                // 🔹 Esta función inyecta la lista real de jefes en el builder de opciones
                construirOpcionesJefes: (_listaIgnorada, selectedId) =>
                    construirOpcionesJefes(jefesCuadrillaDatos, selectedId),
            },

        });
    }

    function renderEstado(estado) {
        const coleccion = denunciasPorEstado[estado] || [];
        if (estado === "pendiente") {
            actualizarTablaPendientesWrapper(coleccion);
            return;
        }
        const config = resumenEstadoConfig[estado];
        if (!config) return;
        actualizarResumenEstadoWrapper(
            coleccion,
            config.contenedor,
            config.plantilla,
            config.contador
        );
    }

    function prepararAsignacionPendientes(contenedor) {
        if (!esFiscalizador) return;

        contenedor.querySelectorAll(".asignar-btn").forEach((boton) => {
            if (boton.dataset.listenerAttached === "true") return;

            boton.dataset.listenerAttached = "true";
            boton.addEventListener("click", async () => {
                const denunciaId = boton.dataset.denunciaId;
                const item = boton.closest(".accordion-item");
                const select = item
                    ? item.querySelector(
                          ".jefe-cuadrilla-select[data-denuncia-id='" +
                              denunciaId +
                              "']"
                      )
                    : null;
                const errorElemento = item
                    ? item.querySelector(
                          "[data-error-denuncia='" + denunciaId + "']"
                      )
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
                    }, { token, updateBaseUrl });
                    mostrarMensajeGlobal(
                        mapaElemento,
                        "Denuncia asignada y marcada en gestión correctamente.",
                        "success"
                    );
                    cargarDenuncias(filtrosActivos);
                } catch (error) {
                    if (errorElemento) {
                        errorElemento.textContent =
                            error.message ||
                            "No se pudo asignar la denuncia en este momento.";
                        errorElemento.classList.remove("d-none");
                    }
                } finally {
                    boton.disabled = false;
                    boton.textContent = textoOriginal;
                }
            });
        });
    }

    function mostrarErrorRechazo(mensaje) {
        if (!rechazoError) return;
        rechazoError.textContent = mensaje;
        rechazoError.classList.remove("d-none");
    }

    function ocultarErrorRechazo() {
        if (!rechazoError) return;
        rechazoError.textContent = "";
        rechazoError.classList.add("d-none");
    }

    function actualizarVisibilidadComentarioRechazo() {
        if (!motivoRechazoSelect || !motivoRechazoComentarioWrapper) return;
        const mostrar = motivoRechazoSelect.value === "otro";
        if (mostrar) {
            motivoRechazoComentarioWrapper.classList.remove("d-none");
            if (motivoRechazoComentario) motivoRechazoComentario.focus();
        } else {
            motivoRechazoComentarioWrapper.classList.add("d-none");
            if (motivoRechazoComentario) {
                motivoRechazoComentario.value = "";
            }
        }
    }

    function construirTextoMotivoRechazo(opcion, comentario) {
        if (!opcion) return "";
        if (opcion === "otro") return (comentario || "").trim();
        return MOTIVOS_RECHAZO_TEXTOS[opcion] || opcion;
    }

    function actualizarMarcadorDenuncia(denuncia) {
        const marker = marcadoresPorId.get(Number(denuncia.id));
        if (!marker) return;
        const color = obtenerColorDenuncia(denuncia);
        marker.setStyle({ fillColor: color });
        const popup = marker.getPopup();
        const nuevoContenido = construirPopup(denuncia, obtenerColorDenuncia, obtenerEtiquetaEstado);
        if (popup) {
            popup.setContent(nuevoContenido);
        } else {
            marker.bindPopup(nuevoContenido);
        }
    }

    function manejarRechazoLocal(denunciaId, motivoFinal) {
        const id = Number(denunciaId);
        const denuncia = denunciasPorId.get(id);
        if (!denuncia) {
            cargarDenuncias(filtrosActivos);
            return;
        }

        const estadoAnterior = normalizarEstado(denuncia.estado);
        denuncia.estado = "rechazada";
        denuncia.estado_display = "Rechazada";
        denuncia.motivo_rechazo = motivoFinal;
        const configRechazada = obtenerConfigEstado("rechazada");
        if (configRechazada && configRechazada.color) {
            denuncia.color = configRechazada.color;
        } else {
            denuncia.color = DEFAULT_MARKER_COLOR;
        }
        denunciasPorId.set(id, denuncia);

        if (denunciasPorEstado[estadoAnterior]) {
            denunciasPorEstado[estadoAnterior] = denunciasPorEstado[
                estadoAnterior
            ].filter((item) => Number(item.id) !== id);
        }

        denunciasPorEstado.rechazada = denunciasPorEstado.rechazada
            .filter((item) => Number(item.id) !== id);
        denunciasPorEstado.rechazada.push(denuncia);
        ordenarDenunciasPorFecha(denunciasPorEstado.rechazada);

        if (denunciasPorEstado[estadoAnterior]) {
            renderEstado(estadoAnterior);
        }
        renderEstado("rechazada");
        actualizarMarcadorDenuncia(denuncia);
        activarTab("rechazada");
    }

    function abrirModalRechazo(denunciaId) {
        if (!rechazoModal) return;
        denunciaRechazoActual = { id: Number(denunciaId) };
        if (rechazoDenunciaIdElemento) {
            rechazoDenunciaIdElemento.textContent = `#${denunciaRechazoActual.id}`;
        }
        if (rechazoForm) rechazoForm.reset();
        ocultarErrorRechazo();
        actualizarVisibilidadComentarioRechazo();
        rechazoModal.show();
    }

    if (motivoRechazoSelect) {
        motivoRechazoSelect.addEventListener(
            "change",
            actualizarVisibilidadComentarioRechazo
        );
        actualizarVisibilidadComentarioRechazo();
    }

    if (rechazoForm && rechazoModal) {
        rechazoForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!denunciaRechazoActual) {
                mostrarErrorRechazo(
                    "No pudimos identificar la denuncia que deseas rechazar."
                );
                return;
            }
            ocultarErrorRechazo();
            const opcion = motivoRechazoSelect
                ? motivoRechazoSelect.value
                : "";
            const comentario = motivoRechazoComentario
                ? motivoRechazoComentario.value
                : "";
            const motivoFinal = construirTextoMotivoRechazo(
                opcion,
                comentario
            );

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
                }, { token, updateBaseUrl });
                rechazoModal.hide();
                denunciaRechazoActual = null;
                mostrarMensajeGlobal(
                    mapaElemento,
                    "La denuncia fue rechazada correctamente.",
                    "success"
                );
                manejarRechazoLocal(denunciaId, motivoFinal);
            } catch (error) {
                console.error(error);
                const mensaje =
                    error.message ||
                    "No se pudo rechazar la denuncia en este momento.";
                mostrarErrorRechazo(mensaje);
            }
        });
    }

    map.on("popupopen", (event) => {
        const popupElement = event.popup.getElement();
        if (!popupElement) return;

        const contenedor = popupElement.querySelector(".popup-denuncia");
        if (!contenedor) return;

        inicializarFormularioActualizacion(contenedor);
    });

    if (modalImagenElemento && modalImagenImg && modalImagen) {
        modalImagenElemento.addEventListener("hidden.bs.modal", () => {
            modalImagenImg.src = "";
            modalImagenImg.alt = "Vista ampliada de la denuncia";
        });
    }

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest(".ver-imagen");
        if (!trigger || !modalImagen || !modalImagenImg) return;

        const imagenUrl = trigger.dataset.img;
        if (!imagenUrl) return;

        const caseId = trigger.dataset.case || "";
        modalImagenImg.src = imagenUrl;
        modalImagenImg.alt = caseId
            ? `Imagen ampliada del caso ${caseId}`
            : "Imagen ampliada de la denuncia";
        modalImagen.show();
    });

    if (filtrosForm) {
        filtrosForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const filtros = {
                estado: filtrosForm.estado.value,
                zona: filtrosForm.zona.value,
                fecha_desde: filtrosForm.fecha_desde.value,
                fecha_hasta: filtrosForm.fecha_hasta.value,
            };
            cargarDenuncias(filtros);
        });
    }

    if (recargarBtn) {
        recargarBtn.addEventListener("click", () => {
            cargarDenuncias(filtrosActivos);
        });
    }

    // Carga inicial
    cargarDenuncias();
})();

// Reemplazar automáticamente cualquier imagen rota por la imagen por defecto
document.addEventListener(
    "error",
    function (event) {
        if (event.target.tagName === "IMG") {
            event.target.src = "/static/images/default.png";
        }
    },
    true
);
