// static/js/panel_funcionario.templates.js
// Construcción de HTML para tarjetas, popups y listados

import {
    escapeHtml,
    escapeAttribute,
    formatearFecha,
    formatearCoordenadas,
    MOTIVOS_RECHAZO_PREDEFINIDOS,
} from "./panel_funcionario.utils.js";
import {
    obtenerOpcionesEstadoParaUsuario,
    obtenerTextoAyudaEstado,
    puedeEditarDenuncia,
} from "./panel_funcionario.roles.js";

export function construirAccordionPendiente(denuncia, construirOpcionesJefes) {
    const headingId = `pendiente-heading-${denuncia.id}`;
    const collapseId = `pendiente-collapse-${denuncia.id}`;
    const descripcion = escapeHtml(denuncia.descripcion || "Sin descripción registrada");
    const jefeActual =
        (denuncia.jefe_cuadrilla_asignado && denuncia.jefe_cuadrilla_asignado.id) || "";

    const item = document.createElement("div");
    item.className = "accordion-item";
    item.dataset.id = String(denuncia.id);

    item.innerHTML = `
        <h2 class="accordion-header" id="${headingId}">
            <button class="accordion-button collapsed" type="button"
                data-bs-toggle="collapse"
                data-bs-target="#${collapseId}"
                aria-expanded="false"
                aria-controls="${collapseId}">
                Caso #${escapeHtml(denuncia.id)} - ${descripcion}
            </button>
        </h2>

        <div id="${collapseId}" class="accordion-collapse collapse"
            aria-labelledby="${headingId}"
            data-bs-parent="#pendientes-accordion">

            <div class="accordion-body d-flex flex-column gap-3">

                <div class="denuncia-detalle-preview">
                    <!-- Aquí va la tarjeta HTML completa -->
                </div>

                <div class="d-flex flex-column flex-lg-row gap-2 align-items-lg-center">
                    <select class="form-select jefe-cuadrilla-select" data-denuncia-id="${escapeAttribute(
                        denuncia.id
                    )}">
                        ${construirOpcionesJefes([], jefeActual)}
                    </select>

                    <button class="btn btn-primary asignar-btn"
                        data-denuncia-id="${escapeAttribute(denuncia.id)}">
                        Asignar y marcar en gestión
                    </button>

                    <div class="text-danger small d-none"
                        data-error-denuncia="${escapeAttribute(denuncia.id)}"></div>
                </div>

            </div>
        </div>
    `;

    return item;
}


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

export function construirPopup(denuncia, obtenerColorDenuncia, obtenerEtiquetaEstado) {
    const wrapper = document.createElement("div");
    wrapper.className = "popup-denuncia";
    wrapper.dataset.id = denuncia.id;

    const estadoEtiqueta = escapeHtml(obtenerEtiquetaEstado(denuncia));
    const color = obtenerColorDenuncia(denuncia);
    const fecha = formatearFecha(denuncia.fecha_creacion);
    const denuncianteNombre = escapeHtml(
        (denuncia.usuario && denuncia.usuario.nombre) || "Sin registro"
    );
    const zona = escapeHtml(denuncia.zona || "No asignada");
    const miniaturaFuente = denuncia.imagen
        ? denuncia.imagen
        : denuncia.reporte_cuadrilla && denuncia.reporte_cuadrilla.foto_trabajo
          ? denuncia.reporte_cuadrilla.foto_trabajo
          : null;
    const miniaturaHtml = miniaturaFuente
        ? `<img src="${escapeAttribute(
              miniaturaFuente
          )}" alt="Vista previa del caso ${escapeAttribute(
              denuncia.id
          )}" class="img-fluid rounded" onerror="this.onerror=null;this.src='/media/denuncias/default.png';">`
        : `<div class="denuncia-card__thumb-placeholder">Sin imagen</div>`;

    wrapper.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="fw-semibold">Caso #${escapeHtml(denuncia.id)}</div>
            <span class="badge" style="background-color: ${escapeAttribute(
                color
            )}; color: #fff;">${estadoEtiqueta}</span>
        </div>
        <div class="mb-3 popup-denuncia__thumb">${miniaturaHtml}</div>
        <ul class="list-unstyled mb-0 small">
            <li><strong>Estado:</strong> ${estadoEtiqueta}</li>
            <li><strong>Denunciante:</strong> ${denuncianteNombre}</li>
            <li><strong>Zona:</strong> ${zona}</li>
            <li><strong>Fecha:</strong> ${fecha}</li>
        </ul>
    `;

    return wrapper.outerHTML;
}

export function construirFormularioGestion(denuncia, {
    esFiscalizador,
    esAdministrador,
    obtenerConfigEstado,
    jefesCuadrillaDatos,
}) {
    if (!puedeEditarDenuncia(denuncia, { esFiscalizador, esAdministrador })) {
        return "";
    }

    const jefeAsignado = denuncia.jefe_cuadrilla_asignado || null;
    const jefeAsignadoTexto = jefeAsignado
        ? `${escapeHtml(jefeAsignado.username)}`
        : "No asignado";
    const cuadrilla =
        denuncia.cuadrilla_asignada ||
        (jefeAsignado && jefeAsignado.username) ||
        "";
    const estadoActualConfig = { esFiscalizador, esAdministrador };
    const estadoOptions = obtenerOpcionesEstadoParaUsuario(denuncia, estadoActualConfig);
    const estadoActual = denuncia.estado;
    const selectDisabled = estadoOptions.length <= 1;
    const estadoSelectOptions = estadoOptions
        .map((value) => {
            const config = obtenerConfigEstado(value) || {};
            const label = config.label || value;
            const selected = value === estadoActual ? "selected" : "";
            return `<option value="${value}" ${selected}>${label}</option>`;
        })
        .join("");
    const estadoHelpText = obtenerTextoAyudaEstado(estadoActual, estadoActualConfig);

    let reporteCuadrilla = denuncia.reporte_cuadrilla || "";
    if (reporteCuadrilla && typeof reporteCuadrilla === "object") {
        reporteCuadrilla = reporteCuadrilla.comentario || "";
    }


    const puedeEditarReporte = esFiscalizador && estadoActual === "en_gestion";
    const reporteHelpText = puedeEditarReporte
        ? "Adjunta la información entregada por la cuadrilla municipal."
        : "";
    const reporteAtributos = puedeEditarReporte ? "" : "readonly";

    // 🔹 Solo se puede rechazar cuando la denuncia está NUEVA (pendiente)
    const puedeRechazarDenuncia =
        esFiscalizador && estadoActual === "pendiente";

    const botonRechazoHtml = puedeRechazarDenuncia
        ? `<button type="button" class="btn btn-outline-danger btn-sm w-100 mt-2 btn-rechazar-denuncia" data-denuncia-id="${
            escapeAttribute(denuncia.id)
        }">Rechazar denuncia</button>`
        : "";

    const selectorCuadrilla = esFiscalizador
        ? `
            <div class="mb-2" data-selector-jefe>
                <label class="form-label">Cuadrilla asignada</label>
                <input type="hidden" name="cuadrilla_asignada" value="${escapeAttribute(
                    cuadrilla
                )}">
                <input type="hidden" name="jefe_cuadrilla_asignado_id" value="${
                    jefeAsignado ? escapeAttribute(jefeAsignado.id) : ""
                }">
                <div class="accordion accordion-flush">
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading-jefe-${escapeAttribute(
                            denuncia.id
                        )}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#selector-jefe-${escapeAttribute(
                                denuncia.id
                            )}" aria-expanded="false">
                                Seleccionar jefe de cuadrilla
                            </button>
                        </h2>
                        <div id="selector-jefe-${escapeAttribute(
                            denuncia.id
                        )}" class="accordion-collapse collapse">
                            <div class="accordion-body">
                                <div class="small text-muted mb-2" data-jefe-seleccion>Seleccionado: ${
                                    jefeAsignadoTexto
                                }</div>
                                <div id="lista-jefes">
                                    <div class="text-center small text-muted" data-jefes-loading>Cargando jefes de cuadrilla...</div>
                                    <ul class="list-group list-group-flush d-none" data-lista-jefes></ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
        : `
            <div class="mb-2">
                <label class="form-label">Jefe de cuadrilla asignado</label>
                <p class="form-control-plaintext mb-0">${jefeAsignadoTexto}</p>
            </div>`;

    return `
        <section class="denuncia-card__gestion mt-3">
            <h6 class="mb-2">Gestión del caso</h6>
            <form class="update-form" data-estado-actual="${escapeAttribute(
                denuncia.estado
            )}">
                <div class="mb-2">
                    <label class="form-label">Actualizar estado</label>
                    <select class="form-select form-select-sm" name="estado" ${
                        selectDisabled ? "disabled" : ""
                    }>
                        ${estadoSelectOptions}
                    </select>
                    ${
                        estadoHelpText
                            ? `<div class="form-text text-muted">${estadoHelpText}</div>`
                            : ""
                    }
                </div>
                ${selectorCuadrilla}
                <div class="mb-2 reporte-cuadrilla-group">
                    <label class="form-label">Reporte de cuadrilla</label>
                    <textarea class="form-control form-control-sm" name="reporte_cuadrilla" ${reporteAtributos}>${escapeHtml(
                        reporteCuadrilla
                    )}</textarea>
                    ${
                        reporteHelpText
                            ? `<div class="form-text text-muted">${reporteHelpText}</div>`
                            : ""
                    }
                </div>
                <button type="submit" class="btn btn-sm btn-background w-100">Guardar cambios</button>
            </form>
            ${botonRechazoHtml}
            <div class="feedback mt-2"></div>
        </section>
    `;
}

export function construirDenunciaHtml(denuncia, {
    obtenerColorDenuncia,
    obtenerEtiquetaEstado,
    esFiscalizador,
    esAdministrador,
    obtenerConfigEstado,
}) {
    const color = obtenerColorDenuncia(denuncia);
    const estadoEtiqueta = escapeHtml(obtenerEtiquetaEstado(denuncia));
    const fecha = formatearFecha(denuncia.fecha_creacion);
    const descripcion = escapeHtml(
        denuncia.descripcion || "Sin descripción registrada"
    );
    const zona = escapeHtml(denuncia.zona || "No asignada");
    const direccionTextual = escapeHtml(
        denuncia.direccion_textual || "Sin referencia del denunciante"
    );
    const coordenadas = formatearCoordenadas(
        denuncia.latitud,
        denuncia.longitud
    );
    const usuario = denuncia.usuario || {};
    const denuncianteNombre = usuario.nombre
        ? escapeHtml(usuario.nombre)
        : "Sin registro";
    const denuncianteRol = usuario.rol
        ? escapeHtml(usuario.rol)
        : "Sin registro";
    const denuncianteId =
        usuario.id === 0 || usuario.id
            ? `#${escapeHtml(usuario.id)}`
            : "-";
    const jefeAsignado = denuncia.jefe_cuadrilla_asignado || null;
    const jefeAsignadoTexto = jefeAsignado
        ? `${escapeHtml(jefeAsignado.username)}`
        : "No asignado";
    const cuadrilla = escapeHtml(
        denuncia.cuadrilla_asignada ||
            (jefeAsignado && jefeAsignado.username) ||
            "No asignada"
    );
    const reporte = denuncia.reporte_cuadrilla || null;
    const reporteId = reporte && (reporte.id === 0 || reporte.id)
        ? `#${escapeHtml(reporte.id)}`
        : "-";
    const reporteComentario = escapeHtml(
        (reporte && reporte.comentario) || "Sin comentario registrado"
    );
    const reporteFecha =
        reporte && reporte.fecha_reporte
            ? formatearFecha(reporte.fecha_reporte)
            : "-";
    const jefeCuadrilla = reporte && reporte.jefe_cuadrilla
        ? escapeHtml(
              reporte.jefe_cuadrilla.nombre || "Sin nombre registrado"
          )
        : "Sin registro";
    const evidenciaDenuncia = denuncia.imagen
        ? `<figure class="denuncia-card__image-large"><img src="${escapeAttribute(
              denuncia.imagen
          )}" alt="Evidencia fotográfica de la denuncia" loading="lazy" onerror="this.onerror=null;this.src='/media/denuncias/default.png';"><figcaption>Registro del denunciante</figcaption></figure>`
        : "";
    const evidenciaReporte =
        reporte && reporte.foto_trabajo
            ? `<figure class="denuncia-card__image-large"><img src="${escapeAttribute(
                  reporte.foto_trabajo
              )}" alt="Registro fotográfico de la cuadrilla" loading="lazy" onerror="this.onerror=null;this.src='/media/denuncias/default.png';"><figcaption>Reporte de cuadrilla</figcaption></figure>`
            : "";
    const galeriaHtml = evidenciaDenuncia || evidenciaReporte
        ? `<div class="denuncia-card__gallery">${evidenciaDenuncia}${evidenciaReporte}</div>`
        : `<div class="denuncia-card__gallery denuncia-card__gallery--empty">Sin material fotográfico disponible.</div>`;
    const reporteFotoHtml =
        reporte && reporte.foto_trabajo
            ? `<div class="denuncia-card__report-photo"><img src="${escapeAttribute(
                  reporte.foto_trabajo
              )}" alt="Foto del trabajo de cuadrilla" loading="lazy" onerror="this.onerror=null;this.src='/media/denuncias/default.png';"></div>`
            : "";
    const reporteDetalleHtml = reporte
        ? `<ul class="denuncia-card__detail-list">
                <li><span>ID reporte</span><strong>${reporteId}</strong></li>
                <li><span>Fecha</span><strong>${reporteFecha}</strong></li>
                <li><span>Jefe de cuadrilla</span><strong>${jefeCuadrilla}</strong></li>
                <li><span>Comentario</span><strong>${reporteComentario}</strong></li>
            </ul>
            ${reporteFotoHtml}`
        : `<p class="text-muted mb-0">Sin reporte registrado.</p>`;
    const miniaturaFuente = denuncia.imagen
        ? denuncia.imagen
        : reporte && reporte.foto_trabajo
          ? reporte.foto_trabajo
          : null;
    const miniaturaHtml = miniaturaFuente
        ? `<div class="denuncia-card__thumb-media">
                <img src="${escapeAttribute(
                    miniaturaFuente
                )}" alt="Vista previa del caso ${escapeAttribute(
                    denuncia.id
                )}" loading="lazy" onerror="this.onerror=null;this.src='/media/denuncias/default.png';">
                <button class="btn btn-link btn-sm ver-imagen mt-1" data-img="${escapeAttribute(
                    miniaturaFuente
                )}" data-case="${escapeAttribute(denuncia.id)}">
                    Ampliar imagen
                </button>
            </div>`
        : `<div class="denuncia-card__thumb-placeholder">Sin imagen</div>`;
    const estadoNormalizado = denuncia.estado
        ? denuncia.estado.toString()
        : "";
    const esRechazada = estadoNormalizado === "rechazada";
    const motivoRechazoBruto = (denuncia.motivo_rechazo || "").trim();
    const motivoRechazoHtml = escapeHtml(
        motivoRechazoBruto || "No disponible"
    );
    const estadoMotivoInline =
        esRechazada && motivoRechazoBruto
            ? `<small class="denuncia-card__estado-motivo">Motivo: ${motivoRechazoHtml}</small>`
            : "";
    const comentarioLibreDetalle =
        esRechazada && motivoRechazoBruto
        && !MOTIVOS_RECHAZO_PREDEFINIDOS.has(motivoRechazoBruto)
            ? escapeHtml(motivoRechazoBruto)
            : "No aplica";
    const resumenMotivoRechazoHtml =
        esRechazada && motivoRechazoBruto
            ? `<li class="denuncia-card__summary-item">
                    <span class="denuncia-card__summary-label">Motivo del rechazo</span>
                    <span class="denuncia-card__summary-value">${escapeHtml(
                        motivoRechazoBruto
                    )}</span>
                </li>`
            : "";
    const rechazoDetalleHtml = esRechazada
        ? `<section class="denuncia-card__detail-group">
                <h6>Resumen del rechazo</h6>
                <ul class="denuncia-card__detail-list">
                    <li><span>Motivo del rechazo</span><strong>${motivoRechazoHtml}</strong></li>
                    <li><span>Comentario libre</span><strong>${comentarioLibreDetalle}</strong></li>
                </ul>
            </section>`
        : "";

    const formularioGestionHtml = construirFormularioGestion(denuncia, {
        esFiscalizador,
        esAdministrador,
        obtenerConfigEstado,
        jefesCuadrillaDatos: [], // se completa en el main cuando se prepara el selector
    });

    return `
        <header class="denuncia-card__header">
            <div>
                <div class="denuncia-card__case">
                    <span class="denuncia-card__case-id">Caso #${escapeHtml(
                        denuncia.id
                    )}</span>
                    <span class="denuncia-card__estado" style="background-color: ${escapeAttribute(
                        color
                    )};">${estadoEtiqueta}</span>
                    ${estadoMotivoInline}
                </div>
                <div class="denuncia-card__meta">Reportado el ${fecha}</div>
            </div>
        </header>
        <div class="denuncia-card__summary">
            <div>
                <p class="denuncia-card__description">${descripcion}</p>
                <ul class="denuncia-card__summary-list">
                    <li class="denuncia-card__summary-item">
                        <span class="denuncia-card__summary-label">Zona</span>
                        <span class="denuncia-card__summary-value">${zona}</span>
                    </li>
                    <li class="denuncia-card__summary-item">
                        <span class="denuncia-card__summary-label">Denunciante</span>
                        <span class="denuncia-card__summary-value">${denuncianteNombre}</span>
                    </li>
                    <li class="denuncia-card__summary-item">
                        <span class="denuncia-card__summary-label">Jefe asignado</span>
                        <span class="denuncia-card__summary-value">${jefeAsignadoTexto}</span>
                    </li>
                    ${resumenMotivoRechazoHtml}
                </ul>
            </div>
            <div class="denuncia-card__thumb">
                ${miniaturaHtml}
            </div>
        </div>
        <details class="denuncia-card__details">
            <summary class="denuncia-card__details-toggle"><span>Ver detalles</span></summary>
            <div class="denuncia-card__details-content">
                <div class="denuncia-card__details-grid">
                    <section class="denuncia-card__detail-group">
                        <h6>Datos del denunciante</h6>
                        <ul class="denuncia-card__detail-list">
                            <li><span>Nombre</span><strong>${denuncianteNombre}</strong></li>
                            <li><span>Rol</span><strong>${denuncianteRol}</strong></li>
                            <li><span>ID usuario</span><strong>${denuncianteId}</strong></li>
                        </ul>
                    </section>
                    <section class="denuncia-card__detail-group">
                        <h6>Ubicación y coordenadas</h6>
                        <ul class="denuncia-card__detail-list">
                            <li><span>Coordenadas</span><strong>${
                                coordenadas
                                    ? escapeHtml(coordenadas)
                                    : "Sin coordenadas disponibles"
                            }</strong></li>
                            <li><span>Referencia textual</span><strong>${direccionTextual}</strong></li>
                        </ul>
                    </section>
                    <section class="denuncia-card__detail-group">
                        <h6>Estado de la denuncia</h6>
                        <ul class="denuncia-card__detail-list">
                            <li><span>Estado actual</span><strong>${estadoEtiqueta}</strong></li>
                            <li><span>Cuadrilla asignada</span><strong>${cuadrilla}</strong></li>
                            <li><span>Jefe designado</span><strong>${jefeAsignadoTexto}</strong></li>
                        </ul>
                    </section>
                    <section class="denuncia-card__detail-group">
                        <h6>Reporte de cuadrilla</h6>
                        ${reporteDetalleHtml}
                    </section>
                </div>
                ${rechazoDetalleHtml}
                ${galeriaHtml}
                ${formularioGestionHtml}
            </div>
        </details>
    `;
}

export function renderDenuncia(denuncia, {
    mostrarAcciones = true,
    obtenerColorDenuncia,
    obtenerEtiquetaEstado,
    esFiscalizador,
    esAdministrador,
    obtenerConfigEstado,
    centrarDenunciaEnMapa,
    inicializarFormularioActualizacion,
}) {
    const item = document.createElement("article");
    item.className = "denuncia-card";
    item.dataset.denunciaId = String(denuncia.id);
    item.dataset.id = String(denuncia.id);

    item.innerHTML = construirDenunciaHtml(denuncia, {
        obtenerColorDenuncia,
        obtenerEtiquetaEstado,
        esFiscalizador,
        esAdministrador,
        obtenerConfigEstado,
    });

    if (mostrarAcciones) {
        const acciones = document.createElement("div");
        acciones.className = "denuncia-card__actions";

        const btnVer = document.createElement("button");
        btnVer.type = "button";
        btnVer.className = "btn btn-outline-secondary btn-xs";
        btnVer.textContent = "Mapa";
        btnVer.addEventListener("click", () => {
            centrarDenunciaEnMapa(denuncia.id, { enfocarFormulario: false });
        });
        acciones.appendChild(btnVer);

        const btnDetalles = document.createElement("button");
        btnDetalles.type = "button";
        btnDetalles.className = "btn btn-outline-secondary btn-xs";
        btnDetalles.textContent = "Detalles";
        btnDetalles.addEventListener("click", () => {
            const detalle = item.querySelector(".denuncia-card__details");
            if (detalle) detalle.open = !detalle.open;
        });
        acciones.appendChild(btnDetalles);

        if (puedeEditarDenuncia(denuncia, { esFiscalizador, esAdministrador })) {
            const btnEditar = document.createElement("button");
            btnEditar.type = "button";
            btnEditar.className = "btn btn-background btn-xs";
            btnEditar.textContent = "Editar";
            btnEditar.addEventListener("click", () => {
                const detalle = item.querySelector(".denuncia-card__details");
                if (detalle) detalle.open = true;
                const primerCampo = item.querySelector(
                    ".update-form select, .update-form textarea, .update-form input"
                );
                if (primerCampo) primerCampo.focus();
            });
            acciones.appendChild(btnEditar);
        }

        item.appendChild(acciones);
    }

    inicializarFormularioActualizacion(item);
    return item;
}

export function actualizarResumenEstado(
    denuncias,
    contenedor,
    plantillaVacia,
    contadorElemento,
    renderOptions
) {
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!denuncias.length) {
        if (plantillaVacia) {
            const vacio = plantillaVacia.cloneNode(true);
            vacio.id = "";
            contenedor.appendChild(vacio);
        }
    } else {
        denuncias.forEach((denuncia) => {
            contenedor.appendChild(renderDenuncia(denuncia, renderOptions));
        });
    }

    renderOptions.actualizarContador(contadorElemento, denuncias.length);
}

export function actualizarTablaPendientes(
    denuncias,
    {
        listaPendientes,
        sinDenunciasTemplate,
        contadorPendientes,
        esFiscalizador,
        construirAccordionPendiente,
        inicializarFormularioActualizacion,
        prepararAsignacionPendientes,
        renderDenuncia,
        renderOptions,
    }
) {
    if (!listaPendientes) return;
    listaPendientes.innerHTML = "";

    if (!denuncias.length) {
        if (sinDenunciasTemplate) {
            const vacio = sinDenunciasTemplate.cloneNode(true);
            vacio.id = "";
            listaPendientes.appendChild(vacio);
        }
        renderOptions.actualizarContador(contadorPendientes, denuncias.length);
        return;
    }

    if (!esFiscalizador) {
        denuncias.forEach((denuncia) => {
            listaPendientes.appendChild(renderDenuncia(denuncia, renderOptions));
        });
        renderOptions.actualizarContador(contadorPendientes, denuncias.length);
        return;
    }

    const accordion = document.createElement("div");
    accordion.className = "accordion";
    accordion.id = "pendientes-accordion";

    denuncias.forEach((denuncia) => {
        const item = construirAccordionPendiente(
            denuncia,
            renderOptions.construirOpcionesJefes
        );
        inicializarFormularioActualizacion(item);
        accordion.appendChild(item);
    });

    listaPendientes.appendChild(accordion);
    prepararAsignacionPendientes(accordion);

    renderOptions.actualizarContador(contadorPendientes, denuncias.length);
}
