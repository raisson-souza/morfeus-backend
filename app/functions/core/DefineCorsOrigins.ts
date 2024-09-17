import env from "#start/env";

/** Define as origens permitidas no CORS */
export default function DefineCorsOrigins(): string[] {
    // Captura das origens do env
    const envOrigins = env.get('ORIGINS')

    // Caso nenhuma origem, libera todas as origens
    if (!envOrigins || envOrigins.trim() === "")
        return ["*"]

    // Parseamento das origens
    const origins = envOrigins.split("@")

    // Caso nenhuma origem, libera todas as origens
    if (origins.length === 0)
        return ["*"]

    origins.map(origin => {
        // Caso a origem não termine com "/" será duplicada com esse ajuste
        if (!origin.endsWith("/"))
            origins.push(`${origin}/`)
    })

    return origins
}