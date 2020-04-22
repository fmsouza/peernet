import express, { Express, Request, Response } from 'express';

import { NodeDriver } from '../node';
import { HttpError, Log, Signal } from '../utils';
import { Address } from './address';
import { Network } from './network';

export class SignalServer {
  private _router: Express = express();

  public get router(): Express {
    return this._router;
  }

  public constructor(private _network: Network) {
    this._router.post('/', this._handleRequest.bind(this));
  }

  private async _handleRequest(req: Request, res: Response): Promise<void> {
    try {
      const { methodName, params } = this._extractBodyParams(req);
      Log.info(`Request received from: ${req.ip} - ${methodName}`);
      const response: any = await this._handleRPCRequest(req, methodName, params);
      res.status(200).jsonp(response);
    } catch (e) {
      res.status(e.code || 500).send(e.message);
    }
  }

  private async _handleRPCRequest(req: Request, method: string, params: any): Promise<any> {
    switch (method) {
      case Signal.ANNOUNCE_PEER:
        return this._handleIncomingPeer(req, params);
      case Signal.BROADCAST_DATA:
        return this._handleBroadcastData(req, params);
      case Signal.REQUEST_PEERS:
        return this._handleRequestPeers(req, params);
      case Signal.HANDSHAKE:
        return this._handleHandshake(req, params);
      default:
        return this._handleMethodNotFound();
    }
  }

  private async _handleIncomingPeer(req: Request, params: any): Promise<any> {
    const address: Address = new Address(params.address || req.ip);
    if (!this._network.isAddressValid(address.toString())) return Signal.OK;

    const peer = await this._network.addPeer(address.toString());
    if (peer) {
      await this._network.broadcastPeer(peer);
    }
    return Signal.OK;
  }

  private async _handleRequestPeers(req: Request, params: any): Promise<any> {
    return this._network.peers.map(peer => peer.address);
  }

  private async _handleBroadcastData(req: Request, params: any): Promise<any> {
    const node: NodeDriver = new NodeDriver();
    const { id, data } = params;
    console.log('ID:', id);
    console.log('Has this id?', node.storage?.has(id));
    console.log('Data:', params);
    if (!node.storage?.has(id)) {
      await node.storage?.save(data, id);
      this._network.broadcastData(id, data);
    }
    return Signal.OK;
  }

  private async _handleHandshake(req: Request, params: any): Promise<any> {
    return { ack: 1 };
  }

  private _extractBodyParams(req: Request): { methodName: string, params?: any } {
    if (!req.body || !req.body.methodName) {
      throw new HttpError(422, 'The method name is missing.');
    }
    const { methodName, params } = req.body;
    return { methodName, params: params || {} };
  }

  private _handleMethodNotFound(): any {
    throw new HttpError(404, 'Method name not found.');
  }
}