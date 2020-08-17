'use strict'

import { StageCreator, StageChangeListener } from './types'
import { Stage } from './stages/stage'
import { ClientState, Client } from './clients/client'
import { Secp256k1KeyPair } from './keys'
import { ConnectionManager } from './connmans/connMan'
import { List } from 'immutable'

// Builder for an immutable client state that
// mutually links with an immutable stage
export class ClientStateBuilder {

    private lazyClientState: ((stage: Stage) => ClientState) | ClientState
    private lazyStage: Stage | StageCreator
    readonly client: Client

    constructor(
        keyPair: Secp256k1KeyPair,
        connectionManager: ConnectionManager,
        stageCreators: List<StageCreator>,
        stageChangeListeners: List<StageChangeListener>,
        nextStageCreator: StageCreator | null = null,
        client: Client,
        ) {

        const currentStageCreator: StageCreator = (nextStageCreator !== null) ? nextStageCreator : stageCreators.first()
        const remainingStageCreators = (nextStageCreator !== null) ? stageCreators : stageCreators.remove(0)

        const cs = new ClientState(
            keyPair,
            connectionManager,
            List(),
            remainingStageCreators,
            stageChangeListeners.remove(0),  
            this,    
          )
        this.lazyClientState = () => {
            return cs;
        }
        this.lazyStage = () => {
            return currentStageCreator(this)
        }
        this.client = client
      
    }

    getClientState(): ClientState {
        const result: ClientState = (typeof(this.lazyClientState) === 'function') ? this.lazyClientState(this.getStage()) : this.lazyClientState
        this.lazyClientState = result
        return result
    }

    getStage(): Stage {
        const result: Stage = (typeof(this.lazyStage) === 'function') ? this.lazyStage(this) : this.lazyStage
        this.lazyStage = result
        return result
    }

    startStage() {
        this.getStage().start(this.getClientState().connectionManager)
    }

    toNextBuilder(_nextStageCreator?: StageCreator): ClientStateBuilder {

        const previousState = this.getClientState()
        const nextStageCreator = _nextStageCreator || previousState.remainingStageCreators.first()
        const remainingStageCreators = _nextStageCreator ? previousState.remainingStageCreators.remove(0) : previousState.remainingStageCreators
        const newBuilder = new ClientStateBuilder(
            previousState.keyPair,
            previousState.connectionManager,
            remainingStageCreators,
            previousState.remainingStageChangeListeners.remove(0),
            nextStageCreator,
            previousState.builder.client
        )

        {
            const stageChangeListener: StageChangeListener = previousState.remainingStageChangeListeners.first()
            if (typeof(stageChangeListener) === 'function') {
                stageChangeListener(previousState.builder.getStage(), newBuilder.getStage())
            }

        }

        return newBuilder

    }

}