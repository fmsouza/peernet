import { Server } from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import bodyParser from 'body-parser';

import { Log, Emitter } from '../utils';
import { Address } from './address';
import { Command } from './command';
import { Network } from './network';
import { Peer } from './peer';
import { NetworkOptions } from './types';

export class SignalServer extends Emitter {
  private _server: Express;

  public constructor(private _network: Network, private _options?: NetworkOptions) {
    super();
    this._server = express();
    this._server.use(compression());
    this._server.use(helmet());
    this._server.use(bodyParser.urlencoded({extended: true}));
    this._server.use(bodyParser.json());
    this._server.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'HEAD, OPTIONS, POST');
      res.header('Access-Control-Allow-Origin', '*');
      next();
    });
    this._server.post('/', this._handleRequest.bind(this));
  }

  public listen(): Server {
    const port: number = this._options?.port || 3390;
    const host: string = this._options?.host || '0.0.0.0';

    return this._server.listen(port, host, () => {
      Log.info(`Server started on port ${port}`);
      this._connectInitialPeers(this._options?.initialPeers);
    });
  }

  private async _connectInitialPeers(addresses: string[] = []): Promise<void> {
    Log.info(`Connecting to initial peers list: [${addresses.join('')}]`);
    (await Promise.all(addresses.map(async (peerAddress: string) => {
      const address: Address = new Address(peerAddress);
      try {
        if (!this._network.isAddressKnown(address.toString())) return [];
        const peer: Peer = new Peer(address.toString());
        await this._network.addPeer(peer);
        Log.info(`Requesting new peers to ${address}...`);
        const newPeers: Peer[] = await peer.client.getPeers();
        return newPeers;
      } catch (e) {
        Log.error(`Failed to add ${address} as a peer.`);
        Log.error(e.message);
        return [];
      }
    })))
      .reduce((list, peerList) => list.concat(peerList), [])
      .forEach((peer: Peer) => {
        if (this._network.isAddressKnown(peer.address)) {
          this._network.addPeer(peer);
        }
      });
  }

  private _handleRequest(req: Request, res: Response): void {
    if (!req.body || !req.body.methodName) {
      return res.status(422).send('The method name is missing.') as any; // avoids compiler complains
    }
    const { methodName, params } = req.body;
    const command: Command = new Command(req.ip, params);
    Log.info(`Request received from: ${req.ip} - ${methodName}`);

    this.on(command.end, ({ status, body }) => res.status(status).jsonp(body));
    this.emit(methodName, command);
  }
}