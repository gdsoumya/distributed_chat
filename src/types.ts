// Basic data types and utilities for darkchat
'use strict'

import { ClientState } from './clients/client'
import { ClientStateBuilder } from './builder'
import { Stage } from './stages/stage'
import { Secp256k1PublicKey } from './keys'
import { Socket as TCPSocket } from 'net'
import WebSocket from 'isomorphic-ws'

export type integer = number & { __int__: void };

export interface JSONDatum {
  type          : string;
  fromPublicKey : string;
  toPublicKey?  : string | null;
  msg?          : string | null;
  [key: string]: string | null | undefined;
}

export type JSONObject = {
  [key: string]: string | null | undefined;
}

export type StageCreator = (parent: ClientStateBuilder) => Stage
export type DarkChatSocketCreator = () => DarkChatSocket

export type StageChangeListener = (oldStage: Stage, newStage: Stage) => void
export type DatumListener = (datum: JSONDatum) => void
export type MessageListener = (message: string) => void

export type DarkChatSocket = WebSocket | TCPSocket