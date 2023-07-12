import { v4 as uuidv4 } from "uuid";

// create token for session
export function handler(req, res) {
	const token = uuidv4();

	// Set the token as a cookie with an expiry of 24 hours
	res.setHeader("Set-Cookie", `token=${token}; Path=/; Max-Age=86400; HttpOnly`);

	// Return the token in the response
	return res.status(200).json({ token });
}
