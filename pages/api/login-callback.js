import { NextApiRequest, NextApiResponse } from "next";
import { useToken } from "../../components/global/token/TokenContext";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

// export default function handleLoginCallback(req: NextApiRequest, res: NextApiResponse)
export default function handleLoginCallback(req, res) {
	const { code, state } = req.query;
	const token = useToken();

	const requestBody = new URLSearchParams({
		client_id: publicRuntimeConfig.CLIENT_ID,
		client_secret: publicRuntimeConfig.CLIENT_SECRET,
		grant_type: "authorization_code",
		code,
		redirect_uri: publicRuntimeConfig.CLIENT_REDIRECT,
	});

	const oauth = "https://discord.com/api/v10/oauth2/token";

	fetch(oauth, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: requestBody,
	})
		.then((res) => res.json())
		.then(async (data) => {
			// also contains scope
			const { access_token, token_type, expires_in, refresh_token } = data;
			return fetch(publicRuntimeConfig.CLIENT_OAUTH_REDIRECT, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ access_token, token_type, expires_in, refresh_token, uuid: token }),
			}).catch(console.error);
		})
		.finally(() => res.redirect(state))
		.catch(console.error);
}
