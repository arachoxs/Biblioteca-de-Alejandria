"use client";
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import Input from "./ui/Input";
import {
  PlaceSuggestion,
  searchGooglePlacesAutocomplete,
} from "../lib/services/googlePlacesService";

function createSessionToken(): string {
  return crypto.randomUUID();
}

interface GoogleAutocompleteProps //Generacion del contrato de los props y sus data type para el componente
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> {
  id: string;
  name: string;
  label: string;
  onPlaceSelect?: (placeId: string) => void; //donde se almacena el id devuelto
  onFormattedAddressSelect?: (address: string) => void; //donde se almacena la direccion formateada
  error?: string | boolean;
  apiKey?: string;
  debounceMs?: number;
  minChars?: number;
  defaultValue?: string;
}

export default function GoogleAutocomplete({
  id,
  name,
  label,
  onPlaceSelect,
  onFormattedAddressSelect,
  required,
  className,
  error = false,
  apiKey,
  debounceMs = 700,
  minChars = 10,
  disabled,
  defaultValue = "",
  ...props
}: GoogleAutocompleteProps) { //inicizliacion del componente
  const [query, setQuery] = useState(defaultValue); 
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]); //array que almacena las sugerencias
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); //oermite definir si se abre el dropdown de sugerencias
  const [sessionToken, setSessionToken] = useState<string>(() => createSessionToken());
  const containerRef = useRef<HTMLDivElement>(null); //referencia al componente
  const userTypedRef = useRef(false); // Rastrea si el cambio de query fue por tipeo manual

  useEffect(() => { //use effect para detectar clicks fuera del componente
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick); //limpieza del event
  }, []);

  useEffect(() => { //use effect para manejar la logica de busqueda de sugerencias
    const input = query.trim(); //el input se da basado en el query

    if (!userTypedRef.current || input.length < minChars || disabled) { //verificacion de restricciones
      setLoading(false);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    let isCancelled = false;

    const timer = setTimeout(async () => { //timer que permite hacer la busqueda despues de un tiempo definido por debounceMs, evitando hacer demasiadas peticiones a la API mientras el usuario escribe
      try {
        setLoading(true);
        setApiError(null);

        const predictions = await searchGooglePlacesAutocomplete({ //se envia el texto al motor de sugerencias
          input,
          sessionToken,
          apiKey,
        });

        if (isCancelled) {
          return;
        }

        setSuggestions(predictions); //sugerencias
        setIsOpen(true); //cuadro de sugerencias abierto
      } catch (err) {
        if (isCancelled) {
          return;
        }

        setSuggestions([]);
        setIsOpen(true);
        setApiError(
          err instanceof Error ? err.message : "No se pudo buscar direcciones.",
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => { //cada que se vuelve a llamar el efect limpia el anterior iniciado para solo sugerir el ultimo y evitar condiciones de carrera
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    query,
    apiKey,
    debounceMs,
    minChars,
    disabled,
    sessionToken,
  ]);

  const hasError = Boolean(error || apiError);
  const providedError = typeof error === "string" ? error : undefined;
  const errorMessage = providedError ?? apiError ?? undefined;
  const inputError: string | boolean = errorMessage ?? hasError;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { //cuando el input cambia
    userTypedRef.current = true; // Solo buscar si fue tipeado
    const value = event.target.value;
    setQuery(value);
    setApiError(null);
    onFormattedAddressSelect?.(value);
    onPlaceSelect?.("");

    if (value.trim().length < minChars) {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (prediction: PlaceSuggestion) => { //cuando se selecciona una sugerencia
    userTypedRef.current = false; // Evitar que la nueva query genere otra búsqueda
    const addressText = prediction.formattedText;

    setQuery(addressText);
    setSuggestions([]);
    setIsOpen(false);
    setApiError(null);

    onPlaceSelect?.(prediction.placeId);
    onFormattedAddressSelect?.(addressText);
    setSessionToken(createSessionToken());
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative">
      <Input
        id={id}
        name={name}
        label={label}
        value={query}
        required={required}
        disabled={disabled}
        autoComplete="off"
        onChange={handleInputChange}
        error={inputError}
        className={className}
        {...props}
      />

      {isOpen && (
        <div className="absolute top-full mt-1 z-20 w-full rounded-lg border border-brand-secondary bg-brand-bg shadow-lg overflow-hidden">
          {loading ? (
            <p className="px-4 py-3 text-sm text-brand-text/70">Buscando direcciones...</p>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((prediction) => ( //se listan tosas las sugerencias obtenidas, cada una con un boton para seleccionarla
                <li key={prediction.placeId}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-brand-text hover:bg-brand-accent/10 transition-colors"
                    onClick={() => handleSelectSuggestion(prediction)}
                  >
                    {prediction.formattedText}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-brand-text/70">No se encontraron sugerencias.</p>
          )}
        </div>
      )}

    </div>
  );
}
