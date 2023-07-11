import { NextApiRequest, NextApiResponse } from "next";
import getConfig from "next/config";
import { Q_URL } from "../../components/global/util/url";

const { publicRuntimeConfig } = getConfig();

// export default function handleLoginCallback(req: NextApiRequest, res: NextApiResponse)
export default function handleLoginCallback(req, res) {
	const {
		query: { code, state },
		cookies: { token },
	} = req;

	// links GuildMember user with token
	fetch(Q_URL(publicRuntimeConfig.CLIENT_OAUTH_REDIRECT, { code, uuid: token }), { method: "POST" })
		.then(() => res.redirect(state))
		.catch((error) => {
			console.error(error);

			res.status(500).json({ error: "Internal Server Error. Teehee" });
		});
}
