import fetchRetry, { RequestInitWithRetry } from 'fetch-retry';

export class FetchError extends Error {
  status: number;
  response: Response;
  statusText: string;

  constructor({
    status,
    message,
    response,
    statusText,
  }: {
    message: string;
    status: number;
    statusText: string;
    response: Response;
  }) {
    super(message);
    this.name = 'FetchError';

    this.status = status;
    this.response = response;
    this.statusText = statusText;
  }
}

export async function $fetch(
  info: Parameters<typeof fetch>[0],
  init?: RequestInitWithRetry,
) {
  const fetchWithRetry = fetchRetry(fetch);

  const response = await fetchWithRetry(info, init);
  if (!response.ok) {
    throw new FetchError({
      response,
      status: response.status,
      message: response.statusText,
      statusText: response.statusText,
    });
  }

  return response;
}
