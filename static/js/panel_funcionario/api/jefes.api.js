export function crearJefesApi({ token, url, precargados = [] }) {
    let cache = precargados.slice();
    let loadingPromise = null;

    async function cargarJefesCuadrilla() {
        if (!url) {
            return cache.slice();
        }

        if (cache.length) {
            return cache.slice();
        }

        if (loadingPromise) {
            return loadingPromise;
        }

        loadingPromise = (async () => {
            try {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    return [];
                }

                const data = await response.json();
                cache = Array.isArray(data) ? data : [];
                return cache.slice();
            } catch (error) {
                return [];
            } finally {
                loadingPromise = null;
            }
        })();

        return loadingPromise;
    }

    return {
        cargarJefesCuadrilla,
    };
}
