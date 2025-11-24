export function limpiarElemento(elemento) {
    if (elemento) {
        elemento.innerHTML = "";
    }
}

export function clonarContenido(elemento) {
    if (!elemento) {
        return null;
    }
    const copia = elemento.cloneNode(true);
    copia.id = "";
    return copia;
}

export function actualizarContador(elemento, total) {
    if (!elemento) {
        return;
    }
    elemento.textContent = `${total}`;
    elemento.setAttribute("title", `${total} ${total === 1 ? "caso" : "casos"}`);
    elemento.setAttribute("aria-label", `${total} ${total === 1 ? "caso" : "casos"}`);
}
