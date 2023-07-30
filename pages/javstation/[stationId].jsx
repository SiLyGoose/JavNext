import styles from "../../styles/javstation.module.css";
import utilStyles from "../../styles/utils.module.css";
import headerStyles from "../../styles/header.module.css";

import Canvas from "../../components/global/page/canvas";
import Header from "../../components/global/page/header";
import { API_URL, WS_URL } from "../../components/global/util/url";
import { Span } from "../../components/global/page/span";
import jImage from "../../components/global/page/image";
import { guildIcon, userIcon } from "../../components/global/util/icon";
import { SocketWrapper } from "../../components/socket/SocketWrapper";
import { developDynamicAnimation, dynamicClick, dynamicPullUp, effectType, materializeEffect } from "../../components/global/page/animations";
import { hexToRGBA } from "../../components/global/util/color";
import { useToken } from "../../components/global/token/TokenContext";
import { getMemberData, humanizeMs, throttle, updateStyle } from "../../components/global/util/qol";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { faBackwardStep, faBars, faChartLine, faEllipsisVertical, faForwardStep, faHeart, faMagnifyingGlass, faPause, faPlay, faRepeat, faShuffle, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icon } from "@fortawesome/fontawesome-svg-core";
import { v4 as uuidv4 } from "uuid";
import clsx from "clsx";
import Marquee from "react-fast-marquee";
// Palette to create dynamic background based on video thumbnail (MOBILE ONLY)
import { usePalette as findPalette } from "react-palette";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { useQuery } from "react-query";

function JavStation() {
	// const url = "https://i.ytimg.com/vi/aVatpxBTfZs/maxresdefault.jpg";

	const [socket, setSocket] = useState(null);
	// { id, avatar, globalName, mutualList }
	const [user, setUser] = useState({});
	// "dropdown" for guild list
	const [guildListExpanded, setGuildListExpanded] = useState(true);
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

	const [winWidth, setWinWidth] = useState(0);
	const [winHeight, setWinHeight] = useState(0);

	// determines whether or not the card for station is popped up
	const [stationCard, setStationCard] = useState(true);
	const [stationCardDeactive, setStationCardDeactive] = useState(false);
	// determines whether or not the lower pullup card is popped up
	const [stationPlus, setStationPlus] = useState(false);
	const [stationPlusDeactive, setStationPlusDeactive] = useState(false);
	// up next/lyrics
	const [mobStationQueueOption, setMobStationQueueOption] = useState(false);
	const [mobStationLyricOption, setMobStationLyricOptions] = useState(false);
	// determines whether options is popped up
	const [mobStationOptions, setMobStationOptions] = useState(false);
	const [mobStationOptionsDeactive, setMobStationOptionsDeactive] = useState(false);
	// index to retrieve station for popup options
	const [mobStationIndex, setMobStationIndex] = useState(0);
	// determines whether options are for guild list or music player
	const [mobStationGuildOption, setMobStationGuildOption] = useState(false);

	const optionRef = useRef(null);

	const [palette, setPalette] = useState(null);
	var { data } = findPalette(queueData[stationPosition]?.thumbnail);

	useEffect(() => {
		setPalette(data);
		const root = document.documentElement;
		// ["darkVibrant", "vibrant"].forEach(p => root.style.setProperty(`--mob-palette-${p}`, hexToRGBA(data[p], .3)));
		root.style.setProperty("--mob-palette-darkVibrant", hexToRGBA(data?.darkVibrant, 0.4));
		root.style.setProperty("--mob-palette-vibrant", hexToRGBA(data?.vibrant, 0.3));
		root.style.setProperty("--mob-palette-vibrant-p50", hexToRGBA(data?.vibrant, 0.45));
	}, [data]);

	const router = useRouter();
	// allows Next.js to grab /javstation/[stationId]
	const { stationId } = router.query;
	// token used to gain API access
	const token = useToken();

	// allow user 5 seconds after initial previous arrow click (seek to 0)
	// to load previous track (refreshable)
	let timeoutId;
	const sendStationPrevious = () => {
		clearTimeout(timeoutId);

		socket.emit("stationPrevious", loadPrevious);

		setLoadPrevious(true);

		timeoutId = setTimeout(() => {
			setLoadPrevious(false);
		}, 5000);
	};

	const sendStationPaused = () => {
		socket.emit("stationPaused", stationPaused);
		// setStationPaused(!stationPaused);
	};

	const sendStationSkipped = () => {
		// offset = 0 only when stationRepeat[0] (repeatOne) is true
		// !(sR[0] || sR[1]) checks if stationRepeat[0] (repeatOne) is true
		// || sR[1] ensures that offset not affected by stationRepeat[0] (repeatOne) when both are true
		// const offset = +!(stationRepeat[0] || stationRepeat[1]) || stationRepeat[1];

		// wait..skip bypasses any repeat setting - Simon 2:25 AM :)
		const offset = 1;
		socket.emit("stationSkipped", offset);
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
		socket.emit("stationRepeat", rO, rA);
		// socket.emit("stationRepeat", { rO, rA });
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
		socket.emit("stationTrackRemoved", index);
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
		if (!stationId || !token) return;

		// connect to NGINX reverse proxy JavKing socket server
		// const ws = new WebSocket(WS_URL(process.env.SOCKET_URL, { userId: Cookie("userId"), stationId, transport: "websocket" }));
		const socketWrapper = new SocketWrapper(token, stationId);

		setSocket(socketWrapper);

		// React Query
		// const { data, status } = useQuery(["memberData", token], getMemberData, { enabled: !!token });
		// if (status === "error") router.replace("/javstudio");
		// if (status === "success") {
		// 	const {
		// 		id,
		// 		d: {
		// 			avatar,
		// 			username,
		// 			guild: { mutualList },
		// 		},
		// 	} = data;
		// 	setUser({ id, avatar: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`, globalName: username, mutualList });
		// }

		fetch(API_URL("guild-member-data", token))
			.then((response) => response.json())
			.then((data) => {
				const {
					id,
					d: {
						avatar,
						username,
						guild: { mutualList },
					},
				} = data;
				setUser({ id, avatar: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`, globalName: username, mutualList });
			})
			.catch((error) => {
				console.error(error);
				router.replace("/javstudio");
			});

		function initializeStation() {
			console.log("Added client ::", socketWrapper.socket.id);
			console.log("Client jAuth ::", token, stationId);
			return socketWrapper.emit("stationAccessed");
		}

		function initializeVoice() {
			return socketWrapper
				.emit("voiceAccessed", stationId)
				.then((response) => response.json())
				.then((data) => {
					console.log("voiceCheck", data);
					if (!data) return;
					const { userChannel, botChannel } = data;
					setVoiceData({ userChannel, botChannel });
				})
				.catch((error) => {
					console.error(error);
					setVoiceData({});
				});
		}

		// Initialize StationClient in JavBot and retrieve details through POST request (JavBot returns with /socketEmit POST request)
		socketWrapper.socket.on("connect", () => {
			socketWrapper.emitJSON("add-client", { token, stationId, socketId: socketWrapper.socket.id }, initializeStation, initializeVoice);
		});

		// .catch((e) => console.error("ADD_CLIENT ERROR ::", e));

		// { userChannel: { voiceId, voiceName, botJoinable },
		// botChannel: { botVoiceId, botVoiceName, botSpeakable } }
		const handleVoiceData = (data) => {
			setVoiceData(data);
		};

		// { q: [ { id, url, thumbnail, title, channel, durationMs,
		// requester: { username, id, avatar } } ] }
		// username and avatar set for immediate use
		const handleTracksAdded = (data) => {
			setQueueData((prevData) => [...prevData, ...data.q]);
		};

		// trackStarted data == trackEnded data
		// { id, position, track: { id, url, title, channel, thumbnail, durationMs, requester: { id, username, avatar } } }
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
	}, [stationId, setSocket, token]);

	const updateSlider = (newValue) => {
		newValue = newValue.toFixed(2);
		sliderPosition.current = newValue;
		// inputContainerRef - width, labelContainerRef - left, inputSliderRef - left
		[labelContainerRef, inputSliderRef].forEach((ref) => updateStyle(ref, "left", `${newValue}%`));
		[inputContainerRef].forEach((ref) => updateStyle(ref, "width", `${newValue}%`));

		if (trackDataTime?.current)
			trackDataTime.current.innerHTML = winWidth >= 1024 ? `${humanizeMs(stationPositionMs.current)} / ${humanizeMs(stationDurationMs.current)}` : humanizeMs(stationPositionMs.current);
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

			const newPosition = Math.floor((sliderPosition.current * stationDurationMs.current) / 100);
			stationPositionMs.current = newPosition;
			socket.emit("stationSeek", newPosition);
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

	useEffect(() => {
		const handleResize = () => {
			setWinWidth(window.innerWidth);
			setWinHeight(window.innerHeight);
		};

		// closes mobile station options if click is outside of box
		const handleClickOutside = (event) => {
			if (optionRef.current && !optionRef.current.contains(event.target)) {
				setMobStationOptionsDeactive(true);
				setTimeout(() => {
					setMobStationOptions(false);
				}, 500);
			}
		};

		// if (plusRef.current) {
		// 	developDynamicAnimation(plusRef);
		// }

		window.addEventListener("resize", handleResize);
		document.addEventListener("click", handleClickOutside);

		// initial width
		setWinWidth(window.innerWidth);
		setWinHeight(window.innerHeight);

		return () => {
			window.removeEventListener("resize", handleResize);
			document.removeEventListener("click", handleClickOutside);
		};
	}, []);

	const handleGuildExpanded = () => {
		setGuildListExpanded(!guildListExpanded);
	};

	const createMobGuildList = () => {
		const { globalName, avatar, mutualList } = user;
		if (!globalName || !avatar) return;

		return (
			<div className={`container p-3 ${clsx({ [utilStyles.zN999]: stationCard || mobStationOptions })}`}>
				<div className="d-flex w-100 my-4 col align-items-center justify-content-center">
					<div className={styles.mobStationUserIcon}>
						<Image alt={`User ${globalName}`} className="rounded-circle img-fluid" src={avatar} width={40} height={40} />
					</div>
					<div className="d-flex flex-column w-100 ml-3">
						<div className="row w-100 mx-auto">
							<span className={`text-uppercase ${utilStyles.colorAdjust1} ${utilStyles.fontType12}`}>Stations to get you started</span>
						</div>
						<div className="row w-100 mx-auto">
							<span className={utilStyles.defaultFamily}>
								<h3 className="mb-0">Welcome {globalName}</h3>
							</span>
						</div>
					</div>
				</div>
				<ul className="d-flex w-100 flex-column align-items-center">
					{mutualList.map((item, index) => (
						<li
							key={item.id}
							className={`row w-100 py-2 ${clsx({ [styles.guildActive]: item.id === stationId })}`}
							onClick={() => {
								if (item.id != stationId) router.replace(`/javstation/${item.id}`);
								handleCardActive();
							}}
						>
							<div className="col-3">
								<div className={styles.mobStationGuildIcon}>
									<Image alt={item.name} className="rounded img-fluid" src={guildIcon(item.id, item.icon)} width={48} height={48} />
								</div>
							</div>
							{/* my-2 */}
							<div className="d-flex col px-0 my-auto justify-space-between">
								<span className={utilStyles.fontType3}>{item.name}</span>
								<div
									className={`d-flex h-100 ml-auto align-items-center justify-content-center ${utilStyles.mn24px} ${styles.mobGuildListContainer}`}
									onClick={(event) => {
										event.stopPropagation();
										materializeEffect(event, effectType.center);
									}}
								>
									<FontAwesomeIcon
										icon={faEllipsisVertical}
										onClick={() => {
											setMobStationIndex(index);
											setMobStationGuildOption(true);
											setMobStationOptions(true);
											setMobStationOptionsDeactive(false);
										}}
									/>
								</div>
							</div>
						</li>
					))}
				</ul>
			</div>
		);
	};

	const createGuildList = () => {
		const { mutualList } = user;
		if (!mutualList?.length) return;

		return (
			<div className={`d-flex ${styles.guildNavContainer}`}>
				<ul className={`d-flex pt-3 flex-column flex-shrink-0 ${styles.guildNavWrapper}`}>
					<li className={clsx({ ["d-flex flex-column"]: guildListExpanded })}>
						<button
							aria-label={"Display guilds"}
							className={`w-100 text-center py-2 rounded ${styles.guildNavBtnWrapper} ${clsx({ [styles.activeEffect]: guildListExpanded })}`}
							onClick={handleGuildExpanded}
						>
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
									<div key={item.id} className={`d-flex position-relative ${clsx({ [styles.activeGuild]: item.id === stationId })} ${styles.mutualContainer}`}>
										<div className={`d-flex text-center align-items-center justify-content-center ${styles.mutualWrapper}`}>
											<Link className={styles.iconContainer} href={`/javstation/${item.id}`} target="_self">
										<div className={styles.guildPill} />
												<div className={styles.iconWrapper}>
													<span className={`align-self-center ${styles.baseToolTip} ${styles.toolTip} ${styles.toolTipLg} ${utilStyles.fontType12}`}>{item.name}</span>
													<Image alt={item.name} src={guildIcon(item.id, item.icon)} quality={100} width={48} height={48} className={styles.icon} />
												</div>
											</Link>
											<div className={styles.mutualMobWrapper}>{item.name}</div>
										</div>
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
						<Image alt="emptyQueue" src="/images/emptyQueue.png" quality={100} className="w-100 h-100 d-block" width={200} height={200} />
					</Span>
					{/* <span no songs in queue etc  */}
				</div>
			</div>
		);
	};

	const stationGuildOptions = [{ id: "stationGuildOptionFavorite", label: "Favorite", icon: faHeart }];

	const stationOptions = [{ id: "stationOptionSearch", label: "Search", icon: faMagnifyingGlass }];

	const createMobStationOptions = () => {
		const options = mobStationGuildOption ? stationGuildOptions : stationOptions;
		const { mutualList } = user;
		const mutual = mobStationGuildOption ? mutualList[mobStationIndex] : mutualList.find((m) => m.id === stationId);
		if (!mutual) return;

		return (
			<>
				<div
					className={`${utilStyles.z99} ${styles.optionsCoverContainer} ${clsx({
						[styles.activeContainer]: mobStationOptions,
						[styles.deactiveContainer]: mobStationOptionsDeactive,
					})}`}
				/>
				<div
					className={`container d-flex flex-column py-0 px-0 align-items-center ${utilStyles.z999} ${styles.mobStationOptionsContainer} ${clsx({
						[styles.activeContainer]: mobStationOptions,
						[styles.deactiveContainer]: mobStationOptionsDeactive,
					})}`}
					ref={optionRef}
				>
					<div className={`row w-100 py-2 ${styles.mobStationGuild}`}>
						<div className="col">
							<div className="d-flex">
								<div className={`d-flex align-items-center justify-content-center ${styles.mobStationGuildIcon}`}>
									<img alt={mutual.name} src={guildIcon(mutual.id, mutual.icon)} className="rounded img-fluid" />
								</div>
								<div className="align-self-center my-auto px-3">
									<span className={`${utilStyles.fontType3}`}>{mutual.name}</span>
								</div>
							</div>
						</div>
					</div>
					{options.map((item, index) => (
						<div key={item.id} className={`row w-100 py-2 mx-auto ${styles.mobStationOption}`} onClick={(event) => materializeEffect(event, effectType.radial)}>
							<div className="col">
								<div className="d-flex">
									<div className={`d-flex align-items-center justify-content-center ${utilStyles.mn36px}`}>
										<FontAwesomeIcon icon={item.icon} />
									</div>
									<div className={`align-self-center my-auto px-3 ${utilStyles.fontType2} ${styles.WIP}`}>{item.label}</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</>
		);
	};

	const stationPlusOptions = [
		{ id: "stationPlusUpNext", label: "Up Next" },
		{ id: "stationPlusLyrics", label: "Lyrics" },
	];

	const createMobStationPlusOptions = () => {
		return (
			<>
				<div
					className={`w-100 ${utilStyles.zN1} ${clsx({
						[styles.coverContainer]: stationPlus,
						[styles.activeContainer]: stationPlus,
						[styles.deactiveContainer]: stationPlusDeactive,
					})}`}
				/>
				<div
					className={`container rounded-top px-0 py-2 mt-auto mb-0 ${styles.mobStationPlusOptionsContainer} ${clsx({
						[styles.activeContainer]: stationCard,
						[styles.deactiveContainer]: stationCardDeactive,
						[styles.activeOptionsContainer]: stationPlus,
						[styles.deactiveOptionsContainer]: stationPlusDeactive,
						[utilStyles.z9]: stationCard,
						[utilStyles.zN1]: mobStationOptions,
						[styles.activeStationOptions]: mobStationOptions,
					})}`}
					onClick={(event) => {
						developDynamicAnimation(event);
						if (stationPlus)
							dynamicClick(event, () => {
								setStationPlusDeactive(true);
								setTimeout(() => {
									setStationPlus(false);
									setMobStationQueueOption(false);
									setMobStationLyricOptions(false);
								}, 500);
							});
					}}
				>
					<div className="d-flex justify-content-center justify-space-between mx-auto px-3 text-center text-uppercase">
						{stationPlusOptions.map((item, index) => {
							const optionActive = (index === 0 && mobStationQueueOption) || (index === 1 && mobStationLyricOption);
							return (
								<div
									key={item.id}
									className={`d-flex mt-2 py-2 w-100 overflow-hidden ${utilStyles.colorAdjust4} ${styles.mobStationPlusOptions} ${clsx({
										[styles.activeContainer]: optionActive,
										[utilStyles.colorAdjust3]: optionActive,
									})}`}
									onClick={(event) => {
										materializeEffect(event, effectType.radial);
										setStationPlus(true);
										setStationPlusDeactive(false);
										setMobStationQueueOption(index === 0);
										setMobStationLyricOptions(index === 1);
									}}
								>
									<span className={`text-center align-self-center m-auto ${utilStyles.fontType2} ${clsx({ [styles.WIP]: index === 1 })}`}>{item.label}</span>
								</div>
							);
						})}
					</div>
					{stationPlus && (
						<div className={`container d-flex flex-column py-0 px-0 align-items-center ${utilStyles.z999} ${styles.mobStationPlusContainer}`}>
							{mobStationQueueOption &&
								queueData.map((item, index) => {
									if (index < stationPosition && !stationRepeat[1]) return;

									return (
										<div
											key={item.id}
											className={`row w-100 py-2 mx-auto ${styles.mobStationOption} ${clsx({ ["bg-transparent"]: index != stationPosition })}`}
											onClick={(event) => materializeEffect(event, effectType.radial)}
										>
											<div className="col">
												<div className="d-flex">
													<div className={`d-flex align-items-center justify-content-center ${utilStyles.mn36px} ${styles.mobStationOptionWrapper}`}>
														<img alt={"thumbnail"} src={item.thumbnail} className="rounded img-fluid" />
													</div>
													<div className="align-self-center my-auto px-3">
														<div className="d-flex flex-column">
															{/* make sure these 2 are centered vertically */}
															<span className={utilStyles.fontType2}>{item.title}</span>
															<span className={`${utilStyles.fontType2} ${utilStyles.colorAdjust4}`}>{item.channel}</span>
														</div>
													</div>
												</div>
											</div>
										</div>
									);
								})}
						</div>
					)}
				</div>
			</>
		);
	};

	// basically same as createQueue for desktop
	// uses the same pattern for station option popup card
	// const createMobStationPlus = () => {
	// 	return (
	// 		<>
	// 			<div
	// 				className={`${utilStyles.z99} ${styles.optionsCoverContainer} ${clsx({
	// 					[styles.activeContainer]: mobStationOptions,
	// 					[styles.deactiveContainer]: mobStationOptionsDeactive,
	// 				})}`}
	// 			/>
	// 			{/* replace with header multi reference handler */}
	// 			<div
	// 				className={`container d-flex flex-column py-0 px-0 align-items-center ${utilStyles.z999} ${styles.mobStationPlusContainer} ${clsx({
	// 					[styles.activeContainer]: mobStationOptions,
	// 					[styles.deactiveContainer]: mobStationOptionsDeactive,
	// 				})}`}
	// 				ref={plusRef}
	// 			>
	// 				{mobStationQueueOption &&
	// 					queueData.map((item, index) => (
	// 						<div key={item.id} className={`row w-100 py-2 mx-auto ${styles.mobStationOption}`} onClick={(event) => materializeEffect(event, effectType.radial)}>
	// 							<div className="col">
	// 								<div className="d-flex">
	// 									<div className={`d-flex align-items-center justify-content-center ${utilStyles.mn36px} ${styles.mobStationOptionWrapper}`}>
	// 										<img src={item.thumbnail} className="rounded img-fluid" />
	// 									</div>
	// 									<div className="align-self-center my-auto px-3">
	// 										<div className="d-flex flex-column">
	// 											<span className={utilStyles.fontType2}>{item.title}</span>
	// 											<span className={`${utilStyles.fontType2} ${utilStyles.colorAdjust1}`}>{item.channel}</span>
	// 										</div>
	// 									</div>
	// 								</div>
	// 							</div>
	// 						</div>
	// 					))}
	// 			</div>
	// 		</>
	// 	);
	// };

	const createQueue = () => {
		return (
			<>
				{/* ${styles.stationQueueInfo} */}
				<div className={`d-flex align-items-center justify-content-between`}>
					<p className={`text-uppercase ${utilStyles.fontType12} ${utilStyles.fontAdjust3} ${utilStyles.colorAdjust2}`}>
						{stationRepeat[1] ? queueData.length : queueData.length - stationPosition} songs in queue
					</p>
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
													<a className={`${styles.stationTrackTitle} ${utilStyles.colorAdjust2}`} href={url} target="_blank">
														{title}
													</a>
												</div>
												<div className={styles.stationTrackInfoDivider} />
												<span className={`d-inline-block ${utilStyles.colorAdjust1}`}>{humanizeMs(durationMs)}</span>
											</div>
											<div className="d-flex align-items-center mt-3 justify-content-between">
												<div className="d-flex align-items-center">
													<Image alt={username} src={avatar} quality={100} className="rounded-circle" width={18} height={18} />
													<span className={`ml-2 ${utilStyles.colorAdjust1} ${styles.stationTrackInfoRequester}`}>{username}</span>
												</div>
												{(index > stationPosition || (index < stationPosition && stationRepeat[1])) && (
													<div className="flex-shrink-0">
														<button
															aria-label={"Remove track"}
															className="position-relative bg-transparent"
															onClick={() => {
																handleTrackRemoved(index);
															}}
														>
															<FontAwesomeIcon
																icon={icon(faXmark)}
																width={16}
																height={16}
																className={`d-block h-100 w-100 ${utilStyles.colorAdjust1} ${styles.stationTrackRemoveBtn}`}
															/>
														</button>
													</div>
												)}
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

	const handleMarqueeFinish = () => {
		const marqueeContainer = document.querySelector(".marquee-container");
		const marqueeChildren = marqueeContainer.querySelectorAll(".marquee");

		marqueeChildren.forEach((marquee) => {
			marquee.style.setProperty("--play", "paused");
		});

		setTimeout(() => {
			marqueeChildren.forEach((marquee) => {
				marquee.style.setProperty("--play", "running");
			});
		}, 1000);
	};

	const handleCardActive = () => {
		setStationCardDeactive(false);
		setStationCard(true);
	};

	const handleCardDeactive = () => {
		setStationCardDeactive(true);
		setTimeout(() => {
			setStationCard(false);
		}, 500);
	};

	const createMobStation = () => {
		const { mutualList } = user;
		return (
			<>
				<div
					className={`w-100 ${utilStyles.zN99} ${clsx({
						[styles.coverContainer]: stationCard,
						[styles.coverCard]: stationCard,
						[styles.activeContainer]: stationCard,
						[styles.deactiveContainer]: stationCardDeactive,
					})}`}
				></div>
				<div
					className={`container px-4 my-auto d-flex flex-column justify-content-start ${utilStyles.posAbs} ${styles.mobStationContainer} ${clsx({
						[styles.activeContainer]: stationCard,
						[styles.deactiveContainer]: stationCardDeactive,
						[utilStyles.z9]: stationCard && !mobStationOptions,
						[utilStyles.zN99]: mobStationOptions || stationPlus,
						[styles.stationOptionPlus]: stationPlus,
						// justify-content-between
						["py-3"]: winHeight >= 700,
						["justify-content-center"]: winHeight >= 800,
						["py-2"]: true,
					})}`}
				>
					<div className="row w-100 mx-auto pb-3">
						<div className="col px-0">
							<span className="d-flex h-100 align-items-center justify-content-start">
								<div
									className={`d-flex h-100 ${utilStyles.mnw24px} ${styles.mobCardMutator}`}
									onClick={(event) => {
										materializeEffect(event, effectType.center);
										setStationPlusDeactive(false);
									}}
								>
									<button
										aria-label={"Return to JavStation guild list"}
										className="d-flex bg-transparent align-items-center justify-content-center mt-1 mb-auto mx-auto"
										type="button"
										onClick={handleCardDeactive}
									>
										<span className={`mx-auto ${headerStyles.dropdownBoxArrow} ${styles.dropdownBoxArrow}`} />
									</button>
								</div>
								<div className={`d-flex h-100 w-100`}>
									<div className="align-self-center mx-auto text-truncate">
										<div className={`px-3 py-1 rounded-pill ${styles.mobStationWrapper} ${clsx({ [styles.activeWrapper]: voiceData.userChannel?.voiceId && stationCard })}`}>
											{mutualList.find((m) => m.id === stationId).name}
										</div>
									</div>
								</div>
								<div
									className={`d-flex h-100 ${utilStyles.mnw24px} ${styles.mobCardMutator}`}
									onClick={(event) => {
										event.stopPropagation();
										materializeEffect(event, effectType.center);
										setMobStationGuildOption(false);
										setMobStationOptions(true);
										setMobStationOptionsDeactive(false);
									}}
								>
									<FontAwesomeIcon className="align-self-center align-items-right ml-auto mx-auto" icon={faEllipsisVertical} />
								</div>
							</span>
						</div>
					</div>
					{queueData.length > 0 && (
						<>
							<div className={`row pb-3 align-self-center mx-auto w-100 ${clsx({ ["pt-3"]: winHeight >= 800 })}`}>
								<div className="col-md-6 offset-md-3">
									<div className={styles.thumbnailContainer}>
										<img alt={"thumbnail"} src={queueData[stationPosition].thumbnail} className="rounded" />
									</div>
								</div>
							</div>
							<div className="row pb-3">
								<div className={`d-flex flex-column w-75 align-items-center mx-auto col-md-6 offset-md-3 ${styles.titleContainer}`}>
									<Marquee className={`${styles.maskedOverflow} ${clsx({ ["pb-3"]: winHeight >= 700 })}`} delay={3} speed={25} onCycleComplete={handleMarqueeFinish}>
										<h4 className={`mr-5 mb-0 ${styles.slidingText}`}>{queueData[stationPosition].title}</h4>
									</Marquee>
									<span className={`text-center ${utilStyles.colorAdjust1}`}>{queueData[stationPosition].channel}</span>
								</div>
							</div>
							<div className={`row align-items-center flex-column ${clsx({ ["pb-3"]: winHeight >= 700 })}`}>
								{createSlider()}
								<div className={`d-flex justify-space-between pt-2 ${styles.stationControllerSlider}`}>
									<span ref={trackDataTime} className={`${utilStyles.colorAdjust1}`}>
										0:00
									</span>
									<span className={`ml-auto ${utilStyles.colorAdjust1}`}>{humanizeMs(stationDurationMs.current)}</span>
								</div>
							</div>
							<div className={`row ${clsx({ ["pb-3"]: winHeight >= 800 })}`}>
								<div className={`d-flex align-items-center justify-content-center mx-auto ${styles.stationMutatorContainer}`}>
									<div className={`d-flex ${styles.stationMutatorWrapper}`} onClick={(event) => materializeEffect(event, effectType.center)}>
										<FontAwesomeIcon
											icon={icon(queueMutators[1].icon)}
											width={48}
											height={48}
											style={{ transform: "scale(1.5)" }}
											className={`my-auto ${clsx({ [styles.activeEffect]: stationShuffled })}`}
											onClick={queueMutators[1].handler}
										/>
									</div>
									{trackMutators.map((item, index) => (
										<div
											key={item.id}
											className={`d-flex ${styles.stationMutatorWrapper} ${clsx({ [styles.pauseMutatorWrapper]: index == 1 })}`}
											onClick={(event) => materializeEffect(event, effectType.center)}
										>
											<FontAwesomeIcon
												icon={icon(index === 1 && stationPaused ? faPlay : item.icon)}
												width={48}
												height={48}
												style={{ transform: "scale(1.5)" }}
												className={`my-auto`}
												onClick={trackMutators[index].handler}
											/>
										</div>
									))}
									<div className={`d-flex ${styles.stationMutatorWrapper}`} onClick={(event) => materializeEffect(event, effectType.center)}>
										<FontAwesomeIcon
											icon={icon(queueMutators[0].icon)}
											width={48}
											height={48}
											style={{ transform: "scale(1.5)" }}
											className={`my-auto ${clsx({ [styles.activeAllEffect]: stationRepeat[1], [styles.activeEffect]: stationRepeat[0] })}`}
											onClick={queueMutators[0].handler}
										/>
									</div>
								</div>
							</div>
						</>
					)}
					{queueData.length < 1 && (
						<div className={`row h-100 mt-5`}>
							<div className="col">
								<div className="d-flex flex-column w-100 align-items-center mx-auto">
									<img className="mx-auto w-100" src={"/images/emptyQueue.png"} />
									<div className={`text-center mb-2 ${utilStyles.fontType6}`}>No songs in queue</div>
									<span className={`text-uppercase ${utilStyles.fontType1}`}>
										{/* <span className="text-danger">YT</span> */}
										<div className="d-flex flex-shrink-0 align-items-center my-auto">
											<span className={utilStyles.colorAdjust1}>Supports</span>
											<FontAwesomeIcon icon={faYoutube} width={20} height={20} className="ml-1 w-100 h-100" style={{ color: "#FF0000" }} />
										</div>
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</>
		);
	};

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
											aria-label={item.label}
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

	const createMobUnattendedStation = () => {
		const { mutualList } = user;
		if (!mutualList?.length) return;

		return (
			<div
				className={`container px-4 py-3 ${styles.unattendedContainer} ${clsx({
					[styles.activeContainer]: stationCard,
					[styles.coverContainer]: stationCard,
					[styles.deactiveContainer]: stationCardDeactive,
					[utilStyles.z99]: stationCard && !mobStationOptions,
					[utilStyles.zN99]: mobStationOptions,
				})}`}
			>
				<div className="row pb-3">
					<div className="col-md-6 offset-md-3">
						<span className="d-flex h-100 align-items-center justify-content-start">
							<div className={`d-flex h-100 ${utilStyles.mnw24px} ${styles.mobCardMutator}`} onClick={(event) => materializeEffect(event.currentTarget, effectType.center)}>
								<button
									aria-label="Return to JavStation guild list"
									className="d-flex bg-transparent align-items-center justify-content-center mt-1 mb-auto mx-auto"
									type="button"
									onClick={handleCardDeactive}
								>
									<span className={`mx-auto ${headerStyles.dropdownBoxArrow} ${styles.dropdownBoxArrow}`} />
								</button>
							</div>
							<div className={`d-flex h-100 w-100`}>
								<div className="align-self-center mx-auto text-truncate">
									<div className={`px-3 py-1 rounded-pill ${styles.mobStationWrapper} ${clsx({ [styles.activeWrapper]: voiceData.userChannel?.voiceId && stationCard })}`}>
										{mutualList.find((m) => m.id === stationId).name}
									</div>
								</div>
							</div>
							<div
								className={`d-flex h-100 ${utilStyles.mnw24px} ${styles.mobCardMutator}`}
								onClick={(event) => {
									event.stopPropagation();
									materializeEffect(event, effectType.center);
									setMobStationGuildOption(false);
									setMobStationOptions(true);
									setMobStationOptionsDeactive(false);
								}}
							>
								<FontAwesomeIcon className="align-self-center align-items-right ml-auto mx-auto" icon={faEllipsisVertical} />
							</div>
						</span>
					</div>
				</div>
				<div className={`text-center ${styles.stationUnattended}`}>
					<Image alt="station unattended" src="/images/JavKing_VC_DISCONNECTED.png" quality={100} width={320} height={200} />
					<h2 className={`${utilStyles.fontType15} ${utilStyles.colorAdjust2}`}>
						Please join a <span style={{ color: "#7289da" }}>Discord</span> voice channel to manage JavStation
					</h2>
				</div>
			</div>
		);
	};

	const createUnattendedStation = () => {
		return (
			<div className={`text-center ${styles.stationUnattended}`}>
				<Image alt="station unattended" src="/images/JavKing_VC_DISCONNECTED.png" quality={100} width={320} height={200} />
				<h2 className={`${utilStyles.fontType15} ${utilStyles.colorAdjust2}`}>
					Please join a <span style={{ color: "#7289da" }}>Discord</span> voice channel to manage JavStation
				</h2>
			</div>
		);
	};

	const createEmptyTrackData = () => {
		return <div className={`py-2 ${utilStyles.fontType2} ${utilStyles.colorAdjust2}`}>No Music Playing</div>;
	};

	const createTrackData = () => {
		const {
			title,
			requester: { username, avatar },
		} = queueData[stationPosition];

		return (
			<>
				<div className="position-relative d-inline-block">
					<span className={`${utilStyles.fontType12} ${utilStyles.colorAdjust2} ${styles.stationQueueTrackInfo}`}>{title}</span>
				</div>
				<div className={`d-flex align-items-center mt-1 ${utilStyles.colorAdjust1}`}>
					<Image alt={username} src={avatar} quality={100} className="rounded-circle" width={18} height={18} />
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
					<div className={styles.inputSlider} ref={inputSliderRef} style={{}} onMouseDown={handleSliderMouseDown} />
				</div>
			</div>
		);
	};

	return (
		<div className={`d-flex h-100 flex-column ${clsx({ [styles.mobStationStyle]: winWidth < 768 })}`}>
			{winWidth >= 768 && <Canvas />}
			<Header JavStation={true} />

			{winWidth < 768 && (
				<main className={`d-flex flex-column overflow-auto h-100 ${styles.stationContainer}`}>
					{createMobGuildList()}
					{voiceData.userChannel?.voiceId && stationCard ? createMobStation() : stationCard ? createMobUnattendedStation() : ""}
					{stationCard && queueData.length > 0 && createMobStationPlusOptions()}
					{mobStationOptions && createMobStationOptions()}
					{/* {stationPlus && createMobStationPlus()} */}
				</main>
			)}

			{winWidth >= 768 && (
				<>
					<main className={`d-flex overflow-auto h-100 ${styles.stationContainer} ${clsx({ [styles.coverContainer]: !voiceData.userChannel?.voiceId })}`}>
						{createGuildList()}
						{voiceData.userChannel?.voiceId ? createStation() : createUnattendedStation()}
					</main>

					<footer className={`mastfoot d-flex flex-column mb-0 mt-auto w-100 ${styles.stationController}`}>
						{queueData.length > 0 && createSlider()}
						<div className={`d-flex flex-wrap h-100 align-items-center ${styles.stationControllerWrapper}`}>
							<div className={styles.trackDataSection}>{stationPosition < queueData.length ? createTrackData() : createEmptyTrackData()}</div>
							<div
								className={`d-flex justify-content-center align-items-center ${styles.trackControlSection} ${styles.trackDataSection} ${
									queueData.length ? styles.trackAvailable : styles.trackEmpty
								}`}
							>
								{trackMutators.map((item, index) => (
									<div key={item.id}>
										<button aria-label={item.label} className={`btn-group ${styles.trackMutator}`} onClick={item.handler}>
											<FontAwesomeIcon
												icon={icon(index === 1 && stationPaused ? faPlay : item.icon)}
												width={index === 1 ? 40 : 24}
												height={index === 1 ? 40 : 24}
												className={`d-block w-100 h-100 ${styles.mutatorBtn} ${clsx({ [styles.activeEffect]: index === 1 && stationPaused })}`}
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
										<button aria-label={item.label} className={`btn-group ${styles.queueMutator}`} onClick={item.handler}>
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
				</>
			)}
		</div>
	);
}

export default JavStation;
