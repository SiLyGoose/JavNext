// for global css configuration

import "../styles/global.css";

import Head from "next/head";
import { AppProps } from "next/app";

import React, { useState, useEffect } from "react";
// import next's router for callbacks
// import App from "next/app";
import { useRouter } from "next/router";

// loading screen component
import Loading from "../components/global/loading";
import { LoginStatusProvider } from "../components/global/login/LoginStatus";

// import { library } from '@fortawesome/fontawesome-svg-core'
// import { faRightFromBracket, faUserGroup } from '@fortawesome/free-solid-svg-icons'
// import { faTwitter, faFontAwesome } from '@fortawesome/free-brands-svg-icons'
// import { fa } from '@fortawesome/pro-thin-svg-icons'

// library.add(faRightFromBracket, faUserGroup)
// .tsx element
// const App({ Component, pageProps }: AppProps): JSX.Element => {
const App = ({ Component, pageProps }) => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const handleStart = (url) => {
			setIsLoading(true);
		};

		const handleComplete = (url) => {
			setIsLoading(false);
		};

		setIsLoading(false);

		// router events ensure Link triggers loading screen as well
		router.events.on("routeChangeStart", handleStart);
		router.events.on("routeChangeComplete", handleComplete);
		router.events.on("routeChangeError", handleComplete);

		return () => {
			router.events.off("routeChangeStart", handleStart);
			router.events.off("routeChangeComplete", handleComplete);
			router.events.off("routeChangeError", handleComplete);
		};
	}, []);

	return (
		<LoginStatusProvider>
			<Head>
				<title>JavKing</title>
			</Head>
			<Component {...pageProps} />
			<Loading isLoading={isLoading} />
		</LoginStatusProvider>
	);
};

export default App;

// export default class MyApp extends App {
// 	constructor() {
// 		super();
// 		this.state = {
// 			isLoading: false,
// 		};

// 		Router.events.on("routeChangeStart", () => {
// 			// some page has started loading
// 			this.setState({ isLoading: true });
// 		});

// 		Router.events.on("routeChangeComplete", () => {
// 			// some page has finished loading
// 			this.setState({ isLoading: false });
// 		});

// 		Router.events.on("routeChangeError", () => {
// 			// error occurred while some page was loading
// 			this.setState({ isLoading: false });
// 		});
// 	}

// 	render() {
// 		const { Component, pageProps } = this.props;
// 		return (
// 			<>
// 				<Head>
// 					<title>JavKing</title>
// 				</Head>
// 				{/* only show loading screen while state.isLoading is true */}
// 				<Loading isLoading={this.state.isLoading} />
// 				{/* code for rest of page */}
// 				<Component {...pageProps} />
// 			</>
// 		);
// 	}
// }
