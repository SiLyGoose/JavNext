import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export function URL(path, ...body) {
	var returnURL = path.concat("/");

	if (typeof body[0] === "object") {
		for (let i = 0; i < body.length; i++) {
			returnURL += Object.entries(body[i])
				.map(([key, value]) => `${key}=${value}`)
				.join("&");
		}
	} else {
		returnURL = returnURL.concat(body.join("/"));
	}

	return process.env.PROXY_URL.concat(returnURL);
}

export function WS_URL(path, ...body) {
	var returnURL = path.concat("/?");

	if (typeof body[0] === "object") {
		for (let i = 0; i < body.length; i++) {
			returnURL += Object.entries(body[i])
				.map(([key, value]) => `${key}=${value}`)
				.join("&");
		}
	} else {
		returnURL = returnURL.concat(body.join("/"));
	}

	return returnURL;
}

export function InviteURL(guildId, state) {
	return `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&guild_id=${guildId}&permissions=37055488&scope=bot&response_type=code&redirect_url=${
		process.env.SERVER_URL || process.env.BOT_SITE
	}/${state}`;
}

export function LoginURL(state) {
	return `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${
		publicRuntimeConfig.NODE_ENV === "production" ? "https://javking.herokuapp.com/login-callback" : process.env.CLIENT_REDIRECT
	}&response_type=code&scope=identify%20guilds&state=${state}`;
}
