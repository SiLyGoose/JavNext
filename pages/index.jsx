// pages/index.js?x is associated with route /
// pages/posts/first-post.js?x is associated with route /posts/first-post

import Header from "../components/global/page/header";
import Canvas from "../components/global/page/canvas";
import Footer from "../components/footer";

import styles from "../styles/main.module.css";
import utilStyles from "../styles/utils.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faDiscord } from "@fortawesome/free-brands-svg-icons";

import React from "react";
import { InviteURL } from "../components/global/util/url";

function Home() {
	// bootstrap5 wtf?
	// using bootstrap4
	const mainItems = [
		{ id: "mainBtnDiscord", label: "Add to Discord", href: InviteURL(), icon: faDiscord },
		{ id: "mainBtnGithub", label: "GitHub Repository", href: "https://github.com/SiLyGoose/JavKing", icon: faGithub },
	];

	return (
		<div className="d-flex h-100 mx-auto flex-column">
			<Header />
			<Canvas />
			<main className={`d-flex flex-column inner ${styles.main}`}>
				{/* needs mobile/tablet responsiveness */}
				<div className="row w-100 align-items-center mx-auto">
					<div className={`${styles.container} container`}>
						<img src="/images/JavKing_new_FINISHED.png" className="img-fluid" />
					</div>
				</div>
				<div className="row w-100 justify-content-center mx-auto">
					<div className="container text-center">
						<h1 className={`${utilStyles.fontAdjust1} display-1 text-lg-center`}>JavKing</h1>
						<h5 className={`${utilStyles.fontAdjust2} text-lg-center`}>A simple Discord musicbot</h5>
						<div className="row mx-auto justify-content-center mt-3">
							{mainItems.map((item) => (
								<div key={item.id} className={`${styles.mainButton} w-75`}>
									<button type="button" className="btn btn-group btn-lg btn-mobfull btn-block justify-content-center">
										<a href={item.href}>
											<div className="d-flex align-items-center">
												<FontAwesomeIcon icon={item.icon} className="my-auto" />
												<span className={`pl-2 ${utilStyles.fontType3}`}>{item.label}</span>
											</div>
										</a>
									</button>
								</div>
							))}
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

export default Home;
