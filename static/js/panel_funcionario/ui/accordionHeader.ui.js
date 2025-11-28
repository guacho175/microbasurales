export function construirCabeceraAccordion(denuncia) {
    const descripcion = escapeHtml(denuncia.descripcion || "Sin descripción");
    const descripcionCorta =
        descripcion.length > 40
            ? descripcion.slice(0, 40) + "..."
            : descripcion;

    const fechaFormateada = formatearFecha(
        denuncia.fecha_creacion ||
        denuncia.fecha ||
        denuncia.created_at ||
        denuncia.fecha_registro
    );

    // CABECERA PLANA Y SEGURA PARA INSERTAR EN <summary>
    return `Caso #${escapeHtml(denuncia.id)} – ${fechaFormateada} – ${descripcionCorta}`;
}
