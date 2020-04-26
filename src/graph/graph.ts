import { GraphNode } from "./graph-node";
import { GraphOptions } from "./types";

export class Graph {
  public constructor(options?: GraphOptions) {}

  public getNode(path: string[]): Promise<GraphNode> {
    return Promise.resolve(new GraphNode());
  }
}
