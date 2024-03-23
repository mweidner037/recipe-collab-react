import { next as A } from "@automerge/automerge";
import {
  BrowserWebSocketClientAdapter,
  FromClientMessage,
} from "@automerge/automerge-repo-network-websocket";

export function getAtPath(doc: unknown, path: A.Prop[]): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let place: any = doc;
  for (const pathPart of path) {
    place = place[pathPart];
  }
  return place;
}

/**
 * Mod of BrowserWebSocketClientAdapter for testing purposes. It permits
 * simulated disconnections, so you can test offline & concurrent behaviors.
 *
 * Internally, when disconnected, this class merely queues messages to send/receive,
 * then releases them when reconnected. It does not actually disconnect
 * the WebSocket.
 *
 * Needed due to https://github.com/automerge/automerge-repo/issues/324
 */
export class TestBrowserWebSocketClientAdapter extends BrowserWebSocketClientAdapter {
  private _testConnected = true;
  private queuedSends: FromClientMessage[] = [];
  private queuedReceives: Uint8Array[] = [];

  set testConnected(value: boolean) {
    if (value === this._testConnected) return;
    this._testConnected = value;

    if (value) {
      // Release queued messages.
      const toSend = this.queuedSends;
      this.queuedSends = [];
      for (const message of toSend) {
        super.send(message);
      }
      const toReceive = this.queuedReceives;
      this.queuedReceives = [];
      for (const message of toReceive) {
        super.receiveMessage(message);
      }
    }
  }

  get testConnected(): boolean {
    return this._testConnected;
  }

  send(message: FromClientMessage): void {
    if (this._testConnected) super.send(message);
    else this.queuedSends.push(message);
  }

  receiveMessage(messageBytes: Uint8Array): void {
    if (this._testConnected) super.receiveMessage(messageBytes);
    else this.queuedReceives.push(messageBytes);
  }
}
