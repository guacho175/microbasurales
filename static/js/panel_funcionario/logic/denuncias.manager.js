import { ordenarDenunciasPorFecha } from "./panel.utils.js";
import { construirAccordionPendiente } from "../ui/accordionPendientes.ui.js";
import { limpiarElemento, actualizarContador, clonarContenido, renderList } from "../utils/dom.js";
import { escapeAttribute, escapeHtml } from "../utils/html.js";
import { crearGestorPendientes } from "./pendientes.logic.js";
import { crearGestorRechazo } from "./rechazo.logic.js";
import { mostrarMensajeGlobal } from "../ui/notificaciones.ui.js";
import { activarTab } from "../ui/panelTabs.ui.js";
import { construirOpcionesJefes, prepararSelectorJefe } from "../ui/selectorJefe.ui.js";
import { inicializarFormularioActualizacion } from "../ui/formularioDenuncia.ui.js";

export function iniciarGestionDenuncias(refs, config) {
    const { mapaElemento, ultimaActualizacion, listaPendientes, sinDenunciasTemplate, contadorPendientes, rechazoModalElement, rechazoForm, motivoRechazoSelect, motivoRechazoComentario, motivoRechazoComentarioWrapper, rechazoError } = refs;
    const { denunciasApi, mapManager, estadosUtils, gestorEstados, roles, jefesCuadrillaDatos, jefesApi, jefesCuadrillaUrl } = config;

    let filtrosActivos = {};
    const denunciasPorId = new Map();
    const denunciasPorEstado = {
        pendiente: [],
        en_gestion: [],
        realizado: [],
        finalizado: [],
        rechazada: [],
    };

    const resumenEstadoConfig = {
        en_gestion: {
            contenedor: refs.listaEnGestion,
            plantilla: refs.sinEnGestionTemplate,
            contador: refs.contadorEnGestion,
        },
        realizado: {
            contenedor: refs.listaRealizado,
            plantilla: refs.sinRealizadoTemplate,
            contador: refs.contadorRealizados,
        },
        finalizado: {
            contenedor: refs.listaFinalizado,
            plantilla: refs.sinFinalizadoTemplate,
            contador: refs.contadorFinalizados,
        },
        rechazada: {
            contenedor: refs.listaRechazadas,
            plantilla: refs.sinRechazadasTemplate,
            contador: refs.contadorRechazadas,
        },
    };

    function limpiarDenuncias() {
        mapManager.limpiar();
        denunciasPorId.clear();
        Object.keys(denunciasPorEstado).forEach((estado) => {
            denunciasPorEstado[estado] = [];
        });
    }

    function renderDenuncias(denuncias, bounds) {
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

    function centrarDenunciaEnMapa(denunciaId, opciones) {
        if (!mapManager.centrarDenunciaEnMapa(denunciaId, opciones)) {
            mostrarMensajeGlobal(
                mapaElemento,
                "No encontramos la denuncia seleccionada en el mapa actual.",
                "warning"
            );
        }
    }

    function inicializarFormularioEnContenedor(contenedor) {
        inicializarFormularioActualizacion(contenedor, {
            roles,
            denunciasApi,
            cargarDenuncias: () => cargarDenuncias(filtrosActivos),
            gestorRechazo,
            denunciasPorId,
            prepararSelectorJefe: (node) => prepararSelectorJefe(node, { roles, jefesCuadrillaUrl, jefesCuadrillaDatos, cargarJefesCuadrilla })
        });
    }

    const helpersComunes = {
        ...estadosUtils,
        ...gestorEstados,
        esFiscalizador: roles.esFiscalizador,
        esAdministrador: roles.esAdministrador,
        centrarDenunciaEnMapa,
        inicializarFormulario: (nodo) => inicializarFormularioEnContenedor(nodo),
        construirOpcionesJefes: (selectedId) => construirOpcionesJefes(jefesCuadrillaDatos, selectedId),
    };

    const gestorPendientes = crearGestorPendientes({
        esFiscalizador: roles.esFiscalizador,
        contenedor: listaPendientes,
        plantillaVacia: sinDenunciasTemplate,
        contador: contadorPendientes,
        helpers: helpersComunes,
        enviarActualizacionDenuncia: (denunciaId, payload) => denunciasApi.enviarActualizacionDenuncia(denunciaId, payload),
        mostrarMensajeGlobal: (mensaje, tipo) => mostrarMensajeGlobal(mapaElemento, mensaje, tipo),
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
        enviarActualizacionDenuncia: (denunciaId, payload) => denunciasApi.enviarActualizacionDenuncia(denunciaId, payload),
        mostrarMensajeGlobal: (mensaje, tipo) => mostrarMensajeGlobal(mapaElemento, mensaje, tipo),
        manejarRechazoLocal,
    });

    function actualizarResumenEstado(denuncias, contenedor, plantillaVacia, contadorElemento) {
        renderList({
            contenedor,
            items: denuncias,
            plantillaVacia,
            contadorElemento,
            renderItem: (denuncia) => construirAccordionPendiente(denuncia, helpersComunes),
        });
    }

    function renderEstado(estado) {
        const coleccion = denunciasPorEstado[estado] || [];
        if (estado === "pendiente") {
            gestorPendientes.renderPendientes(coleccion);
            return;
        }
        const configLocal = resumenEstadoConfig[estado];
        if (!configLocal) {
            return;
        }
        actualizarResumenEstado(
            coleccion,
            configLocal.contenedor,
            configLocal.plantilla,
            configLocal.contador
        );
    }

    function actualizarMarcaDeTiempo() {
        if (ultimaActualizacion) {
            ultimaActualizacion.textContent = new Date().toLocaleTimeString("es-CL");
        }
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
            activarTab(refs, estadosUtils, estadosUtils.normalizarEstado(filtros.estado));
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

    async function cargarJefesCuadrilla() {
        if (!roles.esFiscalizador || !jefesCuadrillaUrl) {
            return [];
        }

        config.jefesCuadrillaDatos = await jefesApi.cargarJefesCuadrilla();
        return config.jefesCuadrillaDatos;
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

    const manager = {
        cargarDenuncias,
        renderDenuncias,
        limpiarDenuncias,
        centrarDenunciaEnMapa,
        inicializarFormularioActualizacion: inicializarFormularioEnContenedor,
        manejarRechazoLocal,
        mostrarMensajeGlobal,
        construirOpcionesJefes,
        prepararSelectorJefe,
        gestorPendientes,
        gestorRechazo,
    };

    cargarDenuncias();

    return manager;
}
