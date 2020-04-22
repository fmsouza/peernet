import { Url, parse as parseUrl } from 'url';

export class Address {
  private _address: Url;

  public constructor(address: string) {
    this._address = parseUrl(address);
    if (!this._address.protocol) this._address.protocol = 'http:';
    if (!this._address.port) this._address.port = '3390';
  }

  public toString(): string {
    const { path, port, protocol } = this._address;
    return `${protocol}//${path}:${port}/`;
  }
}