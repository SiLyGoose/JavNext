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

		SERVER_URL: process.env.SERVER_URL
	},
};
