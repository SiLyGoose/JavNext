import { io } from "socket.io-client";

export class SocketWrapper {
	constructor(userId, stationId) {
		this.userId = userId;
		this.stationId = stationId;
        
		// unique socket identification
		this.sid = { u: userId, s: stationId };
		this.socket = io(process.env.NODE_ENV === "production" ? process.env.HOST + process.env.PORT : process.env.SOCKET_URL, { query: this.sid });
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
