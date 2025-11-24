import { formatearCoordenadas, formatearFecha } from "../utils/formatters.js";
import { escapeAttribute, escapeHtml } from "../utils/html.js";

export function construirFormularioGestion(denuncia, helpers) {
    const {
        puedeEditarDenuncia,
        normalizarEstado,
        obtenerOpcionesEstadoParaUsuario,
        obtenerConfigEstado,
        obtenerTextoAyudaEstado,
        esFiscalizador,
    } = helpers;

    if (!puedeEditarDenuncia || !puedeEditarDenuncia(denuncia)) {
        return "";
    }

    const jefeAsignado = denuncia.jefe_cuadrilla_asignado || null;
    const jefeAsignadoTexto = jefeAsignado
        ? `${escapeHtml(jefeAsignado.username)}`
        : "No asignado";
    const cuadrilla =
        denuncia.cuadrilla_asignada || (jefeAsignado && jefeAsignado.username) || "";
    const estadoActual = normalizarEstado(denuncia.estado);
    const estadoOptions = obtenerOpcionesEstadoParaUsuario(denuncia);
    const selectDisabled = estadoOptions.length <= 1;
    const estadoSelectOptions = estadoOptions
        .map((value) => {
            const config = obtenerConfigEstado(value) || {};
            const label = config.label || value;
            const selected = value === estadoActual ? "selected" : "";
            return `<option value="${value}" ${selected}>${label}</option>`;
        })
        .join("");
    const estadoHelpText = obtenerTextoAyudaEstado(estadoActual);
    let reporteCuadrilla = denuncia.reporte_cuadrilla || "";
    if (reporteCuadrilla && typeof reporteCuadrilla === "object") {
        reporteCuadrilla = reporteCuadrilla.comentario || "";
    }
    const puedeEditarReporte = esFiscalizador && estadoActual === "en_gestion";
    const reporteHelpText = puedeEditarReporte
        ? "Adjunta la información entregada por la cuadrilla municipal."
        : "";
    const reporteAtributos = puedeEditarReporte ? "" : "readonly";
    const puedeRechazarDenuncia =
        esFiscalizador && (estadoActual === "pendiente" || estadoActual === "en_gestion");
    const botonRechazoHtml = puedeRechazarDenuncia
        ? `<button type="button" class="btn btn-outline-danger btn-sm w-100 mt-2 btn-rechazar-denuncia" data-denuncia-id="${escapeAttribute(
              denuncia.id
          )}">Rechazar denuncia</button>`
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
            <form class="update-form" data-estado-actual="${estadoActual}">
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

export function construirDenunciaHtml(denuncia, helpers) {
    const {
        normalizarEstado,
        obtenerColorDenuncia,
        obtenerEtiquetaEstado,
        esFiscalizador,
        esAdministrador,
    } = helpers;

    const estadoNormalizado = normalizarEstado(denuncia.estado);
    const color = obtenerColorDenuncia(denuncia);
    const estadoEtiqueta = escapeHtml(obtenerEtiquetaEstado(denuncia));
    const fecha = formatearFecha(denuncia.fecha_creacion);
    const descripcion = escapeHtml(denuncia.descripcion || "Sin descripción registrada");
    const zona = escapeHtml(denuncia.zona || "No asignada");
    const direccionTextual = escapeHtml(
        denuncia.direccion_textual || "Sin referencia del denunciante"
    );
    const coordenadas = formatearCoordenadas(denuncia.latitud, denuncia.longitud);
    const usuario = denuncia.usuario || {};
    const denuncianteNombre = usuario.nombre ? escapeHtml(usuario.nombre) : "Sin registro";
    const denuncianteRol = usuario.rol ? escapeHtml(usuario.rol) : "Sin registro";
    const denuncianteId = usuario.id ? escapeHtml(usuario.id) : "Sin registro";
    const evidenciaDenuncia = denuncia.imagen
        ? `<div><img src="${escapeAttribute(
              denuncia.imagen
          )}" alt="Evidencia de la denuncia" class="img-fluid rounded"></div>`
        : "";
    const evidenciaReporte = denuncia.reporte_cuadrilla?.foto_trabajo
        ? `<div><img src="${escapeAttribute(
              denuncia.reporte_cuadrilla.foto_trabajo
          )}" alt="Foto de trabajo de cuadrilla" class="img-fluid rounded"></div>`
        : "";
    const galeriaHtml = evidenciaDenuncia || evidenciaReporte
        ? `<div class="denuncia-card__gallery">${evidenciaDenuncia}${evidenciaReporte}</div>`
        : `<div class="denuncia-card__gallery denuncia-card__gallery--empty">Sin material fotográfico disponible.</div>`;

    const rechazoDetalleHtml = denuncia.motivo_rechazo
        ? `<div class="alert alert-warning d-flex flex-column gap-1 mt-2">
                <div class="fw-semibold">Rechazo</div>
                <div class="small mb-0">${escapeHtml(denuncia.motivo_rechazo)}</div>
            </div>`
        : "";

    const reporteDetalleHtml = denuncia.reporte_cuadrilla
        ? `<article class="denuncia-card__reporte">
                <p class="mb-1">${escapeHtml(denuncia.reporte_cuadrilla.comentario || "")}</p>
                ${
                    denuncia.reporte_cuadrilla.foto_trabajo
                        ? `<a class="ver-imagen" data-case="${escapeAttribute(
                              denuncia.id
                          )}" data-img="${escapeAttribute(
                              denuncia.reporte_cuadrilla.foto_trabajo
                          )}">Ver imagen enviada</a>`
                        : ""
                }
            </article>`
        : `<p class="text-muted mb-0">Sin reporte adjunto.</p>`;

    const cuadrilla = denuncia.cuadrilla_asignada || "No asignada";
    const jefeAsignado = denuncia.jefe_cuadrilla_asignado || null;
    const jefeAsignadoTexto = jefeAsignado
        ? `${escapeHtml(jefeAsignado.username)} (#${escapeHtml(jefeAsignado.id)})`
        : "No asignado";
    const formularioGestionHtml = construirFormularioGestion(denuncia, helpers);

    const miniatura = denuncia.imagen || denuncia.reporte_cuadrilla?.foto_trabajo;
    const miniaturaHtml = miniatura
        ? `<figure class="denuncia-card__image-large"><img src="${escapeAttribute(
              miniatura
          )}" alt="Imagen de la denuncia ${escapeAttribute(
              denuncia.id
          )}" class="img-fluid"></figure>`
        : `<div class="denuncia-card__image-large denuncia-card__image-large--empty">Sin imagen disponible</div>`;

    const badges = [];
    if (esFiscalizador) {
        badges.push("Fiscalizador");
    }
    if (esAdministrador) {
        badges.push("Administrador");
    }
    const badgesHtml = badges.length
        ? `<div class="d-flex gap-1 flex-wrap">${badges
              .map((badge) => `<span class="badge bg-secondary">${escapeHtml(badge)}</span>`)
              .join("")}</div>`
        : "";

    return `
        <details class="denuncia-card__details" open>
            <summary class="denuncia-card__summary d-flex gap-2 align-items-center">
                <span class="denuncia-card__estado" style="background-color: ${escapeAttribute(
                    color
                )}"></span>
                <div>
                    <div class="fw-semibold">Caso #${escapeHtml(denuncia.id)}</div>
                    <div class="small text-muted">${estadoEtiqueta} • ${fecha}</div>
                    ${badgesHtml}
                </div>
            </summary>
            <div class="denuncia-card__content">
                <div class="denuncia-card__header">
                    ${miniaturaHtml}
                    <div class="denuncia-card__meta">
                        <p class="denuncia-card__description">${descripcion}</p>
                        <div class="denuncia-card__info">
                            <span class="badge" style="background-color:${escapeAttribute(
                                color
                            )};color:#fff">${estadoEtiqueta}</span>
                            <span class="badge bg-light text-dark">Zona: ${zona}</span>
                        </div>
                        <ul class="denuncia-card__attributes">
                            <li><span>Dirección</span><strong>${direccionTextual}</strong></li>
                            <li><span>Coordenadas</span><strong>${
                                coordenadas ? escapeHtml(coordenadas) : "Sin coordenadas disponibles"
                            }</strong></li>
                        </ul>
                    </div>
                </div>
                <div class="denuncia-card__body">
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
                                coordenadas ? escapeHtml(coordenadas) : "Sin coordenadas disponibles"
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

export function crearTarjetaDenuncia(denuncia, helpers, opciones = {}) {
    const { mostrarAcciones = true } = opciones;
    const item = document.createElement("article");
    item.className = "denuncia-card";
    item.dataset.denunciaId = String(denuncia.id);
    item.dataset.id = String(denuncia.id);
    item.innerHTML = construirDenunciaHtml(denuncia, helpers);

    if (mostrarAcciones) {
        const acciones = document.createElement("div");
        acciones.className = "denuncia-card__actions";

        const btnVer = document.createElement("button");
        btnVer.type = "button";
        btnVer.className = "btn btn-outline-secondary btn-xs";
        btnVer.textContent = "Mapa";
        btnVer.addEventListener("click", () => {
            helpers.centrarDenunciaEnMapa(denuncia.id, { enfocarFormulario: false });
        });
        acciones.appendChild(btnVer);

        const btnDetalles = document.createElement("button");
        btnDetalles.type = "button";
        btnDetalles.className = "btn btn-outline-secondary btn-xs";
        btnDetalles.textContent = "Detalles";
        btnDetalles.addEventListener("click", () => {
            const detalle = item.querySelector(".denuncia-card__details");
            if (detalle) {
                detalle.open = !detalle.open;
            }
        });
        acciones.appendChild(btnDetalles);

        if (helpers.puedeEditarDenuncia(denuncia)) {
            const btnEditar = document.createElement("button");
            btnEditar.type = "button";
            btnEditar.className = "btn btn-background btn-xs";
            btnEditar.textContent = "Editar";
            btnEditar.addEventListener("click", () => {
                const detalle = item.querySelector(".denuncia-card__details");
                if (detalle) {
                    detalle.open = true;
                }
                const primerCampo = item.querySelector(
                    ".update-form select, .update-form textarea, .update-form input"
                );
                if (primerCampo) {
                    primerCampo.focus();
                }
            });
            acciones.appendChild(btnEditar);
        }

        item.appendChild(acciones);
    }

    if (helpers.inicializarFormulario) {
        helpers.inicializarFormulario(item);
    }

    return item;
}
