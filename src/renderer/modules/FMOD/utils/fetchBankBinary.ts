import { MESSAGES } from 'FMOD/constants';

export async function fetchBankBinary(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(MESSAGES.BANK_FETCH_FAILED(url, response.status, response.statusText));
  }
  return new Uint8Array(await response.arrayBuffer());
}
