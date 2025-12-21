import { crearDenunciasApi } from "../api/denuncias.api.js";
import { crearJefesApi } from "../api/jefes.api.js";
import { crearEstadosUtils } from "../utils/estados.js";
import { crearRoles } from "../utils/roles.js";
import { crearGestorEstados } from "./en_gestion.logic.js";
import { crearMapaManager } from "./mapa.logic.js";

export function crearConfiguracionPanel(refs, manager) {
    const { mapaElemento, jefesScript, estadosConfigElement } = refs;

    const token = mapaElemento.dataset.token;
    const apiUrl = mapaElemento.dataset.apiUrl;
    const updateUrlTemplate = mapaElemento.dataset.updateUrl || "";
    const updateBaseUrl = updateUrlTemplate.replace(/0\/?$/, "");
    const roles = crearRoles(mapaElemento.dataset);
    const jefesCuadrillaUrl = mapaElemento.dataset.jefesUrl || "";
    let jefesCuadrillaDatos = [];

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
        onPopupReady: (contenedor) => manager.inicializarFormularioActualizacion(contenedor),
    });

    return {
        token,
        apiUrl,
        updateUrlTemplate,
        updateBaseUrl,
        roles,
        jefesCuadrillaUrl,
        jefesCuadrillaDatos,
        DEFAULT_ESTADOS_CONFIG,
        estadosConfig,
        estadosUtils,
        gestorEstados,
        denunciasApi,
        jefesApi,
        mapManager,
    };
}