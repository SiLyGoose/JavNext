import moment from "moment";

export function humanizeMs(durationMs) {
	const duration = moment.utc(durationMs);
	let format = "";
	if (duration.hours() > 0) {
		format += "H:";
	}
	format += "mm:ss";

	return moment.utc(durationMs).format(format);
}

export function throttle(callback, delay) {
	let timeoutId;
	let previousCall = 0;

	return function (...args) {
		const currentTime = new Date().getTime();
		const timeSinceLastCall = currentTime - previousCall;

		const runCallback = () => {
			previousCall = currentTime;
			callback.apply(this, args);
		};

		clearTimeout(timeoutId);

		if (timeSinceLastCall >= delay) {
			runCallback();
		} else {
			timeoutId = setTimeout(runCallback, delay - timeSinceLastCall);
		}
	};
}

export function updateStyle(ref, property, value) {
	if (ref?.current) {
		ref.current.style[property] = value;
	}
}

export function JSONify(event, data) {
	return JSON.stringify({ event, data });
}