import type { ActionResponse, DataResponse } from "./common";

/**
 * Generic action response for preference operations (author + category).
 */
export interface PreferenceActionResponse extends ActionResponse {
  id?: number;
}

/**
 * Generic data response for preference listings.
 */
export type PreferenceDataResponse<T> = DataResponse<T[]>;