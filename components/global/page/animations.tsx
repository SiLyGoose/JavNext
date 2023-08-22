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
	if (div.children.length > 3) div.removeChild(div.firstElementChild);

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

var initialized = false,
	tabsContainer: HTMLElement,
	tabButtons: NodeListOf<HTMLElement>;

export const developDynamicAnimation = (event) => {
	if (initialized || !tabsContainer) return;

	const { left, top, width, height } = tabsContainer.getBoundingClientRect();
	const centerY = top - height - 16;

	const root = document.documentElement;
	root.style.setProperty("--mob-dynamic-centerY", `${centerY}px`);
	initialized = true;
};

export const dynamicTabAnimation = () => {
	tabsContainer = document.querySelector("[role=tablist]")!;
	tabButtons = tabsContainer?.querySelectorAll("[role=tab]");

	if (!tabsContainer) return;

	(tabsContainer as HTMLElement)?.addEventListener("click", (e) => {
		const clickedTab = (e.target as HTMLElement)?.closest("button");
		const currentTab = tabsContainer?.querySelector('[aria-selected="true"]');

		if (!clickedTab || clickedTab === currentTab) return;

		switchTab(clickedTab);
	});
}

const switchTab = (newTab: HTMLButtonElement) => {
	const oldTab = tabsContainer.querySelector('[aria-selected="true"]') as HTMLButtonElement;

	tabButtons.forEach((button) => {
		button.setAttribute("aria-selected", "false");
	});

	newTab.setAttribute("aria-selected", "true");
	newTab.focus();
	moveIndicator(oldTab, newTab);
};

const moveIndicator = (oldTab: HTMLButtonElement, newTab: HTMLButtonElement) => {
	if (oldTab === null) oldTab = newTab;
	const newTabPosition = oldTab.compareDocumentPosition(newTab);
	const newTabWidth = newTab.offsetWidth / tabsContainer.offsetWidth;
	let transitionWidth: number;

	// if the new tab is to the right
	if (newTabPosition === 4) {
		transitionWidth = newTab.offsetLeft + newTab.offsetWidth - oldTab.offsetLeft;
	} else {
		// if the tab is to the left
		transitionWidth = oldTab.offsetLeft + oldTab.offsetWidth - newTab.offsetLeft;
		tabsContainer.style.setProperty("--_left", newTab.offsetLeft + "px");
	}

	tabsContainer.style.setProperty("--_width", transitionWidth / tabsContainer.offsetWidth + "");

	setTimeout(() => {
		tabsContainer.style.setProperty("--_left", newTab.offsetLeft + "px");
		tabsContainer.style.setProperty("--_width", newTabWidth + "");
	}, 220);
};