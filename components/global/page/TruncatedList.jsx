import utilStyles from "../../../styles/utils.module.css";
import studioStyles from "../../../styles/javstudio.module.css";

import { Span } from "./span";
import Image from "./image";

import React, { useEffect, useRef, useState } from "react";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { guildIcon } from "../util/icon";
import { InviteURL } from "../util/url";
import { icon } from "@fortawesome/fontawesome-svg-core";

const TruncatedListItem = ({ item, maxBtnWidth }) => {
	const spanRef = useRef(null);
	const containerRef = useRef(null);
	const iconRef = useRef(null);

	const [truncatedStyle, setTruncatedStyle] = useState({});

	useEffect(() => {
		const containerWidth = containerRef.current.clientWidth;
		const iconWidth = iconRef.current.clientWidth;

		const newMaxBtnWidth = containerWidth - iconWidth - maxBtnWidth;

		setTruncatedStyle({
			width: newMaxBtnWidth,
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis",
		});
	}, [containerRef, maxBtnWidth]);

	return (
		<li key={item.id} className="d-flex mt-3 justify-content-between" ref={containerRef}>
			<div className="d-flex align-items-center">
				<div className="flex-shrink-0" ref={iconRef}>
					<Span>
						<Image alt={item.name} src={guildIcon(item.id, item.icon)} quality={100} className="rounded-circle" />
					</Span>
				</div>
				<span className={`ml-2 text-left ${utilStyles.fontType2} ${utilStyles.colorAdjust2}`} ref={spanRef} style={truncatedStyle}>
					{item.name}
				</span>
			</div>
			<div className="ml-2 flex-shrink-0 d-inline-block">
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
	);
};

const TruncatedList = ({ guildList }) => {
	const [maxBtnWidth, setMaxBtnWidth] = useState(0);

	useEffect(() => {
		const calculateMaxBtnWidth = () => {
			const buttons = document.querySelectorAll(".ml-2.flex-shrink-0.d-inline-block");
			let maxWidth = 0;

			buttons.forEach((btn) => {
				const btnWidth = btn.offsetWidth;
				maxWidth = Math.max(btnWidth, maxWidth);
			});

			setMaxBtnWidth(maxWidth);
		};

		calculateMaxBtnWidth();
		window.addEventListener("resize", calculateMaxBtnWidth);

		return () => {
			window.removeEventListener("resize", calculateMaxBtnWidth);
		};
	}, []);

	return (
		<ul className={`px-1 overflow-auto mt-3 ${studioStyles.serverList}`}>
			{guildList.map((item) => {
				return <TruncatedListItem key={item.id} item={item} maxBtnWidth={maxBtnWidth} />;
			})}
		</ul>
	);
};

export default TruncatedList;
