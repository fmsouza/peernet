import { GraphNode } from './graph-node';

export interface GraphOptions {}

export class Graph {
  public constructor(options?: GraphOptions) {}

  public getNode(path: string[]): Promise<GraphNode> {
    return Promise.resolve(new GraphNode());
  }
}