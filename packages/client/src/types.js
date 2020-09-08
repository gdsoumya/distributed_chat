"use strict";
// Basic data types and utilities for darkchat
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageChangeListenerId = void 0;
var StageChangeListenerId = /** @class */ (function () {
    function StageChangeListenerId(preStageName, preStageCount, postStageName, postStageCount) {
        this.preStageName = preStageName;
        this.preStageCount = preStageCount;
        this.postStageName = postStageName;
        this.postStageCount = postStageCount;
    }
    StageChangeListenerId.prototype.toString = function () {
        return "StageId[" + this.preStageName + "-" + this.preStageCount + "]"
            + ("[" + this.postStageName + "-" + this.postStageCount + "]");
    };
    return StageChangeListenerId;
}());
exports.StageChangeListenerId = StageChangeListenerId;
/* eslint-enable no-unused-vars */
//# sourceMappingURL=types.js.map