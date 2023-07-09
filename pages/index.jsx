// pages/index.js?x is associated with route /
// pages/posts/first-post.js?x is associated with route /posts/first-post

import Header from "../components/global/header";
import Canvas from "../components/global/canvas";
import Footer from "../components/global/footer";

import styles from "../styles/main.module.css";
import utilStyles from "../styles/utils.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faDiscord } from "@fortawesome/free-brands-svg-icons";

import React from "react";
import { InviteURL } from "../components/global/url";

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
			<main className={`inner ${styles.main} px-md-3 px-lg-0`}>
				{/* needs mobile/tablet responsiveness */}
				<div className={`${styles.container} container`}>
					<div className="col-lg-4 col-sm-6 col-md-4 px-0 mx-auto my-auto">
						<img src="/images/JavKing_new_FINISHED.png" className="img-fluid" />
					</div>
				</div>
				<div className="col-lg-8 col-md-9 col-sm-12 mx-auto text-center">
					<h1 className={`${utilStyles.fontAdjust1} display-1 text-lg-center`}>JavKing</h1>
					<h5 className={`${utilStyles.fontAdjust2} text-lg-center`}>A simple Discord musicbot</h5>
					<div className="row mx-auto justify-content-center mt-3">
						{mainItems.map((item) => (
							<div key={item.id} className={`${styles.mainButton} col-lg-6 col-md-8 col-sm-8 mb-sm-3`}>
								<button type="button" className="btn btn-group btn-lg btn-mobfull btn-block justify-content-center">
									<a href={item.href} className="">
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
			</main>
			<Footer />
		</div>
	);
}

export default Home;
