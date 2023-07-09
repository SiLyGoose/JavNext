import { io } from "socket.io-client";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export class SocketWrapper {
	constructor(token, stationId) {
		this.token = token;
		this.stationId = stationId;
        
		// unique socket identification
		this.sid = { t: token, s: stationId };
		this.socket = io(publicRuntimeConfig.SOCKET_URL, { query: this.sid });
	}

	createEmit(op) {
		return (data) => {
			emit(op, JSON.stringify(data));
		};
	}

	emit(op, data = {}) {
		this.socket.emit(op, JSON.stringify({ ...data, ...this.sid }));
	}

	onAny(callback) {
		this.socket.onAny((op, data) => {
			callback(op, JSON.parse(data));
		});
	}

	close() {
		this.socket.offAny();
		this.socket.close();
	}
}
