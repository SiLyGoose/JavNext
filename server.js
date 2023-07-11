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

			for (const socket of Object.values(socketConnections)) {
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

		io.on("connection", (socket) => {
			console.log("Client connected ::", socket.id);

			const { token, stationId } = socket.handshake.query;

			// token, stationId required to authorize socket client
			if (!token || !stationId) socket.close();

			const requestBody = { token, stationId, socketId: socket.id };

			socket.jAuth = requestBody;
			socketConnections[token] = socket;

			// Initialize StationClient in JavBot and retrieve details through POST request (JavBot returns with /socketEmit POST request)
			fetch(process.env.PROXY_SOCKET_URL + "add-client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) })
				.then(() => {
					console.log("Added client ::", socket.id);
					return fetch(process.env.PROXY_SOCKET_URL + "stationAccessed/" + token, { method: "POST" });
				})
				.catch((e) => console.error("ERROR ::", e));

			socket.on("disconnect", () => {
				console.log("Disconnected ::", socket.id);
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
		console.log("Error:::::", err);
	});
