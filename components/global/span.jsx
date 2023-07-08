import styles from "../../styles/header.module.css";
import Jimp from "jimp";
import { URL } from "./url";

import React from "react";

// type SpanProps {
// 	children: ReactNode;
// };

// const Span: React.FC<SpanProps> = ({ children }) => {
export function Span({ children, Px = 32 }) {
	const P = [
		{ id: 18, src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIi8+" },
		{ id: 32, src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIi8+" },
		{ id: 48, src: "data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27100%27%20height=%27100%27/%3e" },
		{ id: 180, src: "data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27171%27%20height=%27180%27/%3e" },
		{ id: 200, src: "data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27320%27%20height=%27200%27/%3e" },
	];

	return (
		<span className={styles.spanContainer}>
			<span className={styles.spanWrap}>
				<img aria-hidden="true" src={P.find((p) => p.id === Px).src} className={styles.userIcon} />
			</span>
			{children}
		</span>
	);
}

// applies to all children
export function SpanChildren({ children }) {
	return (
		<span style={spanStyle}>
			{React.Children.map(children, (child) => {
				return React.cloneElement(child, { style: spanStyle });
			})}
		</span>
	);
}
