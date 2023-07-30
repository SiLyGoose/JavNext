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
	images:{
		domains: ['cdn.discordapp.com']
	},
	// eliminate render-blocking resources
	// async headers() {
	// 	return [
	// 		{
	// 			source: "/",
	// 			headers: [
	// 				{
	// 					key:"Link",
	// 					value:"https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&amp;family=Press+Start+2P&amp;display=swap"
	// 				},
	// 				{
	// 					key:"Link",
	// 					value:"https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css"
	// 				},
	// 			]
	// 		}
	// 	]
	// }
};
