import { normalizarEstado } from "../utils/estados.js";

export function crearDenunciasApi({ apiUrl, token, updateBaseUrl }) {
    function obtenerCSRFToken() {
        const csrfCookie = document.cookie
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("csrftoken="));
        return csrfCookie ? csrfCookie.split("=")[1] : "";
    }

    async function extraerMensajeDeError(respuesta) {
        try {
            const data = await respuesta.json();
            if (data && data.detail) {
                return data.detail;
            }
            if (typeof data === "string") {
                return data;
            }
        } catch (error) {
            // ignore
        }
        return respuesta.statusText || "Error desconocido";
    }

    async function enviarActualizacionDenuncia(denunciaId, payload) {
        const url = `${updateBaseUrl}${denunciaId}/`;
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "X-CSRFToken": obtenerCSRFToken(),
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const mensaje = await extraerMensajeDeError(response);
            throw new Error(
                mensaje || "No se pudo actualizar la denuncia en este momento."
            );
        }
    }

    async function cargarDenuncias(filtros = {}) {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([clave, valor]) => {
            if (valor !== undefined && valor !== null && valor !== "") {
                params.append(clave, valor);
            }
        });

        const response = await fetch(`${apiUrl}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(
                `Error al cargar denuncias (${response.status}: ${response.statusText})`
            );
        }

        const data = await response.json();
        const denuncias = Array.isArray(data) ? data : data.results || [];
        denuncias.forEach((denuncia) => {
            denuncia.estado = normalizarEstado(denuncia.estado);
        });
        return denuncias;
    }

    return {
        cargarDenuncias,
        enviarActualizacionDenuncia,
        extraerMensajeDeError,
    };
}
