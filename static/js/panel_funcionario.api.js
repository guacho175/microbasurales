// static/js/panel_funcionario.api.js
// Acceso al backend (PATCH, listas, jefes)

import { obtenerCSRFToken, extraerMensajeDeError } from "./panel_funcionario.utils.js";

let jefesCuadrillaCache = [];
let jefesCuadrillaPromise = null;

export async function enviarActualizacionDenuncia(denunciaId, payload, { token, updateBaseUrl }) {
    const csrfToken = obtenerCSRFToken();
    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };
    if (csrfToken) {
        headers["X-CSRFToken"] = csrfToken;
    }

    const respuesta = await fetch(`${updateBaseUrl}${denunciaId}/`, {
        method: "PATCH",
        headers,
        credentials: "same-origin",
        body: JSON.stringify(payload),
    });

    if (!respuesta.ok) {
        const detalle = await extraerMensajeDeError(respuesta);
        throw new Error(detalle);
    }
}

export async function cargarJefesCuadrilla({ esFiscalizador, jefesCuadrillaUrl, token }) {
    if (!esFiscalizador || !jefesCuadrillaUrl) return [];

    if (jefesCuadrillaCache.length) {
        return jefesCuadrillaCache.slice();
    }

    if (jefesCuadrillaPromise) {
        return jefesCuadrillaPromise;
    }

    jefesCuadrillaPromise = (async () => {
        try {
            const response = await fetch(jefesCuadrillaUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                console.error("Error cargando jefes:", response.status);
                return [];
            }
            const data = await response.json();
            jefesCuadrillaCache = Array.isArray(data) ? data : [];
            return jefesCuadrillaCache.slice();
        } catch (error) {
            console.error("Error cargando jefes:", error);
            return [];
        } finally {
            jefesCuadrillaPromise = null;
        }
    })();

    return jefesCuadrillaPromise;
}

export async function fetchTodasLasDenuncias({ apiUrl, token, filtros }) {
    const parametros = new URLSearchParams();
    Object.entries(filtros || {})
        .filter(([, value]) => value)
        .forEach(([clave, valor]) => parametros.append(clave, valor));

    let paginaUrl = new URL(apiUrl);
    paginaUrl.search = parametros.toString();

    const resultados = [];

    while (paginaUrl) {
        const respuesta = await fetch(paginaUrl.toString(), {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            credentials: "same-origin",
        });

        if (!respuesta.ok) {
            throw new Error("No fue posible obtener las denuncias");
        }

        const data = await respuesta.json();
        (data.results || []).forEach((denuncia) => resultados.push(denuncia));

        if (data.next) {
            paginaUrl = new URL(data.next);
        } else {
            paginaUrl = null;
        }
    }

    return resultados;
}
