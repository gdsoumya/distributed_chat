// Basic data types and utilities for darkchat
'use strict'

import { ClientState } from './client'
import { Stage } from './stage'
import { Secp256k1PublicKey } from './keys'
import { Socket as TCPSocket } from 'net'
import WebSocket from 'isomorphic-ws'

export type integer = number & { __int__: void };

export interface JSONDatum {
  type         : string;
  fromPublicKey: string;
  toPublicKey  : string | null;
  msg          : string;
  [key: string]: string | null;
}

export type StageCreator = (parent: ClientState) => Stage

export type StageChangeListener = (oldStage: Stage, newStage: Stage) => void
export type DatumListener = (datum: JSONDatum) => void

export type DarkChatSocket = WebSocket | TCPSocket