module.exports = {
	output: "standalone",
	productionBrowserSourceMaps: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	env: {
		SERVER_URL: "http://localhost/",
		SOCKET_URL: "http://localhost:3080",
		PROXY_URL: "http://localhost:8080/api/",
		CLIENT_ID: "694655522237972510",
		CLIENT_REDIRECT: "http://localhost:8080/login-callback",
	},
};
