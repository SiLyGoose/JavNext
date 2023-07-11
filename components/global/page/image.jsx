import React from "react";

// type ImageProps = {
// 	alt: string;
// 	src: string;
// 	quality: number;
// };

// const Image: React.FC<ImageProps> = ({ alt, src, quality }) => {

const Image = ({ alt, src, quality, className }) => {
	return (
		<img
			alt={alt}
			src={src}
			quality={quality}
			className={className}
			style={{
				position: "absolute",
				inset: "0px",
				boxSizing: "border-box",
				padding: "0px",
				border: "none",
				margin: "auto",
				display: "block",
				width: "0px",
				height: "0px",
				minWidth: "100%",
				maxWidth: "100%",
				minHeight: "100%",
				maxHeight: "100%",
				objectFit: "fill",
			}}
		/>
	);
};

export default Image;
