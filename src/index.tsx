import { GameTestComponent, GameTestModel, getStorage, MockTelemetryLoggerFactory } from 'clusterfun-client';
import {createRoot} from 'react-dom/client'


const factory = new MockTelemetryLoggerFactory();


const gameTestModel = new GameTestModel(4, getStorage("clusterfun_test"), factory);

const rootContainer = document.getElementById('root') as HTMLElement;
const root = createRoot(rootContainer);
root.render( <GameTestComponent gameTestModel={gameTestModel} /> );            
