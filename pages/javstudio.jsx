import styles from "../styles/main.module.css";
import utilStyles from "../styles/utils.module.css";
import studioStyles from "../styles/javstudio.module.css";

import Canvas from "../components/global/page/canvas";
import Header from "../components/global/page/header";
import { InviteURL, LoginURL, API_URL } from "../components/global/util/url";
import { Span } from "../components/global/page/span";
import Image from "../components/global/page/image";
import { guildIcon } from "../components/global/util/icon";

import React, { useState, useEffect } from "react";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icon } from "@fortawesome/fontawesome-svg-core";
import { useRouter } from "next/router";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { useToken } from "../components/global/token/TokenContext";

function JavStudio() {
	const router = useRouter();
	const token = useToken();
	const [guildList, setGuildList] = useState([]);

	const [user, setUser] = useState(null);

	useEffect(() => {
		// max number of guilds to show based on height
		const heightTiers = [1080, 1440, 1920, 2560];
		// maxItems = (base) 10 + (base scale) 3 * (resolution tier scale for vertical monitors) heightTiers
		const maxItems = window.innerHeight >= 1080 ? 10 + 3 * (heightTiers.findIndex((x) => x <= window.innerHeight) + 1) : 10;

		if (token) {
			fetch(API_URL("guild-member-data", token))
				.then((response) => response.json())
				.then((data) => {
					setUser(data);
					let {
						d: {
							guild: { mutualList, userGuildList },
						},
					} = data;
					const allGuilds = [...mutualList.map((mutual) => ({ ...mutual, m: true })), ...userGuildList.map((guild) => ({ ...guild, m: false }))];
					setGuildList(allGuilds.length > maxItems ? allGuilds.splice(0, maxItems) : allGuilds);
				})
				.catch(console.error);
		}
	}, [token]);

	if (user === null) {
		return (
			<>
				<Canvas />
				<div className="pt-5 justify-content-center align-items-center text-center">
					<div className={`container ${styles.main} mb-0 pb-0`}>
						<img src="/images/JavKing_avatar.png" className={`img-fluid ${studioStyles.main}`} />
						<h1 className={`mt-3 ${utilStyles.fontType9}`}>Welcome to JavKing</h1>
					</div>
					<div className={`w-50 text-center d-inline-block mt-3 ${studioStyles.authenticationComponent}`}>
						<h2 className={`${utilStyles.fontType13}`}>Login to manage your studio</h2>
						<div className="mt-4 d-inline-block">
							<a className={`d-inline-block ${studioStyles.roomTag} ${studioStyles.roomTagAdjust}`} href={LoginURL(router.asPath)}>
								<span className="d-flex justify-content-center align-items-center">
									<span className="mr-1">
										<FontAwesomeIcon icon={icon(faDiscord)} width={16} height={16} />
									</span>
									<span className="text-uppercase">Login with Discord</span>
								</span>
							</a>
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<div className="d-flex h-100 mx-auto flex-column">
			<Canvas />
			<Header />
			<main className={`${styles.main} inner px-md-3 px-lg-0`}>
				<div className={`container justify-content-center align-items-center m-auto ${studioStyles.container}`}>
					<div className="d-flex flex-column text-center">
						<div className="h-100 mx-auto">
							<h3 className={`mb-0 ${utilStyles.fontType8}`}>Hello {user.d.username}</h3>
							<p className={`pb-4 mb-0 ${utilStyles.fontType13} ${studioStyles.headingSub} ${utilStyles.colorAdjust1}`}>Please select a server to get started</p>
						</div>
						<h5 className={`mt-5 mb-0 text-left text-uppercase ${utilStyles.fontType11} ${utilStyles.fontAdjust3} ${utilStyles.colorAdjust1}`}>
							showing {Math.min(window.innerHeight > 1024 ? 13 : 10, guildList.length)} servers
						</h5>
						<ul className={`px-1 overflow-auto mt-3 ${studioStyles.serverList}`}>
							{guildList.map((item, index) => (
								<li key={item.id} className="d-flex mt-3 justify-content-between">
									<div className="d-flex align-items-center">
										<div className="flex-shrink-0">
											<Span>
												<Image alt={item.name} src={guildIcon(item.id, item.icon)} quality={100} className="rounded-circle" />
											</Span>
										</div>
										<span className={`ml-2 ${utilStyles.fontType2} ${utilStyles.colorAdjust2}`}>{item.name}</span>
									</div>
									<div className="ml-1 flex-shrink-0 d-inline-block">
										<a
											className={`${utilStyles.fontType12} ${item.m ? studioStyles.roomTag : studioStyles.addTag} text-uppercase d-inline-block`}
											href={item.m ? `/javstation/${item.id}` : InviteURL(item.id, "javstudio")}
										>
											<span className="d-flex justify-content-center align-items-center">
												<span>{item.m ? "Go to javstation" : "Add javking"}</span>
												<span className={studioStyles.iconComponent}>
													<FontAwesomeIcon icon={icon(faAngleRight)} width={20} height={20} className={studioStyles.icon} />
												</span>
											</span>
										</a>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</main>
			<footer className="mastfoot mt-auto" />
		</div>
	);
}

export default JavStudio;
