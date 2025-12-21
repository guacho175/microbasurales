export function mostrarMensajeGlobal(anchorElement, mensaje, tipo = "info") {
    const contenedor = document.createElement("div");
    contenedor.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
    contenedor.setAttribute("role", "alert");
    contenedor.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    anchorElement.insertAdjacentElement("afterend", contenedor);
    setTimeout(() => {
        contenedor.remove();
    }, 6000);
}
