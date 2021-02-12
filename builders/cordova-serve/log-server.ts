import { red, reset, yellow } from 'colorette';
import * as util from 'util';
import * as WebSocket from 'ws';

export interface ConsoleLogServerMessage {
  category: 'console';
  type: string;
  data: any[];
}

export interface ConsoleLogServerOptions {
  consolelogs: boolean;
  consolelogsPort: number;
}

export function isConsoleLogServerMessage(
  m: any,
): m is ConsoleLogServerMessage {
  return (
    m &&
    typeof m.category === 'string' &&
    typeof m.type === 'string' &&
    m.data &&
    typeof m.data.length === 'number'
  );
}

export async function createConsoleLogServer(
  host: string,
  port: number,
): Promise<WebSocket.Server> {
  const wss = new WebSocket.Server({ host, port });

  wss.on('connection', ws => {
    ws.on('message', data => {
      let msg;

      try {
        data = data.toString();
        msg = JSON.parse(data);
      } catch (e) {
        process.stderr.write(
          `Error parsing JSON message from client: "${data}" ${red(
            e.stack ? e.stack : e,
          )}\n`,
        );
        return;
      }

      if (!isConsoleLogServerMessage(msg)) {
        const m = util.inspect(msg, { colors: true });
        process.stderr.write(`Bad format in client message: ${m}\n`);
        return;
      }

      if (msg.category === 'console') {
        let status: ((_: string) => string) | undefined;

        if (msg.type === 'info' || msg.type === 'log') {
          status = reset;
        } else if (msg.type === 'error') {
          status = red;
        } else if (msg.type === 'warn') {
          status = yellow;
        }

        // pretty print objects and arrays (no newlines for arrays)
        msg.data = msg.data.map(d =>
          JSON.stringify(d, undefined, d?.length ? '' : '  '),
        );
        if (status) {
          process.stdout.write(
            `[${status('console.' + msg.type)}]: ${msg.data.join(' ')}\n`,
          );
        } else {
          process.stdout.write(`[console]: ${msg.data.join(' ')}\n`);
        }
      }
    });

    ws.on('error', (err: NodeJS.ErrnoException) => {
      if (err && err.code !== 'ECONNRESET') {
        process.stderr.write(
          `There was an error with the logging stream: ${JSON.stringify(
            err,
          )}\n`,
        );
      }
    });
  });

  wss.on('error', (err: NodeJS.ErrnoException) => {
    process.stderr.write(
      `There was an error with the logging websocket: ${JSON.stringify(err)}\n`,
    );
  });

  return wss;
}
