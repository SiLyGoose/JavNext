import { handler as tHandler } from "./token";

// get token for session
export default function handler(req, res) {
	const { token } = req?.cookies;
    
	if (token) {
		// Token exists, return it
		res.status(200).json({ token });
	} else {
		tHandler(req, res);
	}
}
