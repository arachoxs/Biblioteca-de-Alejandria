const GOOGLE_PLACES_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

export const GOOGLE_PLACES_FIELD_MASK =
  "suggestions.placePrediction.text.text,suggestions.placePrediction.placeId";

export interface PlaceSuggestion {
  placeId: string;
  formattedText: string;
}

interface Suggestion { //como se almacenara la respuesta de google para solo guardar lo escencial, el placeId y el texto formateado
  placePrediction?: {
    placeId?: string;
    text?: {
      text?: string;
    };
  };
}

interface AutocompleteResponse {
  suggestions?: Suggestion[]; //la respuesta es un array de sugerencias de la interfaz sugestion, cada una con un placeId y un texto formateado
}

export interface SearchGooglePlacesParams { //parametros de fetch
  input: string;
  sessionToken?: string;
  apiKey?: string;
  signal?: AbortSignal;
}

function getGooglePlacesApiKey(apiKey?: string): string {
  return (
    apiKey ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    ""
  );
}

export async function searchGooglePlacesAutocomplete(
  params: SearchGooglePlacesParams,
): Promise<PlaceSuggestion[]> {
  const { input, sessionToken, apiKey, signal } = params;

  const resolvedApiKey = getGooglePlacesApiKey(apiKey);

  if (!resolvedApiKey) {
    throw new Error("Falta la API Key de Google Places.");
  }

  const response = await fetch(GOOGLE_PLACES_AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": resolvedApiKey,
      "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      input,
      sessionToken,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Google Places devolvio ${response.status}: ${errorBody || "sin detalles"}`,
    );
  }

  const data = (await response.json()) as AutocompleteResponse;

  return (data.suggestions ?? []) //verifica que la respuesta tenga el objeto suggestions
    .map((suggestion) => {
      const prediction = suggestion.placePrediction;
      if (!prediction?.placeId || !prediction.text?.text) { //si alguno de los dos parametros no esta se retorna null
        return null;
      }

      return { //se abstrae solo lo necesario para la aplicacion, el placeId y el texto formateado, y se asegura que cumpla con la interfaz PlaceSuggestion
        placeId: prediction.placeId,
        formattedText: prediction.text.text,
      } satisfies PlaceSuggestion;
    })
    .filter((prediction): prediction is PlaceSuggestion => {
      return Boolean(prediction);
    });
}
