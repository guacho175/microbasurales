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

export function renderList({
    contenedor,
    items,
    plantillaVacia,
    contadorElemento,
    renderItem,
}) {
    if (!contenedor) return;

    limpiarElemento(contenedor);

    if (!items.length) {
        if (plantillaVacia) {
            const vacio = clonarContenido(plantillaVacia);
            if (vacio) contenedor.appendChild(vacio);
        }
    } else {
        items.forEach((item) => {
            const nodo = renderItem(item);
            if (nodo) contenedor.appendChild(nodo);
        });
    }

    if (contadorElemento) {
        actualizarContador(contadorElemento, items.length);
    }
}

export function renderList({
    contenedor,
    items,
    plantillaVacia,
    contadorElemento,
    renderItem,
}) {
    if (!contenedor) return;

    limpiarElemento(contenedor);

    if (!items.length) {
        if (plantillaVacia) {
            const vacio = clonarContenido(plantillaVacia);
            if (vacio) contenedor.appendChild(vacio);
        }
    } else {
        items.forEach((item) => {
            const nodo = renderItem(item);
            if (nodo) contenedor.appendChild(nodo);
        });
    }

    if (contadorElemento) {
        actualizarContador(contadorElemento, items.length);
    }
}
