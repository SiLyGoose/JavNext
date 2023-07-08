import { Span } from "./span";
import Image from "./image";
import Cookie from "./cookie";
import { userIcon } from "./icon";
import { LoginURL, URL } from "./url";

import utilStyles from "../../styles/utils.module.css";
import styles from "../../styles/header.module.css";

import React, { useState, useEffect, useRef, Component } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { useToken } from "./token/TokenContext";

// cache to allow quicker load times and less computing/fetching
// import useSWR from "swr";
// const fetcher = (...args) => fetch(...args).then((response) => response.json());

function Header() {
	const router = useRouter();
	const token = useToken();

	// const { isLoggedIn, setIsLoggedIn } = useLoginStatus();

	const dropdownRefs = [useRef(null), useRef(null)];
	const [isExpanded, setIsExpanded] = useState([false, false]);

	const [user, setUser] = useState(null);
	const [winWidth, setWinWidth] = useState(0);

	// index 0, 1 for commands, dashboard
	// const [hoveredItems, setHoveredItems] = useState([]);

	const navItems = [
		{ id: "navItemCommands", label: "Commands", href: "/commands" },
		{ id: "navItemJavStudio", label: "JavStudio", href: "/javstudio" },
	];

	const routeItems = [
		{ id: "routeItemServers", label: "My Servers", href: "/javstudio", icon: faUserGroup },
		{ id: "routeItemLogout", label: "Logout", href: "/", icon: faRightFromBracket },
	];

	useEffect(() => {
		if (Cookie("userId")) {
			fetch(URL("guild-member-data", Cookie("userId")))
				.then((response) => response.json())
				.then((data) => {
					setUser(data);
					setIsLoggedIn(true);
				})
				.catch(console.error);
		}

		const handleResize = () => {
			setWinWidth(window.innerWidth);
		};

		const handleClickOutside = (event) => {
			for (let i = 0; i < dropdownRefs.length; i++) {
				if (dropdownRefs[i].current && !dropdownRefs[i].current.contains(event.target)) {
					setIsExpanded((prevState) => {
						const newState = [...prevState];
						newState[i] = false;
						return newState;
					});
				}
			}
		};

		window.addEventListener("resize", handleResize);
		document.addEventListener("click", handleClickOutside);

		// initial width
		setWinWidth(window.innerWidth);

		return () => {
			window.removeEventListener("resize", handleResize);
			document.removeEventListener("click", handleClickOutside);
		};
	}, [token]);

	// handle hover states for multiple objects
	// const handleMouseEnter = (index) => {
	// 	setHoveredItems((preHoveredItems) => {
	// 		const updatedItems = [...preHoveredItems];
	// 		updatedItems[index] = true;
	// 		return updatedItems;
	// 	});
	// };

	// const handleMouseLeave = (index) => {
	// 	setHoveredItems((preHoveredItems) => {
	// 		const updatedItems = [...preHoveredItems];
	// 		updatedItems[index] = false;
	// 		return updatedItems;
	// 	});
	// };

	// ensures dropdowns cannot be opened simultaneously

	// menu created on mobile/tablet users
	const createNavMenu = () => {
		return (
			<div ref={dropdownRefs[0]} className={`${styles.headerNavDropdown} ${styles.dropdownComponent} ${styles.dropdownComponentNoBorder}`}>
				<button
					className={`${styles.boxSelected}`}
					id={styles.menu}
					type="button"
					onClick={() => {
						setIsExpanded((prevState) => [!prevState[0], prevState[1]]);
					}}
				>
					<span className={`${styles.boxSelectedName} ${utilStyles.fontType7} ${isExpanded[0] ? styles.activeEffect : undefined}`}>Menu</span>
					<span className={`${styles.dropdownBoxArrow} ${isExpanded[0] ? styles.activeEffect : undefined}`} />
					{isExpanded[0] && (
						<ul className={`${styles.menuDropdownWrapper} ${styles.menuItem}`}>
							{navItems.map((item) => (
								<li key={item.id}>
									<Link className={`${utilStyles.fontType7} ${styles.dropdownItem}`} href={item.href}>
										<span className={styles.itemName}>{item.label}</span>
									</Link>
								</li>
							))}
						</ul>
					)}
				</button>
			</div>
		);
	};

	// items displayed when width >= 1024
	const createNavItems = () => {
		return (
			<ul className={styles.headerNavList}>
				{navItems.map((item) => (
					<li key={item.id} className={`${utilStyles.fontType2} ${styles.headerNavItem}`}>
						<a className={styles.headerNavItemLink} href={item.href}>
							<span>{item.label}</span>
						</a>
					</li>
				))}
			</ul>
		);
	};

	// user not logged in
	const createHollowUser = () => {
		return (
			<div className={`${styles.buttonComponentHollow} ${styles.buttonComponentRound} ${styles.sizeDfButton}`}>
				<a className={styles.buttonTag} href={LoginURL(router.asPath, token)}>
					<span className={styles.buttonContent}>Login</span>
				</a>
			</div>
		);
	};

	const handleLogout = () => {
		fetch(URL("remove-guild-member", Cookie("userId")), { method: "DELETE" })
			.then((response) => {
				if (!response.ok) throw new Error("Unable to log user out", { cause: response });
				setUser(null);
				// setIsLoggedIn(false);
			})
			.catch(console.error);
	};

	// user logged in
	const createUser = () => {
		return (
			<button
				type="button"
				className={`${styles.boxSelected} ${styles.headerUser} ${isExpanded[1] ? styles.buttonActiveEffect : ""}`}
				onClick={() => {
					setIsExpanded((prevState) => [prevState[0], !prevState[1]]);
				}}
			>
				<Span>
					<Image alt={user.d.username} src={userIcon(user.id, user.d.avatar)} quality="100" className={styles.boxSelectedImage} />
				</Span>
				<span className={`${styles.headerUserName} ${utilStyles.fontType7}`}>{user.d.username}</span>
				<span className={`${styles.dropdownBoxArrow} ${isExpanded[1] ? styles.activeEffect : ""}`} />
				{isExpanded[1] && (
					<ul className={`${styles.menuDropdownWrapper} ${styles.menuItem}`}>
						{routeItems.map((item, index) => (
							<li key={item.id}>
								<Link
									className={`${utilStyles.fontType2} ${styles.dropdownItem}`}
									href={router.asPath.includes("javstation") ? "/javstudio" : item.href}
									onClick={index === 1 ? handleLogout : undefined}
								>
									<Span Px={18}>
										<FontAwesomeIcon alt={item.label} icon={item.icon} className={styles.svgIcon} />
									</Span>
									<span className={`${styles.itemName} ${utilStyles.fontType7}`}>{item.label}</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</button>
		);
	};

	return (
		<header className={`${router.asPath !== "/" ? styles.headerMobile : undefined} ${styles.header} masthead mb-auto`}>
			<div className={styles.logoWrapper}>
				<Link className={styles.logoLink} href="/">
					<span
						style={{
							boxSizing: "border-box",
							display: "inline-block",
							overflow: "hidden",
							width: "initial",
							height: "initial",
							background: "none",
							opacity: 1,
							border: "0px",
							margin: "0px",
							padding: "0px",
							position: "relative",
							maxWidth: "100%",
						}}
						className={`${utilStyles.fontType10} ${styles.logoTitle}`}
					>
						{router.asPath !== "/" && winWidth < 1024 ? "JK" : "JavKing"}
					</span>
				</Link>
			</div>

			{/* wrapper used to align a group of elements or apply a background color or border */}
			{/* container used to provide a structured layout or grid system (usually a responsive layout or grid system) */}
			<div className={styles.headerNavWrapper}>
				<nav className={styles.headerNavContainer}>{winWidth >= 1024 ? createNavItems() : createNavMenu()}</nav>
				<div className={styles.headerUserWrapper}>
					<div ref={dropdownRefs[1]} className={styles.headerUserDropdown}>
						{user !== null ? createUser() : createHollowUser()}
					</div>
				</div>
			</div>
		</header>
	);
}

export default Header;
