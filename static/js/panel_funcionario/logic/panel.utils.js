export function ordenarDenunciasPorFecha(denuncias) {
    denuncias.sort((a, b) => {
        const fechaA = a.fecha_creacion ? new Date(a.fecha_creacion) : null;
        const fechaB = b.fecha_creacion ? new Date(b.fecha_creacion) : null;

        if (fechaA && fechaB) {
            return fechaA - fechaB;
        }

        if (fechaA) {
            return -1;
        }

        if (fechaB) {
            return 1;
        }

        return 0;
    });
}
