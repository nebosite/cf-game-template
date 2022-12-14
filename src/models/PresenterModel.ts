import { observable } from "mobx"
import { 
    TemplatoPlayRequestMessage,
    TemplatoPlayerActionMessage,
    TemplatoEndOfRoundMessage, } from "./Messages";
import { ClusterFunGameProps, ISessionHelper } from "clusterfun-client";
import { ITelemetryLogger } from "clusterfun-client";
import { IStorage } from "clusterfun-client";
import { PLAYTIME_MS } from "./GameSettings";
import { ClusterFunPlayer, ClusterfunPresenterModel, PresenterGameState } from "clusterfun-client";
import { GeneralGameState } from "clusterfun-client";
import { ClusterFunGameOverMessage } from "clusterfun-client"; 

export enum TemplatoPlayerStatus {
    Unknown = "Unknown",
    WaitingForStart = "WaitingForStart",
}

export class TemplatoPlayer extends ClusterFunPlayer {
    @observable totalScore = 0;
    @observable status = TemplatoPlayerStatus.Unknown;
    @observable message = "";
    @observable colorStyle= "#ffffff";
    @observable x = 0;
    @observable y = 0;
}

// -------------------------------------------------------------------
// The Game state  
// -------------------------------------------------------------------
export enum TemplatoGameState {
    Playing = "Playing",
    EndOfRound = "EndOfRound",
}

// -------------------------------------------------------------------
// Game events
// -------------------------------------------------------------------
export enum TemplatoGameEvent {
    ResponseReceived = "ResponseReceived",
}

// -------------------------------------------------------------------
// Create the typehelper needed for loading and saving the game
// -------------------------------------------------------------------
export const getTemplatoPresenterTypeHelper = (
    sessionHelper: ISessionHelper, 
    gameProps: ClusterFunGameProps
    ) =>
 {
     return {
        constructType(typeName: string):any {
            switch(typeName)
            {
                case "TemplatoPresenterModel": return new TemplatoPresenterModel( sessionHelper, gameProps.logger, gameProps.storage);
                case "TemplatoPlayer": return new TemplatoPlayer();
                // TODO: add your custom type handlers here
            }
            return null;
        },
        shouldStringify(typeName: string, propertyName: string, object: any):boolean
        {
            if(object instanceof TemplatoPresenterModel)
            {
                const doNotSerializeMe = 
                [
                    "Name_of_presenter_property_to_not_serialize",
                    // TODO:  put names of properties here that should not be part
                    //        of the saved game state  
                ]
                
                if(doNotSerializeMe.indexOf(propertyName) !== -1) return false
            }
            return true;
        },
        reconstitute(typeName: string, propertyName: string, rehydratedObject: any)
        {
            if(typeName === "TemplatoPresenterModel")
            {
                // TODO: if there are any properties that need special treatment on 
                // deserialization, you can override it here.  e.g.:
                // switch(propertyName) {
                //     case "myOservableCollection": 
                //         return observable<ItemType>(rehydratedObject as ItemType[]); 
                // }
            }
            return rehydratedObject;
        }
     }
}


// -------------------------------------------------------------------
// presenter data and logic
// -------------------------------------------------------------------
export class TemplatoPresenterModel extends ClusterfunPresenterModel<TemplatoPlayer> {

    // -------------------------------------------------------------------
    // ctor 
    // -------------------------------------------------------------------
    constructor(
        sessionHelper: ISessionHelper, 
        logger: ITelemetryLogger, 
        storage: IStorage)
    {
        super("Templato", sessionHelper, logger, storage);
        console.log(`Constructing TemplatoPresenterModel ${this.gameState}`)

        sessionHelper.addListener(TemplatoPlayerActionMessage, "answer", this.handlePlayerAction);

        this.minPlayers = 2;
    }

    // -------------------------------------------------------------------
    //  reconstitute - add code here to fix up saved game data that 
    //                 has been loaded after a refresh
    // -------------------------------------------------------------------
    reconstitute() {}


    // -------------------------------------------------------------------
    //  createFreshPlayerEntry
    // -------------------------------------------------------------------
    createFreshPlayerEntry(name: string, id: string): TemplatoPlayer
    {
        const newPlayer = new TemplatoPlayer();
        newPlayer.playerId = id;
        newPlayer.name = name;

        return newPlayer;
    }

    // -------------------------------------------------------------------
    //  prePareFreshGame
    // -------------------------------------------------------------------
    prepareFreshGame = () => {
        this.currentRound = 0;
    }

    // -------------------------------------------------------------------
    //  resetGame
    // -------------------------------------------------------------------
    resetGame() {
        this.players.clear();
        this.gameState = PresenterGameState.Gathering;
        this.currentRound = 0;
    }

    // -------------------------------------------------------------------
    //  run a method to check for a state transition
    // -------------------------------------------------------------------
    handleState()
    {
        if (this.isStageOver) {
            switch(this.gameState) {
                case TemplatoGameState.Playing: 
                    this.finishPlayingRound(); 
                    this.saveCheckpoint();
                    break;
            }
        }
    }
    
    // -------------------------------------------------------------------
    //  finishPlayingRound
    // -------------------------------------------------------------------
    finishPlayingRound() {
        this.gameState = TemplatoGameState.EndOfRound;
        this.sendToEveryone((p,ie) => new TemplatoEndOfRoundMessage({ sender: this.session.personalId, roundNumber: this.currentRound}));
    }

    // -------------------------------------------------------------------
    //  startNextRound
    // -------------------------------------------------------------------
    startNextRound = () =>
    {
        this.gameState = TemplatoGameState.Playing;
        this.timeOfStageEnd = this.gameTime_ms + PLAYTIME_MS;
        this.currentRound++;

        this.players.forEach((p,i) => {
            p.status = TemplatoPlayerStatus.WaitingForStart;
            p.pendingMessage = undefined;
            p.message = "";
            p.colorStyle = "white";
            p.x = .1;
            p.y = i * .1 + .1;
        })

        if(this.currentRound > this.totalRounds) {
            this.gameState = GeneralGameState.GameOver;
            this.sendToEveryone((p,ie) => new ClusterFunGameOverMessage({ sender: this.session.personalId }))
            this.saveCheckpoint();
        }    
        else {
            const payload = { sender: this.session.personalId, customText: "Hi THere", roundNumber: this.currentRound}
            this.sendToEveryone((p,ie) =>  new TemplatoPlayRequestMessage(payload))
            this.saveCheckpoint();
        }

    }

    // -------------------------------------------------------------------
    //  handlePlayerAction
    // -------------------------------------------------------------------
    handlePlayerAction = (message: TemplatoPlayerActionMessage) => {
        const player = this.players.find(p => p.playerId === message.sender);
        if(!player) {
            console.log("No player found for message: " + JSON.stringify(message));
            this.logger.logEvent("Presenter", "AnswerMessage", "Deny");
            return;
        }

        switch(message.action)
        {
            case "ColorChange": 
                this.invokeEvent("ColorChange"); 
                player.colorStyle = message.actionData.colorStyle;
                break;
            case "Message": 
                player.message = message.actionData.text; 
                break;
            case "Tap": 
                player.x = message.actionData.x;
                player.y = message.actionData.y;
                break;
        }

        player.pendingMessage = undefined;

        this.saveCheckpoint();
    }

}
