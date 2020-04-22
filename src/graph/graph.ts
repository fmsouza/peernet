import { Emitter } from '../utils';
import { GraphNode } from './graph-node';
import { GraphOptions } from './types';

export class Graph extends Emitter {

  public constructor(options?: GraphOptions) {
    super();
  }

  public getNode(path: string[]): Promise<GraphNode> {
    return Promise.resolve(new GraphNode());
  }
}