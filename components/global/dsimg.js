// dynamic svg image
import React from 'react';
import SVG from 'react-svg';

const PNGtoSVG = async (pngURL) => {
    const response = await fetch(pngURL);
    const inputBuffer = await response.buffer();
    const bitmap = potrace.bitmap(inputBuffer);
    const path = bitmap.trace();
    const svg = path.toSVG();
}

const DSImage = ({svgContent}) => {
    return <SVG src={svgContent} />;
}

export default DSImage;