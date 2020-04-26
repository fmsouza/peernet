import { Peer } from "../network";
import { randomBuffer } from "../utils";

interface CommandResponse {
  status: number;
  body: any;
}

export class Command {
  private _id: Promise<string> = randomBuffer(32).then(buf => buf.toString("hex"));
  private _response: CommandResponse = { status: 200, body: null };

  public constructor(private _peer: Peer, private _data: any = null) {}

  public async getData<T>(): Promise<T> {
    return this._data;
  }

  public async getEndSignal(): Promise<string> {
    const id: string = await this.getId();
    return `${id}:END`;
  }

  public async getId(): Promise<string> {
    return this._id;
  }

  public async getPeer(): Promise<Peer> {
    return this._peer;
  }

  public async getResponse(): Promise<CommandResponse> {
    return this._response;
  }

  public setResponse(status: number, data: any): void {
    this._response.status = status;
    this._response.body = data;
  }
}
