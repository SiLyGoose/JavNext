import styles from "../../styles/header.module.css";

import React from 'react';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faDiscord, faTwitch } from "@fortawesome/free-brands-svg-icons";

function Footer() {
	const footerItems = [
		{ id: "footerItemDiscord", label: "Discord", href: "https://discord.gg/EXQn6bcqGv", icon: faDiscord },
		{ id: "footerItemGithub", label: "GitHub", href: "https://github.com/SiLyGoose/JavKing", icon: faGithub },
		{ id: "footerItemTwitch", label: "Twitch", href: "https://www.twitch.tv/javkingzero", icon: faTwitch },
	];

	return (
		<footer className="mastfoot d-flex w-100 mt-auto justify-content-center">
			<div className={styles.links}>
				{footerItems.map((item) => (
					<div key={item.id} className={styles.icon}>
						<a className={styles.fafaIcon} href={item.href}>
							<FontAwesomeIcon icon={item.icon} />
						</a>
					</div>
				))}
			</div>
		</footer>
	);
}

export default Footer;
