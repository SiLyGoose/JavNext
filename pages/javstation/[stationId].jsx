import styles from "../../styles/javstation.module.css";
import utilStyles from "../../styles/utils.module.css";

import Canvas from "../../components/global/canvas";
import Header from "../../components/global/header";
import { API_URL } from "../../components/global/url";
import Cookie from "../../components/global/cookie";
import { Span } from "../../components/global/span";
import Image from "../../components/global/image";
import { guildIcon } from "../../components/global/icon";
import { SocketWrapper } from "../../components/global/SocketWrapper";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { faBackwardStep, faBars, faChartLine, faForwardStep, faMagnifyingGlass, faPause, faPlay, faRepeat, faShuffle, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icon } from "@fortawesome/fontawesome-svg-core";
import { v4 as uuidv4 } from "uuid";
import clsx from "clsx";
import { humanizeMs, throttle, updateStyle } from "../../components/global/util";
import { useToken } from "../../components/global/token/TokenContext";
// import { usePalette } from "react-palette";

function JavStation() {
	// const url = "https://i.ytimg.com/vi/aVatpxBTfZs/maxresdefault.jpg";

	const [socket, setSocket] = useState(null);
	// "dropdown" for guild list
	const [guildListExpanded, setGuildListExpanded] = useState(true);
	const [mutualList, setMutualList] = useState([]);
	// user voice data
	const [voiceData, setVoiceData] = useState({});
	// tracks in queue
	const [queueData, setQueueData] = useState([]);

	// // stop slider updates while user is dragging slider
	const [sliderDragging, setSliderDragging] = useState(false);

	// for accessing max width of slider
	const sliderContainerRef = useRef(null);

	// // millisecond position in current track / durationMs for track
	const stationPositionMs = useRef(0);
	const stationDurationMs = useRef(0);
	// // slider position calculated as (positionMs / durationMs) * 100
	const sliderPosition = useRef(0);

	// useRef used to change position of player slider without re-rendering entire page
	// inputContainerRef - width, labelContainerRef - left, inputSliderRef - left
	const inputContainerRef = useRef(null);
	const labelContainerRef = useRef(null);
	const inputSliderRef = useRef(null);

	// update positionMs in track
	const trackDataTime = useRef(null);

	// whether to seek to beginning of track or load previous track
	// also limited by JavKing...#hasPrevious
	const [loadPrevious, setLoadPrevious] = useState(false);

	// returns player pause state
	const [stationPaused, setStationPaused] = useState(false);
	// [0, 1]: repeatOne, repeatAll
	const [stationRepeat, setStationRepeat] = useState([false, false]);
	const [stationShuffled, setStationShuffled] = useState(false);

	// previous, pause/play, skip
	const [stationControl, setStationControl] = useState([true, false, false]);

	// same cursor as used in backend
	const [stationPosition, setStationPosition] = useState(0);

	const router = useRouter();
	// allows Next.js to grab /javstation/[stationId]
	const { stationId } = router.query;
	const token = useToken();

	// allow user 5 seconds after initial previous arrow click (seek to 0)
	// to load previous track (refreshable)
	let timeoutId;
	const sendStationPrevious = () => {
		clearTimeout(timeoutId);

		socket.emit("stationPrevious", { loadPrevious });

		setLoadPrevious(true);

		timeoutId = setTimeout(() => {
			setLoadPrevious(false);
		}, 5000);
	};

	const sendStationPaused = () => {
		socket.emit("stationPaused", { d: stationPaused });
		// setStationPaused(!stationPaused);
	};

	const sendStationSkipped = () => {
		// offset = 0 only when stationRepeat[0] (repeatOne) is true
		// !(sR[0] || sR[1]) checks if stationRepeat[0] (repeatOne) is true
		// || sR[1] ensures that offset not affected by stationRepeat[0] (repeatOne) when both are true
		// const offset = +!(stationRepeat[0] || stationRepeat[1]) || stationRepeat[1];

		// wait..skip bypasses any repeat setting - Simon 2:25 AM :)
		const offset = 1;
		socket.emit("stationSkipped", { songSkipped: offset });
		// setStationPosition(stationPosition + offset);
	};

	const handleEmitRepeat = () => {
		// rO: repeatOne, rA: repeatAll
		var rO, rA;
		// iterates through repeat settings from: no repeat -> repeat track -> repeat entire queue
		// sR[0] && !sR[0,1] checks if repeatOne is already true, then set repeatAll to true
		// otherwise if repeatAll is already true, then toggle repeat off
		// lastly, toggle repeatOne
		if (stationRepeat[0] && !stationRepeat.every(Boolean)) {
			rO = rA = true;
		} else if (stationRepeat[1]) {
			rO = rA = false;
		} else {
			rO = true;
			rA = false;
		}
		return { rO, rA };
	};

	const sendStationRepeat = () => {
		const { rO, rA } = handleEmitRepeat();
		socket.emit("stationRepeat", { rO, rA });
		// setStationRepeat([rO, rA]);
	};

	const sendStationShuffle = () => {
		socket.emit("stationShuffled");
		// setStationShuffled(!stationShuffled);
	};

	const trackMutators = [
		{ id: "trackMutatorPrevious", label: "Previous", icon: faBackwardStep, handler: sendStationPrevious },
		{ id: "trackMutatorPause", label: "Pause", icon: faPause, handler: sendStationPaused },
		// { id: "trackMutatorPause", label: "Play", icon: faPlay },
		{ id: "trackMutatorForward", label: "Forward", icon: faForwardStep, handler: sendStationSkipped },
	];

	const queueMutators = [
		{ id: "queueMutatorRepeat", label: "Repeat", icon: faRepeat, handler: sendStationRepeat },
		{ id: "queueMutatorShuffle", label: "Shuffle", icon: faShuffle, handler: sendStationShuffle },
	];

	const handleTrackRemoved = (index) => {
		socket.emit("stationTrackRemoved", { index });
	};

	const reset = ({ track }) => {
		updateSlider(0);

		stationDurationMs.current = 0;
		stationPositionMs.current = 0;

		if (!track) {
			setQueueData([]);
			setStationPosition(0);
		}
	};

	useEffect(() => {
		if (!token) router.replace("/javstudio");

		if (!stationId) return;

		// connect to NGINX reverse proxy JavKing socket server
		// const ws = new WebSocket(WS_URL(process.env.SOCKET_URL, { userId: Cookie("userId"), stationId, transport: "websocket" }));
		const socketWrapper = new SocketWrapper(token, stationId);

		setSocket(socketWrapper);

		fetch(API_URL("guild-member-data", token))
			.then((response) => response.json())
			.then((data) => {
				const {
					d: {
						guild: { mutualList },
					},
				} = data;
				setMutualList(mutualList);
			})
			.catch((e) => {
				console.error(e);
				setMutualList([]);
			});

		fetch(API_URL("voice-member-data", { token, stationId }))
			.then((response) => response.json())
			.then((data) => {
				const { userChannel, botChannel } = data;
				setVoiceData({ userChannel, botChannel });
			})
			.catch(console.error);

		socketWrapper.emit("stationAccessed");

		// { userChannel: { voiceId, voiceName, botJoinable },
		// botChannel: { botVoiceId, botVoiceName, botSpeakable } }
		const handleVoiceData = (data) => {
			setVoiceData(data);
		};

		// { q: [ { id, url, thumbnail, title, durationMs,
		// requester: { username, id, avatar } } ] }
		// username and avatar set for immediate use
		const handleTracksAdded = (data) => {
			setQueueData((prevData) => [...prevData, ...data.q]);
		};

		// trackStarted data == trackEnded data
		// { id, position, track: { id, url, title, thumbnail, durationMs, requester: { id, username, avatar } } }
		const handleTrackStarted = (data) => {
			setStationPosition(data.position);
			stationPositionMs.current = 0;
			stationDurationMs.current = data.track.durationMs;
			updateSlider(0);
		};

		// if no track data is given, end of queue is reached
		const handleTrackEnded = (data) => {
			reset(data);
		};

		// all stationEvents can be simplified to stationUpdate + activityLogUpdate
		// { position, positionMs, paused, shuffled, suppressed, r: { rO, rA }, q: [] }
		const handleStationUpdate = (data) => {
			// all possible data attributes but not always present
			const {
				position,
				positionMs,
				paused,
				shuffled,
				suppressed, // server muted
				songSkipped, // current position offset
				r: { rO, rA }, // repeat: { repeatOne, repeatAll }
				q, // queue
			} = data;

			setStationPaused(paused);
			setStationRepeat([rO || false, rA || false]);
			setStationShuffled(shuffled);
			// setStationSupressed(suppressed);

			if (q !== undefined) {
				setQueueData(q);
				if (q.length) stationDurationMs.current = q[0].durationMs;
				else reset(data);
			}

			if (songSkipped) {
				setStationPosition(stationPosition + songSkipped);
				stationPositionMs.current = 0;
			}

			if (positionMs !== undefined) stationPositionMs.current = positionMs;
			if (position !== undefined) setStationPosition(position);
		};

		// sync player and web player time at 10s intervals
		const handleTimeUpdate = (data) => {
			const { positionMs } = data;

			stationPositionMs.current = positionMs;
		};

		const handleActivityLog = (data) => {
			console.log("UH OH STINKY ", data);
		};

		const eventHandlers = {
			voiceStatusUpdate: handleVoiceData,
			tracksAdded: handleTracksAdded,
			trackStarted: handleTrackStarted,
			trackEnded: handleTrackEnded,
			stationUpdate: handleStationUpdate,
			timeUpdate: handleTimeUpdate,
			activityLogUpdate: handleActivityLog,
		};

		const handleEvent = (op, data) => {
			console.log(op, data);
			const handler = eventHandlers[op];
			if (handler) handler(data);
		};

		socketWrapper.onAny(handleEvent);

		return () => {
			socketWrapper.close();
		};
	}, [stationId, setSocket]);

	const updateSlider = (newValue) => {
		newValue = newValue.toFixed(2);
		sliderPosition.current = newValue;
		// inputContainerRef - width, labelContainerRef - left, inputSliderRef - left
		[labelContainerRef, inputSliderRef].forEach((ref) => updateStyle(ref, "left", `${newValue}%`));
		[inputContainerRef].forEach((ref) => updateStyle(ref, "width", `${newValue}%`));

		if (trackDataTime?.current) trackDataTime.current.innerHTML = `${humanizeMs(stationPositionMs.current)} / ${humanizeMs(stationDurationMs.current)}`;
	};

	// update slider position by user
	const handleSliderMouseDown = () => {
		setSliderDragging(true);

		const containerRef = sliderContainerRef.current.getBoundingClientRect();
		const containerWidth = containerRef.width;
		const containerLeft = containerRef.left;
		const containerRight = containerRef.right;

		// throttled slider movement math to reduce "lag"
		const throttledHandleSliderMouseMove = throttle((mouseX) => {
			if (mouseX >= containerLeft && mouseX <= containerRight) {
				const newPosition = Math.max(0, Math.min(1, (mouseX - containerLeft) / containerWidth)) * 100;
				updateSlider(newPosition);
			}
		}, 100);

		const handleMouseMove = (event) => {
			const mouseX = event.clientX;
			throttledHandleSliderMouseMove(mouseX);
		};

		const handleMouseUp = () => {
			setSliderDragging(false);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);

			socket.emit("stationSeek", JSON.stringify({ positionMs: (sliderPosition.current * stationDurationMs.current) / 100, u: Cookie("userId"), stationId }));
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	};

	// update slider position as song is played
	useEffect(() => {
		if (sliderDragging) return;

		const updateTimer = setInterval(() => {
			stationPositionMs.current += 100;
			updateSlider((stationPositionMs.current / stationDurationMs.current) * 100);
		}, 100);

		if (stationPaused) clearInterval(updateTimer);

		return () => {
			clearInterval(updateTimer);
		};
	}, [stationPaused, sliderDragging]);

	const handleGuildExpanded = () => {
		setGuildListExpanded(!guildListExpanded);
	};

	const createGuildList = () => {
		return (
			<div className={`d-flex ${styles.guildNavContainer}`}>
				<ul className={`d-flex pt-3 flex-column flex-shrink-0 ${styles.guildNavWrapper}`}>
					<li className={clsx({ ["d-flex flex-column"]: guildListExpanded })}>
						<button className={`w-100 text-center py-2 rounded ${styles.guildNavBtnWrapper} ${clsx({ [styles.activeEffect]: guildListExpanded })}`} onClick={handleGuildExpanded}>
							<div className="d-flex align-items-center">
								<div className={styles.btnPill} />
								<div className={`d-flex justify-content-between ${styles.btnCategoryWrapper}`}>
									{guildListExpanded && <div className={styles.btnCategoryArrow} />}
									<div className={`ml-0 text-center ${utilStyles.fontType14}`}>AVAILABLE ({Math.max(0, mutualList.length)})</div>
									{!guildListExpanded && <div className={styles.btnCategoryArrow} />}
								</div>
							</div>
						</button>
						{guildListExpanded && (
							<div className={styles.guildList}>
								{mutualList.map((item, index) => (
									<div key={item.id} className={styles.mutualContainer}>
										<Link className={`d-flex position-relative ${clsx({ [styles.activeGuild]: item.id === stationId })}`} href={`/javstation/${item.id}`} target="_self">
											<div className={styles.guildPill} />
											<div className={`d-flex text-center align-items-center ${styles.mutualWrapper}`}>
												<div className={styles.iconWrapper}>
													<Span Px={48}>
														<Image alt={item.name} src={guildIcon(item.id, item.icon)} quality={100} />
													</Span>
												</div>
												<div className={styles.mutualMobWrapper}>{item.name}</div>
												<span className={`${styles.baseToolTip} ${styles.toolTip} ${styles.toolTipLg} ${utilStyles.fontType12}`}>{item.name}</span>
											</div>
										</Link>
									</div>
								))}
							</div>
						)}
					</li>
				</ul>
			</div>
		);
	};

	const createEmptyQueue = () => {
		return (
			<div className={`d-flex overflow-auto justify-content-around h-100 mb-5 ${styles.stationQueueWrapper}`}>
				<div className="d-flex flex-column align-items-center m-auto">
					<Span Px={200}>
						<Image alt="emptyQueue" src="/images/emptyQueue.png" quality={100} className="w-100 h-100 d-block" />
					</Span>
					{/* <span no songs in queue etc  */}
				</div>
			</div>
		);
	};

	const createQueue = () => {
		return (
			<>
				{/* ${styles.stationQueueInfo} */}
				<div className={`d-flex align-items-center justify-content-between `}>
					<p className={`text-uppercase ${utilStyles.fontType12} ${utilStyles.fontAdjust3}`}>{stationRepeat[1] ? queueData.length : queueData.length - stationPosition} songs in queue</p>
					{/* <div> clear player </div> */}
				</div>
				<div className={`h-100 mt-1 pb-0 ${styles.stationQueue}`}>
					{/* queue shows currentTrack position to end of queue (in case of repeat queue) */}
					{queueData.map((item, index) => {
						// only show previous tracks if rA is true
						if (index >= stationPosition || (index < stationPosition && stationRepeat[1])) {
							const {
								title,
								thumbnail,
								durationMs,
								url,
								requester: { username, avatar },
							} = item;

							return (
								<div key={uuidv4()} className={`px-4 ${clsx({ [styles.stationQueueTrack]: true, [styles.stationCurrentTrack]: index === stationPosition })}`}>
									<div className="d-flex py-4 align-items-center">
										<div className={`flex-shrink-0 ${styles.stationTrackThumbnail}`} style={{ backgroundImage: `url(${thumbnail})` }} />
										<div className={`ml-4 ${styles.stationTrackInfoWrapper}`}>
											<div className="d-flex align-items-center">
												<div className={styles.stationTrackTitleWrapper}>
													<a className={styles.stationTrackTitle} href={url} target="_blank">
														{title}
													</a>
												</div>
												<div className={styles.stationTrackInfoDivider} />
												<span className={`d-inline-block ${utilStyles.colorAdjust1}`}>{humanizeMs(durationMs)}</span>
											</div>
											<div className="d-flex align-items-center mt-3 justify-content-between">
												<div className="d-flex align-items-center">
													<Span Px={18}>
														<Image alt={username} src={avatar} quality={100} className="rounded-circle" />
													</Span>
													<span className={`ml-2 ${utilStyles.colorAdjust1} ${styles.stationTrackInfoRequester}`}>{username}</span>
												</div>
												<div className="flex-shrink-0">
													<button className="position-relative bg-transparent" onClick={handleTrackRemoved(index)}>
														<FontAwesomeIcon
															icon={icon(faXmark)}
															width={16}
															height={16}
															className={`d-block h-100 w-100 ${utilStyles.colorAdjust1} ${styles.stationTrackRemoveBtn}`}
														/>
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						}
					})}
				</div>
			</>
		);
	};

	const handleStationOption = (index) => {
		if (!stationControl[index]) {
			setStationControl((prevState) => {
				const newState = [...prevState];
				newState[index] = false;
				return newState;
			});
		}
	};

	const stationControlOptions = [
		{ id: "stationOptionQueue", label: "Queue", icon: faBars },
		{ id: "stationOptionSearch", label: "Search", icon: faMagnifyingGlass },
		{ id: "stationOptionActivity", label: "Activity", icon: faChartLine },
	];

	const createStation = () => {
		return (
			<div className={`h-100 px-3 ${styles.stationContainer}`}>
				<div className={styles.stationLeftContainer}></div>
				<div className={styles.stationRightContainer}>
					<div className="d-flex flex-column h-100">
						<ul className="d-flex align-items-center">
							{stationControlOptions.map((item, index) => (
								<li key={item.id} className={`d-inline-block position-relative ${clsx({ [`ml-auto ${styles.activityControlOption}`]: index === 2 })} ${styles.stationControlOption}`}>
									<a onClick={handleStationOption} href={`${router.asPath}#${item.label}`}>
										<button
											className={`d-flex align-items-center ${styles.stationControlBtn} ${clsx({ [styles.activeControl]: stationControl[index] })} ${clsx({
												[styles.stationControlSearch]: index === 1,
											})}`}
										>
											<FontAwesomeIcon icon={icon(item.icon)} width={24} height={24} className="d-block h-100 w-100" />
											{index !== 2 && <span className={`text-uppercase ${utilStyles.fontType2} ${styles.stationControlBtnText}`}>{item.label}</span>}
										</button>
									</a>
									{index === 2 && <span className={`${styles.baseToolTip} ${styles.toolTip} ${styles.toolTipSm} ${styles.activityToolTip}`}>{item.label}</span>}
								</li>
							))}
						</ul>
						<div className={`h-100 ${styles.stationQueueContainer}`}>
							{/* condition checks queue length in case of repeat queue */}
							<div className="d-flex flex-column h-100">{stationPosition < queueData.length ? createQueue() : createEmptyQueue()}</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const createUnattendedStation = () => {
		return (
			<div className={`text-center ${styles.stationUnattended}`}>
				<Span Px={200}>
					<Image alt="station unattended" src="/images/JavKing_VC_DISCONNECTED.png" quality={100} />
				</Span>
				<h2 className={`${utilStyles.fontType15}`}>
					Please join a <span style={{ color: "#7289da" }}>Discord</span> voice channel to attend JavStation
				</h2>
			</div>
		);
	};

	const createEmptyTrackData = () => {
		return <div className={`py-2 ${utilStyles.fontType2}`}>No Music Playing</div>;
	};

	const createTrackData = () => {
		const {
			title,
			requester: { username, avatar },
		} = queueData[stationPosition];

		return (
			<>
				<div className="position-relative d-inline-block">
					<span className={`${utilStyles.fontType12} ${styles.stationQueueTrackInfo}`}>{title}</span>
				</div>
				<div className={`d-flex align-items-center mt-1 ${utilStyles.colorAdjust1}`}>
					<Span Px={18}>
						<Image alt={username} src={avatar} quality={100} className="rounded-circle" />
					</Span>
					<div className={`${utilStyles.fontType11} ${styles.stationQueueTrackInfoRequester}`}>{`${username}`}</div>
					<div className={styles.stationTrackInfoDivider} style={{ backgroundColor: "#ada5b6" }} />
					<div className={utilStyles.fontType11} ref={trackDataTime}>
						0:00 / 0:00
					</div>
				</div>
			</>
		);
	};

	const createSlider = () => {
		return (
			<div className={styles.stationControllerSlider} ref={sliderContainerRef}>
				<div className={styles.sliderInputRange} aria-disabled="false">
					<span className={styles.inputRangeMin}>
						<span className={styles.inputRange}>0</span>
					</span>
					<div className={styles.inputSliderContainer}>
						<div className={`${styles.inputSliderContainer} ${styles.activeEffect}`} ref={inputContainerRef} style={{ left: "0%" }} />
						<span className={styles.inputLabelContainer} ref={labelContainerRef} style={{ position: "absolute" }}>
							<span className={styles.inputLabel}>
								<span className={styles.inputLabelValue}>{stationPositionMs.current}</span>
							</span>
							<div
								aria-valuemax={stationDurationMs.current}
								aria-valuemin={0}
								aria-valuenow={stationPositionMs.current}
								className={styles.inputSlider}
								draggable="false"
								role="slider"
								tabIndex="0"
							/>
						</span>
					</div>
					<span className={styles.inputRangeMax}>
						<span className={styles.inputRange}>{stationDurationMs.current}</span>
					</span>
					<div className={styles.inputSlider} ref={inputSliderRef} style={{ position: "absolute" }} onMouseDown={handleSliderMouseDown} />
				</div>
			</div>
		);
	};

	return (
		<div className="d-flex h-100 flex-column">
			<Canvas />
			<Header />

			<main className={`d-flex overflow-auto h-100 ${styles.stationContainer} ${clsx({ [styles.coverContainer]: !voiceData.userChannel?.voiceId })}`}>
				{createGuildList()}
				{voiceData.userChannel?.voiceId ? createStation() : createUnattendedStation()}
			</main>

			{/*  style={{ background: usePalette(url).data.vibrant }} */}
			<footer className={`mastfoot d-flex flex-column mb-0 mt-auto w-100 ${styles.stationController}`}>
				{queueData.length ? createSlider() : undefined}
				<div className={`d-flex flex-wrap h-100 align-items-center ${styles.stationControllerWrapper}`}>
					<div className={styles.trackDataSection}>{stationPosition < queueData.length ? createTrackData() : createEmptyTrackData()}</div>
					<div
						className={`d-flex justify-content-center align-items-center ${styles.trackControlSection} ${styles.trackDataSection} ${
							queueData.length ? styles.trackAvailable : styles.trackEmpty
						}`}
					>
						{trackMutators.map((item, index) => (
							<div key={item.id}>
								<button className={`btn-group ${styles.trackMutator}`} onClick={item.handler}>
									<FontAwesomeIcon
										icon={icon(index === 1 && stationPaused ? faPlay : item.icon)}
										width={index === 1 ? 40 : 24}
										height={index === 1 ? 40 : 24}
										className={`d-block w-100 h-100 ${styles.mutatorBtn} ${index === 1 && stationPaused ? styles.activeEffect : undefined}`}
										style={{ transform: "scale(0.8)" }}
									/>
								</button>
							</div>
						))}
					</div>
					<div
						className={`d-flex justify-content-end align-items-center ${styles.trackDataSection} ${styles.queueControlSection} ${
							queueData.length ? styles.trackAvailable : styles.trackEmpty
						}`}
					>
						{queueMutators.map((item, index) => (
							<div key={item.id} className={`flex-shrink-0 ${styles.queueMutatorWrapper}`}>
								<button className={`btn-group ${styles.queueMutator}`} onClick={item.handler}>
									<FontAwesomeIcon
										icon={icon(item.icon)}
										width={24}
										height={24}
										className={`d-block w-100 h-100 ${styles.mutatorBtn} ${clsx({
											[styles.activeAllEffect]: index === 0 && stationRepeat[1],
											[styles.activeEffect]: (index === 1 && stationShuffled) || (index === 0 && stationRepeat[0]),
										})}`}
										style={{ transform: "scale(0.8)" }}
									/>
								</button>
							</div>
						))}
					</div>
				</div>
			</footer>
		</div>
	);
}

export default JavStation;
