import React, { createContext, useContext, useState } from "react";

const LoginStatusContext = createContext();

export function useLoginStatus() {
    return useContext(LoginStatusContext);
}

export function LoginStatusProvider({children}) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <LoginStatusContext.Provider value={{isLoggedIn, setIsLoggedIn}}>
            {children}
        </LoginStatusContext.Provider>
    )
}