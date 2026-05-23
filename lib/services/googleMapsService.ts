import "server-only"

interface DistanceMatrixRow {
  elements: {
    distance?: { value: number; text: string }
    duration?: { value: number; text: string }
    status: string
  }[]
}

interface DistanceMatrixResponse {
  status: string
  rows: DistanceMatrixRow[]
}

export interface DistanceResult {
  distanciaKm: number
  duracionMin: number
}

export async function getDistanciaOrigenDestino(
  originPlaceId: string,
  destinationPlaceIds: string[],
): Promise<DistanceResult[]> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error("Falta la API Key de Google Maps.")
  }

  if (destinationPlaceIds.length === 0) return []

  const originsParam = `place_id:${originPlaceId}`
  const destinationsParam = destinationPlaceIds
    .map((id) => `place_id:${id}`)
    .join("|")

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsParam}&destinations=${destinationsParam}&key=${apiKey}&language=es`

  console.log("[googleMapsService] URL (key hidden):", url.replace(apiKey, "***"))

  const response = await fetch(url)

  if (!response.ok) {
    console.error("[googleMapsService] HTTP error:", response.status, response.statusText)
    throw new Error(
      `Distance Matrix devolvió ${response.status}: ${response.statusText}`,
    )
  }

  const data = (await response.json()) as DistanceMatrixResponse

  if (data.status !== "OK") {
    const errorMsg =
      (data as unknown as { error_message?: string }).error_message ?? ""
    console.error("[googleMapsService] API error:", data.status, errorMsg)
    throw new Error(
      `Distance Matrix error: ${data.status}${errorMsg ? ` — ${errorMsg}` : ""}`,
    )
  }

  console.log("[googleMapsService] Success:", JSON.stringify(data))
  const elements = data.rows[0]?.elements ?? []

  return elements.map((el) => {
    if (el.status !== "OK") {
      return { distanciaKm: Infinity, duracionMin: Infinity }
    }
    return {
      distanciaKm: Math.round(((el.distance?.value ?? 0) / 1000) * 10) / 10,
      duracionMin: Math.round(((el.duration?.value ?? 0) / 60) * 10) / 10,
    }
  })
}

export function calcularCostoEnvio(distanciaKm: number): number {
  if (distanciaKm <= 0) return 0
  if (distanciaKm <= 5) return 0
  if (distanciaKm <= 15) return 5000
  if (distanciaKm <= 30) return 10000
  return 15000
}
