module.exports = {
	output: "standalone",
	productionBrowserSourceMaps: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	publicRuntimeConfig: {
		PORT: process.env.PORT,
		CLIENT_BASE_URL: process.env.CLIENT_BASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		CLIENT_ID: process.env.CLIENT_ID,
		REDIRECT_URI: process.env.REDIRECT_URI,
	},
	env:
		process.env.NODE_ENV === "production"
			? {
					SERVER_URL: "http://localhost/",
					SOCKET_URL: "http://localhost:3080",
					PROXY_URL: "http://localhost:8080/api/",
					CLIENT_ID: "694655522237972510",
					CLIENT_REDIRECT: "http://localhost:8080/login-callback",
			  }
			: {},
};
