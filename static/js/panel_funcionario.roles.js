// static/js/panel_funcionario.roles.js
// Reglas de estados y permisos según rol

import { normalizarEstado } from "./panel_funcionario.utils.js";

const ESTADOS_ORDENADOS = [
    "pendiente",
    "en_gestion",
    "realizado",
    "finalizado",
    "rechazada",
];

/**
 * Devuelve el listado de estados que el usuario puede seleccionar en el form.
 */
export function obtenerOpcionesEstadoParaUsuario(
    denuncia,
    { esFiscalizador = false, esAdministrador = false } = {}
) {
    const estadoActual = normalizarEstado(denuncia.estado);
    const opciones = new Set([estadoActual]);

    // 🔹 Administrador: mantiene acceso completo
    if (esAdministrador) {
        ESTADOS_ORDENADOS.forEach((estado) => opciones.add(estado));
        return Array.from(opciones);
    }

    // 🔹 Fiscalizador: solo puede mover de "pendiente" a "en_gestion"
    if (esFiscalizador) {
        if (estadoActual === "pendiente") {
            opciones.add("en_gestion");
        }
        // Para en_gestion, realizado, finalizado, rechazada → solo lectura
        return Array.from(opciones);
    }

    // Otros roles: solo lectura del estado actual
    return Array.from(opciones);
}

/**
 * Texto de ayuda que aparece bajo el select de estado.
 */
export function obtenerTextoAyudaEstado(
    estadoActual,
    { esFiscalizador = false, esAdministrador = false } = {}
) {
    const estado = normalizarEstado(estadoActual);

    if (esAdministrador) {
        return "";
    }

    if (esFiscalizador) {
        if (estado === "pendiente") {
            return "Puedes asignar la denuncia a un jefe de cuadrilla o rechazarla con un motivo. Una vez en gestión, solo podrás verla.";
        }
        return "Solo lectura: este caso ya fue gestionado o cerrado.";
    }

    return "";
}

/**
 * Define si se muestra o no el formulario de gestión (select de estado, reporte, etc.).
 */
export function puedeEditarDenuncia(
    denuncia,
    { esFiscalizador = false, esAdministrador = false } = {}
) {
    const estado = normalizarEstado(denuncia.estado);

    // 🔹 Administrador: mantiene permisos completos
    if (esAdministrador) return true;

    // 🔹 Fiscalizador: solo edita cuando la denuncia está NUEVA (pendiente)
    if (esFiscalizador) {
        return estado === "pendiente";
    }

    // Otros roles no editan desde este panel
    return false;
}
