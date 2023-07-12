require("dotenv-flow").config();
const express = require("express");
const next = require("next");
const http = require("http");
const { Server } = require("socket.io");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const apiPaths = {
	"/v2.api": {
		target: "http://localhost:8080",
		pathRewrite: {
			"^/v2.api": "/v2.api",
		},
		changeOrigin: true,
	},
	"/v2.socket.io": {
		target: "http://localhost:8080",
		// pathRewrite: {
		// 	"^/v2.socket.io": "/v2.socket.io"
		// },
		changeOrigin: true,
		ws: false,
	},
};

const isDevelopment = process.env.NODE_ENV !== "production";

// temporary workaround to retrieve socket connections
const socketConnections = {};

app.prepare()
	.then(() => {
		const server = express();
		const httpServer = http.createServer(server);
		const io = new Server(httpServer);

		// automatically parses data to JSON
		server.use(express.json());

		// Next creates the socket client and sends jAuth credentials (token, stationId, socketId) to JavBot via POST requests
		// JavBot authenticates user with UUID token and processes data before making POST request to /socketEmit and is then
		// handed to JavStation.SocketWrapper to handle via SocketWrapper#onAny
		//
		// TODO: move socket server to separate application or configure SpringBoot integration
		server.post("/socketEmit", (req, res) => {
			// const connectedSockets = io.sockets.sockets;
			const {
				op,
				jAuth: { token, stationId, socketId },
				data,
			} = req.body;

			if (op === "timeUpdate") {
				broadcastEmit(stationId, op, data);
				return res.sendStatus(200);
			}

			for (const socket of Object.values(socketConnections)) {
				console.log(socketId, socket.jAuth.socketId);
				const {
					jAuth: { token: t, stationId: stId, socketId: soId },
				} = socket;
				// send to SocketWrapper#onAny if found
				if (t === token && stId === stationId && soId === socketId) {
					socket.emit(op, data);
					return res.sendStatus(200);
				}
			}
			return res.status(404).send("Socket not found");
		});

		function broadcastEmit(stationId, op, data) {
			Object.values(socketConnections).forEach((socket) => {
				// socket.handshake.query { token, stationId }
				// socket.jAuth { token, stationId, socketId }
				const {
					jAuth: { stationId: stId },
				} = socket;
				if (stId === stationId) {
					socket.emit(op, data);
				}
			});
		}

		// prevent StationClient == null on page quick refresh
		// let disconnectTimeouts = {};

		io.on("connection", (socket) => {
			console.log("Client connected ::", socket.id);

			const { token, stationId } = socket.handshake.query;

			// token, stationId required to authorize socket client
			if (!token || !stationId) socket.close();

			const requestBody = { token, stationId, socketId: socket.id };

			socket.jAuth = requestBody;
			console.log(socket.jAuth);
			socketConnections[token] = socket;

			// clearTimeout(disconnectTimeouts[token]);

			socket.on("disconnect", () => {
				// disconnectTimeouts[token] = setTimeout(() => {
				fetch(process.env.PROXY_SOCKET_URL + "remove-client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) })
					.then(() => {
						console.log("Removed client ::", token, socket.id);
						delete socketConnections[token];
					})
					.catch((e) => console.error("DISCONNECT ERROR ::", e));
				// }, 600 * 1000);
			});
		});

		if (isDevelopment) {
			for (const [path, config] of Object.entries(apiPaths)) {
				server.use(path, createProxyMiddleware(config));
			}
		}

		server.all("*", (req, res) => {
			return handle(req, res);
		});

		httpServer.listen(port, (err) => {
			if (err) throw err;
			console.log(`> Ready on http://localhost:${port}`);
		});
	})
	.catch((err) => {
		console.log("SERVER ERROR::::", err);
	});
