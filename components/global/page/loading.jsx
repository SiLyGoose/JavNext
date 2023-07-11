import React from "react";

import styles from "../../../styles/canvas.module.css";

const Loading = ({isLoading}) => {
	return (
		<div className={`${styles.loaderContainer} ${!isLoading ? styles.fadeOut : undefined}`}>
			<span className={styles.loaderWrapper}>
				<span className={styles.loader} />
			</span>
		</div>
	);
};

export default Loading;
