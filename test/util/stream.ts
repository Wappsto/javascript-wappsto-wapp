import WS from 'jest-websocket-mock';
import { openStream, streamHelperReset } from '../../src/stream_helpers';
import { stopLogging } from '../../src/index';

let server: WS;
let autoTimer: any;
let answered = 0;

export function after() {
    // console.log('********* TEST DONE **********');
    clearTimeout(autoTimer);
    jest.clearAllMocks();
    openStream.close();
    openStream.reset();
    streamHelperReset();
    server.close();
    WS.clean();
}

export function before() {
    stopLogging();
    console.error = jest.fn();
    openStream.websocketUrl = 'ws://localhost:12345';
}

export function newWServer(autoReply?: boolean) {
    server = new WS('ws://localhost:12345', { jsonProtocol: true });
    answered = 0;
    clearTimeout(autoTimer);
    if (autoReply === true) {
        autoTimer = setInterval(() => {
            if (server.messages.length > answered) {
                answered = sendRpcResponse(server, answered);
            }
        }, 1);
    }
    return server;
}

export function sendRpcResponse(server: WS, offset?: number): number {
    server.messages.forEach((msg) => {
        if (offset) {
            offset -= 1;
            return;
        }
        const obj = msg as unknown as any;
        server.send({
            jsonrpc: '2.0',
            id: obj.id,
            result: {
                value: true,
            },
        });
    });
    return server.messages.length;
}
