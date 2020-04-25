import { Server } from "http";
import express, { Express, Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import bodyParser from "body-parser";

import { Log, Emitter } from "../utils";
import { Command } from "./command";
import { Network } from "./network";
import { NetworkOptions } from "./types";
import { NetworkSignals } from "./signals";

export class SignalServer extends Emitter {
  private _server: Express;

  public constructor(
    private _network: Network,
    private _options?: NetworkOptions
  ) {
    super();
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
    addresses.forEach((address: string) =>
      this.emit(NetworkSignals.ANNOUNCE_PEER, { address })
    );
  }

  private async _handleRequest(req: Request, res: Response): Promise<void> {
    if (!req.body || !req.body.methodName) {
      return res.status(422).send("The method name is missing.") as any; // avoids compiler complaints
    }
    const identity = (req.headers["X-Identity"] || "") as string;
    const { methodName, params } = req.body;
    const command: Command = new Command(req.ip, identity, params);
    Log.info(`'${methodName}' received from: ${identity}`);

    this.on(await command.getEndSignal(), ({ status, body }) =>
      res.status(status).jsonp(body)
    );
    this.emit(methodName, command);
  }
}
