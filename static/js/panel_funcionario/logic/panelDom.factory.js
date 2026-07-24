import { clonarContenido } from "../utils/dom.js";

export function crearReferenciasDom() {
    const mapaElemento = document.getElementById("mapa-denuncias");
    if (!mapaElemento) {
        return null;
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

    const estadosConfigElement = document.getElementById("estados-config");
    const jefesScript = document.getElementById("jefes-cuadrilla-data");

    return {
        mapaElemento,
        modalImagenElemento,
        modalImagen,
        modalImagenImg,
        ultimaActualizacion,
        filtrosForm,
        recargarBtn,
        listaPendientes,
        sinDenunciasTemplate,
        contadorPendientes,
        estadoTabs,
        estadoPaneles,
        listaEnGestion,
        sinEnGestionTemplate,
        contadorEnGestion,
        listaRealizado,
        sinRealizadoTemplate,
        contadorRealizados,
        listaFinalizado,
        sinFinalizadoTemplate,
        contadorFinalizados,
        listaRechazadas,
        sinRechazadasTemplate,
        contadorRechazadas,
        rechazoModalElement,
        rechazoForm,
        rechazoError,
        motivoRechazoSelect,
        motivoRechazoComentarioWrapper,
        motivoRechazoComentario,
        estadosConfigElement,
        jefesScript,
    };
}
