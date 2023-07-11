const BASE_URL = "https://cdn.discordapp.com/";

export function userIcon(id, avatar) {
	return BASE_URL + `avatars/${id}/${avatar}.png`;
}

export function guildIcon(id, icon) {
	return BASE_URL + `icons/${id}/${icon}.png`;
}
