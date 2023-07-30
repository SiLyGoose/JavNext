import styles from "../../../styles/javstation.module.css";

type EffectFunction = (event: any, div: HTMLDivElement, circle: HTMLSpanElement, width: number, height: number, diameter: number, radius: number, left: number, top: number) => HTMLSpanElement;

interface EffectType {
	radial: EffectFunction;
	center: EffectFunction;
}

export const effectType: EffectType = {
	radial: ({ clientX, clientY }, div, circle, width, height, diameter, radius, left, top) => {
		circle.style.width = circle.style.height = `${diameter}px`;
		circle.style.left = `${clientX - (left + radius)}px`;
		circle.style.top = `${clientY - (top + radius)}px`;
		circle.classList.add(styles.btnFlashRadiate);

		return circle;
	},
	center: (event, div, circle, width, height, diameter, radius, left, top) => {
		const centerX = div.offsetLeft + width / 2;
		const centerY = div.offsetTop + height / 2;

		circle.style.width = circle.style.height = `${diameter}px`;
		circle.style.left = `${centerX - radius}px`;
		circle.style.top = `${centerY - radius}px`;
		circle.classList.add(styles.btnFlash);

		return circle;
	},
};

export const materializeEffect = (event: any, effect: EffectFunction) => {
	const div = event.currentTarget;
	if (!div) return;
	if (div.children.length > 3) div.removeChild(div.lastElementChild);

	const circle = document.createElement("span");
	const { left, top, width, height } = div.getBoundingClientRect();
	const diameter = Math.max(width, height);
	const radius = diameter / 2;

	effect(event, div, circle, width, height, diameter, radius, left, top);

	div.prepend(circle);

	setTimeout(() => {
		circle.remove();
	}, 500);
};

export const dynamicClick = (event: any, callback: Function) => {
	const div = event.currentTarget;

	const { clientX: x, clientY: y } = event;
	const element = document.elementFromPoint(x, y);

	if (element === div) {
		callback();
	}
};

var initialized = false;

export const developDynamicAnimation = (event) => {
	const div = event.currentTarget;
	if (!div || initialized) return;

	const { left, top, width, height } = div.getBoundingClientRect();
	console.log(top, height);
	const centerY = top + height >= 800 ? top - height / 2 : top - height;

	const root = document.documentElement;
	root.style.setProperty("--mob-dynamic-centerY", `${centerY}px`);
	initialized = true;
};
