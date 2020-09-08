import { List } from 'immutable';
import { assert } from 'console';
import { StageCreator, JSONDatum } from './types';
import { Stage } from './stages/stage';
import { ClientState, Client } from './clients/client';
import { Secp256k1KeyPair } from './keys';
import { ConnectionManager } from './connmans/connMan';

// Builder for an immutable client state that
// mutually links with an immutable stage
export class ClientStateBuilder {
    /* eslint-disable no-unused-vars */
    private lazyClientState: ((stage: Stage) => ClientState) | ClientState

    /* eslint-enable no-unused-vars */
    private lazyStage: Stage | StageCreator

    readonly currentStageCreator: StageCreator

    readonly client: Client

    constructor(
      keyPair: Secp256k1KeyPair,
      connectionManager: ConnectionManager,
      stageCreators: List<StageCreator>,
      nextStageCreator: StageCreator | null = null,
      lastUserDatum: JSONDatum,
      client: Client,
    ) {
      /* eslint-disable max-len */
      const currentStageCreator: StageCreator = (nextStageCreator !== null) ? nextStageCreator : stageCreators.first();
      const remainingStageCreators = (nextStageCreator !== null) ? stageCreators : stageCreators.remove(0);
      /* eslint-enable max-len */

      const cs = new ClientState(
        keyPair,
        connectionManager,
        remainingStageCreators,
        lastUserDatum,
        this,
      );
      this.lazyClientState = () => cs;
      this.lazyStage = () => currentStageCreator(this);
      this.currentStageCreator = currentStageCreator
      this.client = client;
    }

    getClientState(): ClientState {
      const result: ClientState = (typeof (this.lazyClientState) === 'function') ? this.lazyClientState(this.getStage()) : this.lazyClientState;
      this.lazyClientState = result;
      return result;
    }

    getStage(): Stage {
      const result: Stage = (typeof (this.lazyStage) === 'function') ? this.lazyStage(this) : this.lazyStage;
      this.lazyStage = result;
      return result;
    }

    startStage() {
      return this.getStage().start(this.getClientState().connectionManager);
    }

    toNextBuilder(lastUserDatum: JSONDatum, _nextStageCreator?: StageCreator): ClientStateBuilder {
      const previousState = this.getClientState();
      const nextStageCreator = _nextStageCreator || previousState.remainingStageCreators.first();

      assert(typeof nextStageCreator === 'function',
        `no remaining stage creators from ${this.getStage().stageName}`)

      /* eslint-disable max-len */
      const remainingStageCreators = _nextStageCreator ? previousState.remainingStageCreators : previousState.remainingStageCreators.remove(0)
      /* eslint-enable max-len */

      const newBuilder = new ClientStateBuilder(
        previousState.keyPair,
        previousState.connectionManager,
        remainingStageCreators,
        nextStageCreator,
        lastUserDatum,
        previousState.builder.client,
      );

      return newBuilder;
    }
}

export default ClientStateBuilder;
