import { Client } from "../client";

export interface Peer {
  ip: string;
  client: Client;
}