import { io } from "socket.io-client";
import getConfig from "next/config";
import { WS_URL } from "../global/util/url";

const { publicRuntimeConfig } = getConfig();

export class SocketWrapper {
	constructor(token, stationId) {
		this.token = token;
		this.stationId = stationId;

		// unique socket identification
		this.sid = { token, stationId };
		this.socket = io(publicRuntimeConfig.SOCKET_URL, { query: this.sid });
	}

	createEmit(op) {
		return (data) => {
			emit(op, JSON.stringify(data));
		};
	}

	// update JavBot with JavStation events
	emit(op, ...data) {
		// this.socket.emit(op, JSON.stringify({ ...data, ...this.sid }));
		fetch(WS_URL(op, this.token, ...data), { method: "POST" });
	}

	emitJSON(op, data, callback) {
		fetch(WS_URL(op), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(callback);
	}

	// update JavStation with JavBot events
	onAny(callback) {
		this.socket.onAny((op, data) => {
			callback(op, data);
		});
	}

	close() {
		this.socket.offAny();
		this.socket.close();
	}
}
