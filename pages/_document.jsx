import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import Link from "next/link";

class MyDocument extends Document {
	// render(): JSX.Element {
	render() {
		return (
			<Html lang="en">
				<Head>
					{/* again. bootstrap5 wtf? */}
					{/* <link
						rel="stylesheet"
						href="https://maxcdn.bootstrapcdn.com/bootstrap/5.3.0/css/bootstrap.min.css"
						integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
						crossOrigin="anonymous"
					/> */}
					{/* <Link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&amp;family=Press+Start+2P&amp;display=swap" as="font" /> */}
					{/* <Link
						rel="preload"
						href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css"
						integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N"
						crossOrigin="anonymous"
						as="style"
					/> */}

					<link rel="stylesheet" href="/minify/bootstrap.min.css" />
					<link rel="shortcut icon" href="/images/favicon.ico" />
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
