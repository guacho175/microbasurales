export function crearRoles(dataset = {}) {
    return {
        esFiscalizador: dataset.esFiscalizador === "true",
        esAdministrador: dataset.esAdministrador === "true",
        esFuncionario: dataset.esFuncionario === "true",
    };
}
