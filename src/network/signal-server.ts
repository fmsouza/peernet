import { Server } from "http";
import express, { Express, Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import bodyParser from "body-parser";

import { Command } from "../common";
import { Log } from "../utils";

import { Network } from "./network";
import { NetworkOptions } from "./types";
import { NetworkSignals } from "./signals";
import { Peer } from "./peer";
import { Address } from "../common";

export class SignalServer {
  private _server: Express;

  public constructor(
    private _network: Network,
    private _options?: NetworkOptions
  ) {
    this._server = express();
    this._server.use(compression());
    this._server.use(helmet());
    this._server.use(bodyParser.urlencoded({ extended: true }));
    this._server.use(bodyParser.json());
    this._server.use((req: Request, res: Response, next: NextFunction) => {
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, X-Identity"
      );
      res.header("Access-Control-Allow-Methods", "HEAD, OPTIONS, POST");
      res.header("Access-Control-Allow-Origin", "*");
      next();
    });
    this._server.post("/", this._handleRequest.bind(this));
  }

  public handleAddressAsPeer(address: string): void {
    const hostAddress: string = this._network.address;
    const id: string = this._network.identity.id;
    this._handleSignal(NetworkSignals.ANNOUNCE_PEER, hostAddress, id, {
      address,
    });
  }

  public listen(): Server {
    const port: number = this._options?.port || 3390;
    const host: string = this._options?.host || "0.0.0.0";

    return this._server.listen(port, host, () => {
      Log.info(`Server started on port ${port}`);
      this._connectInitialPeers(this._options?.initialPeers);
    });
  }

  private _connectInitialPeers(addresses: string[] = []): void {
    Log.info(`Connecting to initial peers list: [${addresses.join(", ")}]`);
    addresses.forEach((address: string) => this.handleAddressAsPeer(address));
  }

  private async _handleRequest(req: Request, res: Response): Promise<void> {
    if (!req.body || !req.body.methodName) {
      return res.status(422).send("The method name is missing.") as any; // avoids compiler complaints
    }
    const identity = (req.headers["x-identity"] || "") as string;
    const { methodName, params } = req.body;
    const address: string = new Address(req.ip).toString();
    this._handleSignal(methodName, address, identity, params, res);
  }

  private async _handleSignal(
    signal: string,
    address: string,
    id: string,
    params?: any,
    response?: Response
  ): Promise<void> {
    const peer: Peer = new Peer(address, id);
    const command: Command = new Command(peer, params);
    if (this._network.identity.id !== id) {
      Log.info(`'${signal}' received from: ${id}`);
    } else {
      Log.info(`'${signal}' self propagated.`);
    }

    if (response) {
      this._network.emitter.end(command, ({ status, body }) =>
        response.status(status).jsonp(body)
      );
    }
    this._network.emitter.emitCommand(signal, command);
  }
}
