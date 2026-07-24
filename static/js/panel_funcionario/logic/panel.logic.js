import { crearReferenciasDom } from './panelDom.factory.js';
import { crearConfiguracionPanel } from './panelConfig.js';
import { registrarEventosPanel } from './panelEventos.js';
import { iniciarGestionDenuncias } from './denuncias.manager.js';

export function initPanelFuncionario() {
    const refs = crearReferenciasDom();
    if (!refs) {
        return;
    }

    let manager = {};
    const config = crearConfiguracionPanel(refs, manager);
    manager = iniciarGestionDenuncias(refs, config);

    registrarEventosPanel(refs, config, manager);
}