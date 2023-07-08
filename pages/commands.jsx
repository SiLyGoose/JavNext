import styles from "../styles/header.module.css";

import React from "react";
import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faWarning } from "@fortawesome/free-solid-svg-icons";

function Commands() {
	return (
		<div className="d-flex h-100 flex-column justify-content-center align-items-center m-auto">
			<div>
				<h1 className="text-xl-center text-warning">
					<FontAwesomeIcon className="mr-2" icon={faWarning} />
					UNDER CONSTRUCTION
					<FontAwesomeIcon className="ml-2" icon={faWarning} />
				</h1>
			</div>
			<div>
				<Link className={`text-decoration-none ${styles.headerNavItemLink}`} href="/">
					<FontAwesomeIcon className="mr-1" icon={faArrowLeft} />
					<h3 className="text-xl-center">Return to Home Page</h3>
				</Link>
			</div>
		</div>
	);
}

export default Commands;
