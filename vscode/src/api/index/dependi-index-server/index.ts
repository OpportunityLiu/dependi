import { Settings } from "../../../config";
import { UserAgent } from "../../utils";

export async function request<Data>(path: string, init?: RequestInit): Promise<RequestState<Data>> {

  try {
    const response = await fetch(`${Settings.api.url}/${path}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'default',
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        "User-Agent": UserAgent,
        ...init?.headers,
      },
    });

    let error;
    let body;
    const contentType = response.headers.get("Content-Type");

    if (response.status > 0 && response.status < 300) {
      if (response.status !== 204) {
        try {
          if (contentType && contentType.includes("application/json")) {
            body = (await response.json()) as Data;
          } else if (contentType && contentType.includes("text/html")) {
            body = (await response.text()) as unknown as Data;
          } else if (contentType && contentType.includes("application/pdf")) {
            body = (await response.blob()) as unknown as Data;
          }
          else {
            body = await response.text() as unknown as Data; // Fallback to text if content type is unknown
          }
        } catch (e) {
          error = await response.text();
        }
      } else {
        console.info(path, init?.method || 'GET', response.status, response.statusText);
      }
    } else {
      error = await response.text();
      if (error) {
        try {
          error = JSON.parse(error);
          error = error.message || error.error || error;
        } catch (e) {
          console.error(path, init?.method || 'GET', e, response.status, response.statusText);
        }
      }
      console.error(path, init?.method || 'GET', error, response.status, response.statusText);
    }
    return {
      status: response.status,
      statusText: response.statusText,
      body,
      headers: response.headers,
      error,
      isLoading: false,
    };
  } catch (e: any) {
    console.error(path, init?.method || 'GET', e);
    return {
      status: 0,
      statusText: '',
      body: undefined,
      headers: undefined,
      error: (e.message as string) || e + '',
      isLoading: false,
    };
  }
}

export interface RequestState<T> {
  status: number;
  statusText: string;
  body?: T;
  headers?: Headers;
  error?: string;
  isLoading?: boolean;
}
