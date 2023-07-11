module.exports = {
	output: "standalone",
	productionBrowserSourceMaps: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	publicRuntimeConfig: {
		CLIENT_ID: process.env.CLIENT_ID,
		CLIENT_OAUTH_REDIRECT: process.env.CLIENT_OAUTH_REDIRECT,
		CLIENT_REDIRECT: process.env.CLIENT_REDIRECT,

		NODE_ENV: process.env.NODE_ENV,

		PORT: process.env.PORT,
		PROXY_URL: process.env.PROXY_URL,
		PROXY_SOCKET_URL: process.env.PROXY_SOCKET_URL,

		SOCKET_URL: process.env.SOCKET_URL
	},
};
