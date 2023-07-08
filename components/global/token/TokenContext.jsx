import React, { createContext, useContext, useState, useEffect } from "react";
import { getIdentifier } from "../util";

const TokenContext = createContext("");

export const TokenProvider = ({ children }) => {
	const [token, setToken] = useState("");

	useEffect(() => {
		const getToken = async () => {
			const uuid = await getIdentifier();
			setToken(uuid);
		};

		getToken();
	}, []);

	return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
};

export const useToken = () => {return useContext(TokenContext);}
