import { ClusterFunMessageBase } from "clusterfun-client";

export class TemplatoPlayRequestMessage  extends ClusterFunMessageBase {
    static readonly messageTypeName = "TemplatoPlayRequestMessage";
    customText: string = "";
    roundNumber: number = 0;
    
    // eslint-disable-next-line
    constructor(payload: TemplatoPlayRequestMessage) { super(payload); Object.assign(this, payload);  } 
}

export class TemplatoEndOfRoundMessage  extends ClusterFunMessageBase {
    static readonly messageTypeName = "TemplatoEndOfRoundMessage";
    roundNumber: number = 0;
    
    // eslint-disable-next-line
    constructor(payload: TemplatoEndOfRoundMessage) { super(payload); Object.assign(this, payload);  } 
}

export class TemplatoPlayerActionMessage extends ClusterFunMessageBase {
    static readonly messageTypeName = "TemplatoPlayerActionMessage";
    roundNumber: number = 0;
    action: string = "";
    actionData: any;

    // eslint-disable-next-line
    constructor(payload: TemplatoPlayerActionMessage)  { super(payload); Object.assign(this, payload); } 
}

