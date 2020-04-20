import express, { Express, Request, Response } from 'express';

import { NodeDriver } from '../node';
import { HttpError, Log, Signal } from '../utils';
import { Network } from './network';

export class SignalServer {
  private _router: Express = express();

  public get router(): Express {
    return this._router;
  }

  public constructor(private _network: Network) {
    this._router.post('/', this._handleRequest.bind(this));
  }

  private _handleRequest(req: Request, res: Response): void {
    Log.info(`Request received from: ${req.ip}`);
    try {
      const { methodName, params } = this._extractBodyParams(req);
      const response: any = this._handleRPCRequest(req, methodName, params);
      res.status(200).jsonp(response);
    } catch (e) {
      res.status(e.code || 500).send(e.message);
    }
  }

  private _handleRPCRequest(req: Request, method: string, params: any): void {
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
        this._handleMethodNotFound();
    }
  }

  private _handleIncomingPeer(req: Request, params: any): any {
    const ip: string = params.ip || req.ip;
    const peer = this._network.addPeer(`http://${ip}`);
    if (peer) {
      this._network.broadcastPeer(peer);
    }
    return Signal.OK;
  }

  private _handleRequestPeers(req: Request, params: any): any {
    return this._network.peers;
  }

  private _handleBroadcastData(req: Request, params: any): any {
    const node: NodeDriver = new NodeDriver();
    node.storage?.save(params);
    this._network.broadcastData(params);
    return Signal.OK;
  }

  private _handleHandshake(req: Request, params: any): any {
    return { ack: 1 };
  }

  private _extractBodyParams(req: Request): { methodName: string, params?: any } {
    if (!req.body || !req.body.methodName) {
      throw new HttpError(422, 'The method name is missing.');
    }
    const { methodName, params } = req.body;
    return { methodName, params };
  }

  private _handleMethodNotFound(): any {
    throw new HttpError(404, 'Method name not found.');
  }
}