// Basic data types and utilities for darkchat

import { Socket as TCPSocket } from 'net';
import WebSocket from 'isomorphic-ws';
import { ClientStateBuilder } from './builder';
import { Stage } from './stages/stage';

export type integer = number & { __int__: void };

export interface JSONDatum {
  type : string;
  fromPublicKey : string;
  toPublicKey? : string | null;
  msg? : string | null;
  [key: string]: string | null | undefined;
}

export type JSONObject = {
  [key: string]: string | null | undefined;
}

export type DarkChatSocket = WebSocket | TCPSocket

/* eslint-disable no-unused-vars */
export type StageCreator = (parent: ClientStateBuilder) => Stage
export type DarkChatSocketCreator = () => DarkChatSocket

export type StageChangeListener = (oldStage: Stage, newStage: Stage) => void
export type DatumListener = (datum: JSONDatum) => void
export type MessageListener = (message: string) => void
/* eslint-enable no-unused-vars */
