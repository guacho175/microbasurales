import { crearDenunciaCard, construirDenunciaHtml } from "./tarjetaDenuncia.ui.js";
import { construirCabeceraAccordion } from "./accordionHeader.ui.js";

function construirHeaderHtml(denuncia, helpers) {
    return construirCabeceraAccordion(denuncia, helpers);
}

function construirDetallesHtml(denuncia, helpers) {
    return construirDenunciaHtml(denuncia, helpers);
}

export function construirAccordionPendiente(denuncia, helpers) {
    const headerHtml = construirHeaderHtml(denuncia, helpers);
    const detallesHtml = construirDetallesHtml(denuncia, helpers);

    const article = crearDenunciaCard({
        denuncia,
        headerHtml,
        detallesHtml,
    });

    // Como la lógica de inicialización del formulario y acciones estaba en crearTarjetaDenuncia,
    // necesitamos replicarla aquí si es necesario.
    if (helpers.inicializarFormulario) {
        helpers.inicializarFormulario(article);
    }

    return article;
}

