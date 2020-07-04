// Basic data types and utilities for darkchat
'use strict'

import { Client } from './client'
import { Stage } from './stage'
import { Socket as TCPSocket } from 'net'

export type integer = number & { __int__: void };

export interface JSONDatum {
  type         : string;
  fromPublicKey: string;
  toPublicKey  : string | null;
  msg          : string;
  [key: string]: string | null;
}

export type StageCreator = (parent: Client) => Stage

export type StageChangeListener = (oldStage: Stage, newStage: Stage) => void
export type DatumListener = (datum: JSONDatum) => void

export type DarkChatSocket = WebSocket | TCPSocket