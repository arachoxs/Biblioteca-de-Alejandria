interface GeocodingResponse {
  status: string
  results?: Array<{
    place_id?: string
    formatted_address?: string
    types?: string[]
  }>
}

export interface GeocodingResult {
  placeId: string | null
  direccionFormateada: string | null
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodingResult> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error("Falta la API Key de Google Maps.")
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Geocoding API: ${response.status}`)
  }

  const data = (await response.json()) as GeocodingResponse

  if (data.status !== "OK" || !data.results?.[0]) {
    return { placeId: null, direccionFormateada: null }
  }

  const preferredTypes = [
    "street_address",
    "premise",
    "subpremise",
    "route",
    "neighborhood",
    "sublocality",
    "plus_code",
  ]

  const result =
    data.results.find((item) =>
      preferredTypes.some((type) => item.types?.includes(type)),
    ) ?? data.results[0]

  return {
    placeId: result.place_id ?? null,
    direccionFormateada: result.formatted_address ?? null,
  }
}
