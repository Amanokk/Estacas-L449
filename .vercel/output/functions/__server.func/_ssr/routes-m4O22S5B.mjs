import { i as __toESM } from "../_runtime.mjs";
import { L as require_jsx_runtime, R as require_react, _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as haversine, c as pointAtChainage, d as putPhoto, h as useOnlineStatus, l as polylineLength, m as sharePhoto, n as STREETS, p as savePhoto, r as addExif, s as loadMiniMapImage, t as MiniMapThumb, u as projectOnPolyline } from "./MiniMapThumb-ByCEAEvR.mjs";
import { d as FileDown, l as LocateFixed, m as Camera, n as ZoomOut, o as Share2, r as X, s as Settings2, t as ZoomIn, u as Images } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-m4O22S5B.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Splash() {
	const [visible, setVisible] = (0, import_react.useState)(true);
	const [fading, setFading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t1 = setTimeout(() => setFading(true), 1100);
		const t2 = setTimeout(() => setVisible(false), 1600);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, []);
	if (!visible) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `fixed inset-0 z-50 grid place-items-center bg-bg transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/app-icon-192.png",
					alt: "Ícone do app Estaca GPS",
					width: 96,
					height: 96,
					className: "mx-auto h-24 w-24 rounded-2xl"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 font-display text-2xl font-semibold tracking-tight text-fg",
					children: "Estaca GPS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs uppercase tracking-[0.25em] text-muted",
					children: "Retiro São Joaquim"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 text-sm font-semibold text-accent",
					children: "By Vitor Lucas"
				})
			]
		})
	});
}
var KEY$1 = "estacagps:photos";
function getPhotoLog() {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(KEY$1);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function addPhotoLog(entry) {
	if (typeof localStorage === "undefined") return;
	const list = getPhotoLog();
	list.push(entry);
	try {
		localStorage.setItem(KEY$1, JSON.stringify(list.slice(-2e3)));
	} catch {}
}
function cell(v) {
	return `"${(v === null || v === void 0 ? "" : String(v)).replace(/"/g, "\"\"")}"`;
}
function fmt(iso) {
	const d = new Date(iso);
	const p = (n) => String(n).padStart(2, "0");
	return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function exportPhotoLogCsv() {
	const list = getPhotoLog();
	const header = [
		"Arquivo",
		"Data/hora",
		"Latitude",
		"Longitude",
		"Rua",
		"Estaca"
	];
	const rows = list.map((e) => [
		cell(e.file),
		cell(fmt(e.timestamp)),
		cell(e.lat),
		cell(e.lng),
		cell(e.street),
		cell(e.estaca)
	].join(","));
	const csv = "﻿" + [header.map(cell).join(","), ...rows].join("\r\n");
	const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = `estacas-fotos-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 2e3);
	return list.length;
}
var DEFAULT_CAMERA_SETTINGS = {
	clock24h: true,
	showSeconds: false,
	showDate: true,
	timeOffsetMin: 0,
	timeOffsetSec: 0,
	customDate: null,
	opacity: .75,
	size: "medio",
	mapSide: "esquerda",
	showMap: true,
	showCoords: true,
	showAddress: true
};
var SIZE_FACTOR = {
	pequeno: .75,
	medio: 1,
	grande: 1.35
};
var KEY = "estacagps.camera.settings";
function loadCameraSettings() {
	if (typeof localStorage === "undefined") return DEFAULT_CAMERA_SETTINGS;
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return DEFAULT_CAMERA_SETTINGS;
		return {
			...DEFAULT_CAMERA_SETTINGS,
			...JSON.parse(raw)
		};
	} catch {
		return DEFAULT_CAMERA_SETTINGS;
	}
}
function saveCameraSettings(s) {
	try {
		localStorage.setItem(KEY, JSON.stringify(s));
	} catch {}
}
function stampNow(settings, base = /* @__PURE__ */ new Date()) {
	const d = new Date(base.getTime() + settings.timeOffsetMin * 6e4 + (settings.timeOffsetSec || 0) * 1e3);
	if (settings.customDate) {
		const [y, m, day] = settings.customDate.split("-").map(Number);
		if (y && m && day) d.setFullYear(y, m - 1, day);
	}
	return d;
}
function formatStamp(d, s) {
	const p = (n) => String(n).padStart(2, "0");
	let h = d.getHours();
	let suffix = "";
	if (!s.clock24h) {
		suffix = h >= 12 ? " PM" : " AM";
		h = h % 12 || 12;
	}
	const time = `${p(h)}:${p(d.getMinutes())}${s.showSeconds ? `:${p(d.getSeconds())}` : ""}${suffix}`;
	if (!s.showDate) return time;
	return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${time}`;
}
var ZOOM_MIN = 1;
var ZOOM_MAX = 4;
var ZOOM_STEP = .05;
var StampClock = (0, import_react.memo)(function StampClock({ settings }) {
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		const t = setInterval(() => setNow(/* @__PURE__ */ new Date()), settings.showSeconds ? 1e3 : 3e4);
		return () => clearInterval(t);
	}, [settings.showSeconds]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: formatStamp(stampNow(settings, now), settings) });
});
function mockCameraStream() {
	const canvas = document.createElement("canvas");
	canvas.width = 1280;
	canvas.height = 720;
	const ctx = canvas.getContext("2d");
	let frame = 0;
	let raf = 0;
	const draw = () => {
		frame += 1;
		const w = canvas.width;
		const h = canvas.height;
		const sky = ctx.createLinearGradient(0, 0, 0, h * .45);
		sky.addColorStop(0, "#7eb6d9");
		sky.addColorStop(1, "#c5d8e8");
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, w, h * .45);
		ctx.fillStyle = "#3a4a38";
		ctx.fillRect(0, h * .42, w, h * .18);
		ctx.fillStyle = "#2a2a2c";
		ctx.fillRect(0, h * .58, w, h * .42);
		ctx.fillStyle = "#f5c518";
		const dash = 48;
		const offset = frame * 3 % 96;
		for (let x = -48 + offset; x < w; x += 96) ctx.fillRect(x, h * .78, dash, 8);
		raf = requestAnimationFrame(draw);
	};
	draw();
	const stream = canvas.captureStream(24);
	const stop = stream.getTracks()[0]?.stop.bind(stream.getTracks()[0]);
	stream.getTracks()[0].stop = () => {
		cancelAnimationFrame(raf);
		stop?.();
	};
	return stream;
}
async function openWideCamera() {
	if (!navigator.mediaDevices?.getUserMedia) return {
		stream: mockCameraStream(),
		mock: true
	};
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: {
				facingMode: { ideal: "environment" },
				width: { ideal: 1280 },
				height: { ideal: 720 },
				frameRate: {
					ideal: 24,
					max: 30
				}
			}
		});
		const track = stream.getVideoTracks()[0];
		if (track) {
			const caps = track.getCapabilities?.() ?? {};
			if (caps.zoom && caps.zoom.min < caps.zoom.max) await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min }] }).catch(() => void 0);
		}
		return {
			stream,
			mock: false
		};
	} catch {
		return {
			stream: mockCameraStream(),
			mock: true
		};
	}
}
function CameraCapture({ stamp, onClose }) {
	const videoRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const mapImgRef = (0, import_react.useRef)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [shot, setShot] = (0, import_react.useState)(null);
	const [rawShot, setRawShot] = (0, import_react.useState)(null);
	const [fileName, setFileName] = (0, import_react.useState)("foto");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const savingRef = (0, import_react.useRef)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [sharing, setSharing] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)(null);
	const boxRef = (0, import_react.useRef)(null);
	const stampDateRef = (0, import_react.useRef)(/* @__PURE__ */ new Date());
	const [usingMock, setUsingMock] = (0, import_react.useState)(false);
	const [zoom, setZoom] = (0, import_react.useState)(ZOOM_MIN);
	const zoomRef = (0, import_react.useRef)(ZOOM_MIN);
	zoomRef.current = zoom;
	const [settings, setSettings] = (0, import_react.useState)(DEFAULT_CAMERA_SETTINGS);
	const [showSettings, setShowSettings] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setSettings(loadCameraSettings()), []);
	const update = (patch) => setSettings((prev) => {
		const next = {
			...prev,
			...patch
		};
		saveCameraSettings(next);
		return next;
	});
	const [angle, setAngle] = (0, import_react.useState)(0);
	const [landscape, setLandscape] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const read = () => {
			const so = window.screen?.orientation;
			const a = typeof so?.angle === "number" ? so.angle : window.orientation ?? 0;
			setAngle((a % 360 + 360) % 360);
			setLandscape(window.innerWidth > window.innerHeight);
		};
		read();
		window.addEventListener("resize", read);
		window.screen?.orientation?.addEventListener?.("change", read);
		return () => {
			window.removeEventListener("resize", read);
			window.screen?.orientation?.removeEventListener?.("change", read);
		};
	}, []);
	const layoutRotation = landscape ? angle === 180 ? 180 : 0 : angle === 180 ? -90 : 90;
	(0, import_react.useEffect)(() => {
		if (stamp.lat === null || stamp.lng === null) {
			mapImgRef.current = null;
			return;
		}
		const center = {
			lat: stamp.lat,
			lng: stamp.lng
		};
		loadMiniMapImage(center, 320, { user: center }).then((img) => {
			mapImgRef.current = img;
		}).catch(() => {
			mapImgRef.current = null;
		});
	}, [stamp.lat, stamp.lng]);
	const attachingRef = (0, import_react.useRef)(false);
	const attachStream = (0, import_react.useCallback)(async () => {
		const v = videoRef.current;
		if (!v || attachingRef.current) return;
		attachingRef.current = true;
		try {
			let s = streamRef.current;
			if (!(!!s && s.getVideoTracks().some((t) => t.readyState === "live"))) try {
				const opened = await openWideCamera();
				s = opened.stream;
				streamRef.current = s;
				setUsingMock(opened.mock);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Não foi possível abrir a câmera.");
				return;
			}
			if (v.srcObject !== s) {
				v.srcObject = s;
				v.muted = true;
				v.playsInline = true;
			}
			if (v.paused) try {
				await v.play();
			} catch {
				setTimeout(() => void v.play().catch(() => void 0), 150);
			}
		} finally {
			attachingRef.current = false;
		}
	}, []);
	(0, import_react.useEffect)(() => {
		attachStream();
		return () => {
			streamRef.current?.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		};
	}, [attachStream]);
	(0, import_react.useEffect)(() => {
		if (!shot) attachStream();
	}, [shot, attachStream]);
	const pinchRef = (0, import_react.useRef)(null);
	const onTouchStart = (e) => {
		if (e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			pinchRef.current = {
				dist: Math.hypot(dx, dy),
				zoom: zoomRef.current
			};
		}
	};
	const onTouchMove = (e) => {
		if (e.touches.length !== 2 || !pinchRef.current) return;
		e.preventDefault();
		const dx = e.touches[0].clientX - e.touches[1].clientX;
		const dy = e.touches[0].clientY - e.touches[1].clientY;
		const dist = Math.hypot(dx, dy);
		const next = pinchRef.current.zoom * (dist / pinchRef.current.dist);
		setZoom(Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)) / ZOOM_STEP) * ZOOM_STEP);
	};
	const onTouchEnd = () => {
		pinchRef.current = null;
	};
	const lines = (0, import_react.useMemo)(() => settings.showAddress ? [
		stamp.street ?? "Retiro São Joaquim",
		"Retiro São Joaquim",
		"Itaboraí",
		"Rio de Janeiro"
	] : [], [settings.showAddress, stamp.street]);
	const coords = (0, import_react.useMemo)(() => settings.showCoords && stamp.lat !== null && stamp.lng !== null ? `${stamp.lat.toFixed(6)}, ${stamp.lng.toFixed(6)}` : null, [
		settings.showCoords,
		stamp.lat,
		stamp.lng
	]);
	const alpha = Math.min(1, Math.max(0, settings.opacity ?? .75));
	const capture = (0, import_react.useCallback)(async () => {
		const video = videoRef.current;
		if (!video || !video.videoWidth) return;
		const source = video;
		const vw = video.videoWidth;
		const vh = video.videoHeight;
		const z = zoomRef.current;
		const cropW = vw / z;
		const cropH = vh / z;
		const sx = (vw - cropW) / 2;
		const sy = (vh - cropH) / 2;
		const portrait = cropH > cropW;
		const clockwise = angle === 180;
		const fullW = portrait ? cropH : cropW;
		const fullH = portrait ? cropW : cropH;
		const target = 16 / 9;
		let w = fullW;
		let h = fullH;
		if (fullW / fullH > target) w = Math.round(fullH * target);
		else h = Math.round(fullW / target);
		const dx = Math.round((fullW - w) / 2);
		const dy = Math.round((fullH - h) / 2);
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(w));
		canvas.height = Math.max(1, Math.round(h));
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.save();
		ctx.translate(-dx, -dy);
		if (portrait) {
			if (clockwise) {
				ctx.translate(fullW, 0);
				ctx.rotate(Math.PI / 2);
			} else {
				ctx.translate(0, fullH);
				ctx.rotate(-Math.PI / 2);
			}
		} else if (angle === 180) {
			ctx.translate(fullW, fullH);
			ctx.rotate(Math.PI);
		}
		ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
		ctx.restore();
		const dateForRaw = stampNow(settings);
		setRawShot(addExif(canvas.toDataURL("image/jpeg", .92), {
			lat: stamp.lat,
			lng: stamp.lng,
			estaca: stamp.estaca,
			street: stamp.street,
			date: dateForRaw
		}));
		const s = w / 1600 * SIZE_FACTOR[settings.size];
		const date = stampNow(settings);
		{
			const text = stamp.estaca ?? "Sem estaca";
			ctx.font = `800 ${Math.round(56 * s)}px "IBM Plex Sans", system-ui, sans-serif`;
			const tw = ctx.measureText(text).width;
			const padX = 24 * s;
			const padY = 16 * s;
			const boxH = Math.round(76 * s);
			ctx.fillStyle = `rgba(15,23,42,${alpha})`;
			ctx.fillRect(24 * s, 24 * s, tw + padX * 2, boxH);
			ctx.fillStyle = "#f5c518";
			ctx.textBaseline = "top";
			ctx.fillText(text, 24 * s + padX, 24 * s + padY);
			boxRef.current = {
				x: Math.round(24 * s),
				y: Math.round(24 * s),
				w: Math.round(tw + padX * 2),
				h: boxH,
				fontSize: Math.round(56 * s)
			};
		}
		stampDateRef.current = date;
		const stampLines = [
			formatStamp(date, settings),
			...lines,
			...coords ? [coords] : []
		];
		const fs = Math.round(40 * s);
		ctx.font = `600 ${fs}px "IBM Plex Sans", system-ui, sans-serif`;
		const maxW = Math.max(...stampLines.map((l) => ctx.measureText(l).width), 1);
		const lineH = fs * 1.25;
		const padX2 = 24 * s;
		const padY2 = 18 * s;
		const boxW = maxW + padX2 * 2;
		const boxH2 = stampLines.length * lineH + padY2 * 2;
		const bx = w - boxW;
		const by = h - boxH2;
		ctx.fillStyle = `rgba(0,0,0,${alpha})`;
		ctx.fillRect(bx, by, boxW, boxH2);
		ctx.fillStyle = "#ffffff";
		ctx.textBaseline = "top";
		ctx.textAlign = "right";
		stampLines.forEach((l, i) => {
			ctx.fillText(l, bx + boxW - padX2, by + padY2 + i * lineH);
		});
		ctx.textAlign = "left";
		const mapImg = mapImgRef.current;
		if (mapImg && settings.showMap) {
			const mapS = boxH2;
			const mx = settings.mapSide === "direita" ? w - mapS : 0;
			const my = h - mapS;
			ctx.save();
			ctx.globalAlpha = Math.max(.2, alpha + .2);
			ctx.drawImage(mapImg, mx, my, mapS, mapS);
			ctx.restore();
		}
		setShot(addExif(canvas.toDataURL("image/jpeg", .92), {
			lat: stamp.lat,
			lng: stamp.lng,
			estaca: stamp.estaca,
			street: stamp.street,
			date
		}));
		const p = (n) => String(n).padStart(2, "0");
		const real = /* @__PURE__ */ new Date();
		setFileName(`${stamp.estaca ?? "foto"}-${p(date.getDate())}${p(date.getMonth() + 1)}${date.getFullYear()}-${p(real.getHours())}${p(real.getMinutes())}${p(real.getSeconds())}-${String(real.getMilliseconds()).padStart(3, "0")}`);
	}, [
		alpha,
		angle,
		coords,
		lines,
		settings,
		stamp.estaca,
		stamp.lat,
		stamp.lng,
		stamp.street
	]);
	const persist = (0, import_react.useCallback)(async () => {
		if (!shot || savingRef.current) return;
		savingRef.current = true;
		setSaving(true);
		addPhotoLog({
			file: `${fileName}.jpg`,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			lat: stamp.lat,
			lng: stamp.lng,
			street: stamp.street,
			estaca: stamp.estaca
		});
		await putPhoto({
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			file: `${fileName}.jpg`,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			stampDate: stampDateRef.current.toISOString(),
			lat: stamp.lat,
			lng: stamp.lng,
			street: stamp.street,
			estaca: stamp.estaca,
			stamped: shot,
			raw: rawShot,
			box: boxRef.current
		});
		savingRef.current = false;
		setSaving(false);
		setSaved(true);
		setStatus("Foto guardada no app. Use Salvar para baixar.");
	}, [
		fileName,
		rawShot,
		shot,
		stamp.estaca,
		stamp.lat,
		stamp.lng,
		stamp.street
	]);
	(0, import_react.useEffect)(() => {
		if (shot && !saved && !savingRef.current) persist();
	}, [
		persist,
		saved,
		shot
	]);
	const downloadShot = async () => {
		if (!shot) return;
		const res = await savePhoto(shot, fileName);
		if (rawShot) await savePhoto(rawShot, `${fileName}-original`);
		setStatus(res.message);
	};
	const sendWhatsApp = async () => {
		if (!shot || sharing) return;
		setSharing(true);
		const legenda = [
			stamp.estaca ? `Estaca ${stamp.estaca}` : null,
			stamp.street,
			formatStamp(stampNow(settings), settings)
		].filter(Boolean).join(" · ");
		const res = await sharePhoto(shot, fileName, legenda);
		setSharing(false);
		setStatus(res.message);
	};
	const bumpZoom = (delta) => {
		setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) / ZOOM_STEP) * ZOOM_STEP)));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 overflow-hidden",
				onTouchStart,
				onTouchMove,
				onTouchEnd,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: videoRef,
					playsInline: true,
					muted: true,
					autoPlay: true,
					className: "h-full w-full object-cover",
					style: {
						transform: `scale(${zoom}) translateZ(0)`,
						transformOrigin: "center center",
						backfaceVisibility: "hidden",
						visibility: shot ? "hidden" : "visible",
						willChange: "transform"
					}
				})
			}),
			shot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: shot,
				alt: "Foto capturada com carimbo de estaca e data",
				className: "absolute inset-0 h-full w-full object-contain"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute left-1/2 top-1/2 origin-center",
				style: {
					width: landscape ? "100dvw" : "100dvh",
					height: landscape ? "100dvh" : "100dvw",
					transform: `translate(-50%, -50%) rotate(${layoutRotation}deg) translateZ(0)`,
					willChange: "transform",
					contain: "layout paint"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute left-3 top-3 rounded-xl px-3 py-1.5 font-black text-accent shadow-lg ring-1 ring-accent/30",
						style: {
							fontSize: `${1.25 * SIZE_FACTOR[settings.size]}rem`,
							backgroundColor: `rgba(15,23,42,${alpha})`
						},
						children: stamp.estaca ?? "Sem estaca"
					}),
					stamp.lat !== null && stamp.lng !== null && settings.showMap && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniMapThumb, {
						center: {
							lat: stamp.lat,
							lng: stamp.lng
						},
						className: `absolute bottom-3 rounded-xl object-cover ring-1 ring-fg/25 ${settings.mapSide === "direita" ? "right-3" : "left-3"}`,
						style: {
							height: `${6 * SIZE_FACTOR[settings.size]}rem`,
							width: `${6 * SIZE_FACTOR[settings.size]}rem`,
							opacity: Math.max(.2, alpha + .2)
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute bottom-3 right-3 rounded-xl px-3 py-2 text-right font-semibold leading-snug text-fg ring-1 ring-fg/15",
						style: {
							fontSize: `${.75 * SIZE_FACTOR[settings.size]}rem`,
							backgroundColor: `rgba(0,0,0,${alpha})`
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-accent",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StampClock, { settings })
							}),
							lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: l }, l)),
							coords && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-fg/80",
								children: coords
							})
						]
					}),
					!landscape && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[11px] font-semibold text-fg/60",
						children: "Vire o celular de lado"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 rounded-full border border-border bg-bg/80 px-4 py-2 shadow-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-semibold uppercase tracking-wide text-muted",
							children: "Estaca na foto"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `text-base font-black ${stamp.estaca ? "text-accent" : "text-danger"}`,
							children: stamp.estaca ?? "Sem estaca"
						}),
						usingMock && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted",
							children: "Prévia"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Configurações da câmera",
				onClick: () => setShowSettings((v) => !v),
				className: "absolute right-3 top-3 rounded-full bg-surface/90 p-2.5 text-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "h-5 w-5" })
			}),
			showSettings && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-3 top-16 max-h-[70dvh] space-y-4 overflow-y-auto rounded-2xl bg-surface/95 p-4 text-sm text-fg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-bold",
							children: "Configurações do carimbo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Fechar configurações",
							onClick: () => setShowSettings(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-semibold uppercase tracking-wide text-muted",
								children: "Hora"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2",
								children: [{
									l: "24h",
									v: true
								}, {
									l: "12h (AM/PM)",
									v: false
								}].map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => update({ clock24h: o.v }),
									className: `flex-1 rounded-lg px-3 py-2 font-semibold ${settings.clock24h === o.v ? "bg-accent text-accent-fg" : "bg-subtle"}`,
									children: o.l
								}, o.l))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between rounded-lg bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mostrar segundos" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: settings.showSeconds,
									onChange: (e) => update({ showSeconds: e.target.checked }),
									className: "h-4 w-4 accent-accent"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between rounded-lg bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mostrar data" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: settings.showDate,
									onChange: (e) => update({ showDate: e.target.checked }),
									className: "h-4 w-4 accent-accent"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Data do carimbo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "date",
									value: settings.customDate ?? "",
									onChange: (e) => update({ customDate: e.target.value || null }),
									className: "rounded bg-bg px-2 py-1"
								})]
							}),
							settings.customDate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => update({ customDate: null }),
								className: "w-full rounded-lg bg-subtle px-3 py-2 text-[12px] font-semibold text-accent",
								children: "Usar a data de hoje"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Ajuste de minutos" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									value: settings.timeOffsetMin,
									onChange: (e) => update({ timeOffsetMin: Number(e.target.value) || 0 }),
									className: "w-20 rounded bg-bg px-2 py-1 text-right"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Ajuste de segundos" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									value: settings.timeOffsetSec ?? 0,
									onChange: (e) => update({ timeOffsetSec: Number(e.target.value) || 0 }),
									className: "w-20 rounded bg-bg px-2 py-1 text-right"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-muted",
								children: ["Prévia: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StampClock, { settings })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-semibold uppercase tracking-wide text-muted",
								children: "Transparência do layout"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: 100,
								step: 5,
								value: Math.round(alpha * 100),
								onChange: (e) => update({ opacity: Number(e.target.value) / 100 }),
								className: "w-full accent-accent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-muted",
								children: [
									"Fundo do carimbo: ",
									Math.round(alpha * 100),
									"% opaco"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-semibold uppercase tracking-wide text-muted",
							children: "Tamanho"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2",
							children: [
								"pequeno",
								"medio",
								"grande"
							].map((sz) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => update({ size: sz }),
								className: `flex-1 rounded-lg px-3 py-2 font-semibold capitalize ${settings.size === sz ? "bg-accent text-accent-fg" : "bg-subtle"}`,
								children: sz === "medio" ? "médio" : sz
							}, sz))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-semibold uppercase tracking-wide text-muted",
								children: "Layout"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between rounded-lg bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mostrar mini mapa" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: settings.showMap,
									onChange: (e) => update({ showMap: e.target.checked }),
									className: "h-4 w-4 accent-accent"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2",
								children: ["esquerda", "direita"].map((side) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => update({ mapSide: side }),
									className: `flex-1 rounded-lg px-3 py-2 font-semibold capitalize ${settings.mapSide === side ? "bg-accent text-accent-fg" : "bg-subtle"}`,
									children: ["Mapa à ", side]
								}, side))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between rounded-lg bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mostrar endereço" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: settings.showAddress,
									onChange: (e) => update({ showAddress: e.target.checked }),
									className: "h-4 w-4 accent-accent"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between rounded-lg bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mostrar coordenadas" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: settings.showCoords,
									onChange: (e) => update({ showCoords: e.target.checked }),
									className: "h-4 w-4 accent-accent"
								})]
							})
						]
					})
				]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-xl bg-surface p-4 text-center text-sm text-danger",
				children: error
			}),
			shot && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-24 space-y-1 px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-[11px] font-semibold uppercase tracking-wide text-muted",
						children: ["Nome do arquivo · pasta ", "EstacaGPS"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-xl bg-surface/85 px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: fileName,
							onChange: (e) => setFileName(e.target.value),
							className: "min-w-0 flex-1 bg-transparent text-sm text-fg outline-none",
							placeholder: "nome-da-foto"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted",
							children: ".jpg"
						})]
					}),
					status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-accent",
						children: status
					}),
					saving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted",
						children: "Salvando…"
					})
				]
			}),
			!shot && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-border bg-bg/80 p-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Aumentar zoom",
						onClick: () => bumpZoom(.25),
						className: "grid h-11 w-11 place-items-center rounded-full bg-fg/10 text-accent active:scale-95",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomIn, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						"aria-label": "Zoom digital da câmera",
						min: ZOOM_MIN,
						max: ZOOM_MAX,
						step: ZOOM_STEP,
						value: zoom,
						onChange: (e) => setZoom(Number(e.target.value)),
						className: "h-28 w-6 accent-accent [writing-mode:vertical-lr] [direction:rtl]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Diminuir zoom",
						onClick: () => bumpZoom(-.25),
						className: "grid h-11 w-11 place-items-center rounded-full bg-fg/10 text-accent active:scale-95",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomOut, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[10px] font-bold tabular-nums text-fg/80",
						children: [zoom.toFixed(1), "×"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: shot ? () => {
							setShot(null);
							setRawShot(null);
							setSaved(false);
							setStatus(null);
						} : onClose,
						className: "rounded-full bg-subtle/90 px-4 py-2 text-sm font-semibold text-fg",
						children: shot ? "Repetir" : "Fechar"
					}),
					shot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void downloadShot(),
							className: "rounded-full bg-subtle px-4 py-2 text-sm font-semibold text-fg",
							children: "Salvar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: sendWhatsApp,
							disabled: sharing,
							"aria-label": "Enviar para o WhatsApp",
							className: "flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2 text-sm font-bold text-fg disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "h-4 w-4" }), sharing ? "Enviando…" : "WhatsApp"]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Tirar foto",
						onClick: () => void capture(),
						className: "h-16 w-16 rounded-full border-4 border-fg bg-fg/30"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-16" })
				]
			})
		]
	});
}
function stakeSpacing(street, totalLength) {
	const delta = street.stakeEnd - street.stakeStart;
	if (delta === 0) return 20;
	return totalLength / delta;
}
function stakeAtChainage(street, chainage, totalLength) {
	const step = stakeSpacing(street, totalLength);
	const exact = street.stakeStart + chainage / step;
	const number = Math.round(exact);
	return {
		number,
		offset: (exact - number) * Math.abs(step)
	};
}
function stakesAlong(street, totalLength) {
	const step = stakeSpacing(street, totalLength);
	const from = Math.ceil(Math.min(street.stakeStart, street.stakeEnd));
	const to = Math.floor(Math.max(street.stakeStart, street.stakeEnd));
	const out = [];
	for (let n = from; n <= to; n++) {
		const chainageM = (n - street.stakeStart) * step;
		if (chainageM < -1 || chainageM > totalLength + 1) continue;
		out.push({
			number: n,
			chainageM: Math.max(0, Math.min(totalLength, chainageM))
		});
	}
	return out;
}
var cache = null;
function getGeometries() {
	if (cache) return cache;
	cache = STREETS.map((street) => {
		const length = polylineLength(street.path);
		const stakes = [];
		for (const { number, chainageM } of stakesAlong(street, length)) {
			const pos = pointAtChainage(street.path, chainageM);
			if (pos) stakes.push({
				street,
				number,
				pos
			});
		}
		return {
			street,
			length,
			stakes
		};
	});
	return cache;
}
var flat = null;
function getAllStakes() {
	if (flat) return flat;
	flat = getGeometries().flatMap((g) => g.stakes);
	return flat;
}
var CELL = .002;
function key(lat, lng) {
	return `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`;
}
var grid = null;
function getGrid() {
	if (grid) return grid;
	grid = /* @__PURE__ */ new Map();
	for (const st of getAllStakes()) {
		const k = key(st.pos.lat, st.pos.lng);
		const bucket = grid.get(k);
		if (bucket) bucket.push(st);
		else grid.set(k, [st]);
	}
	return grid;
}
function stakesInRect(rect, limit) {
	const g = getGrid();
	const out = [];
	const y0 = Math.floor(rect.south / CELL);
	const y1 = Math.floor(rect.north / CELL);
	const x0 = Math.floor(rect.west / CELL);
	const x1 = Math.floor(rect.east / CELL);
	for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
		const bucket = g.get(`${y}:${x}`);
		if (!bucket) continue;
		for (const st of bucket) {
			if (st.pos.lat < rect.south || st.pos.lat > rect.north || st.pos.lng < rect.west || st.pos.lng > rect.east) continue;
			out.push(st);
			if (out.length >= limit) return out;
		}
	}
	return out;
}
var boxes = null;
function getStreetBoxes() {
	if (boxes) return boxes;
	boxes = getGeometries().map((g, index) => {
		let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity;
		for (const p of g.street.path) {
			if (p.lat < south) south = p.lat;
			if (p.lat > north) north = p.lat;
			if (p.lng < west) west = p.lng;
			if (p.lng > east) east = p.lng;
		}
		return {
			index,
			south,
			west,
			north,
			east
		};
	});
	return boxes;
}
var PROJECT_CENTER = {
	lat: -22.7524,
	lng: -42.8935
};
var DEG = 1 / 111320;
function findNearestStake(pos, maxDist = 60) {
	const geoms = getGeometries();
	const pad = maxDist * DEG * 1.5;
	let best = null;
	for (const box of getStreetBoxes()) {
		if (pos.lat < box.south - pad || pos.lat > box.north + pad || pos.lng < box.west - pad || pos.lng > box.east + pad) continue;
		const { street, length } = geoms[box.index];
		const r = projectOnPolyline(pos, street.path);
		if (!r || r.distance > maxDist) continue;
		if (best !== null && r.distance >= best.distance) continue;
		const { number, offset } = stakeAtChainage(street, r.chainage, length);
		const snapped = pointAtChainage(street.path, r.chainage) ?? pos;
		best = {
			street,
			chainage: r.chainage,
			distance: r.distance,
			estaca: number,
			offset,
			snapped
		};
	}
	return best;
}
function quantize(p) {
	return `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
}
var LABEL_MIN_ZOOM = 18;
var STAKE_MIN_ZOOM = 16;
var MAX_VISIBLE_STAKES = 90;
function StakeMap({ position, accuracy, match, follow, onUserDrag, recenterNonce }) {
	const hostRef = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	const LRef = (0, import_react.useRef)(null);
	const streetsLayerRef = (0, import_react.useRef)(null);
	const highlightRef = (0, import_react.useRef)(null);
	const balloonRef = (0, import_react.useRef)(null);
	const userRef = (0, import_react.useRef)(null);
	const accRef = (0, import_react.useRef)(null);
	const stakeLayerRef = (0, import_react.useRef)(null);
	const lastCenterRef = (0, import_react.useRef)(null);
	const followRef = (0, import_react.useRef)(follow);
	followRef.current = follow;
	(0, import_react.useEffect)(() => {
		if (!hostRef.current || mapRef.current) return;
		let cancelled = false;
		import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then((mod) => {
			if (cancelled || !hostRef.current || mapRef.current) return;
			const L = mod.default;
			LRef.current = L;
			const map = L.map(hostRef.current, {
				center: [PROJECT_CENTER.lat, PROJECT_CENTER.lng],
				zoom: 17,
				zoomControl: false,
				attributionControl: false,
				preferCanvas: true
			});
			L.control.zoom({ position: "topleft" }).addTo(map);
			L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
				maxZoom: 19,
				attribution: "Esri"
			}).addTo(map);
			L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
				maxZoom: 19,
				opacity: .85,
				pane: "overlayPane"
			}).addTo(map);
			const streets = L.layerGroup().addTo(map);
			for (const s of STREETS) L.polyline(s.path.map((p) => [p.lat, p.lng]), {
				color: "#38bdf8",
				weight: 3,
				opacity: .85,
				interactive: false
			}).addTo(streets);
			streetsLayerRef.current = streets;
			stakeLayerRef.current = L.layerGroup().addTo(map);
			map.on("dragstart", () => onUserDrag());
			const renderStakes = () => {
				const layer = stakeLayerRef.current;
				if (!layer) return;
				layer.clearLayers();
				const bounds = map.getBounds();
				const zoom = map.getZoom();
				if (zoom < STAKE_MIN_ZOOM) return;
				const showLabel = zoom >= LABEL_MIN_ZOOM;
				const visible = stakesInRect({
					south: bounds.getSouth(),
					west: bounds.getWest(),
					north: bounds.getNorth(),
					east: bounds.getEast()
				}, MAX_VISIBLE_STAKES);
				for (const st of visible) {
					const m = L.circleMarker([st.pos.lat, st.pos.lng], {
						radius: showLabel ? 7 : 4,
						color: "#0f172a",
						weight: 1.5,
						fillColor: "#f8fafc",
						fillOpacity: .95,
						interactive: false
					});
					if (showLabel) m.bindTooltip(`E-${st.number}`, {
						permanent: true,
						direction: "top",
						offset: [0, -8],
						className: "stake-label"
					});
					m.addTo(layer);
				}
			};
			map.on("moveend", renderStakes);
			map.on("zoomend", renderStakes);
			renderStakes();
			mapRef.current = map;
		});
		return () => {
			cancelled = true;
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		const L = LRef.current;
		if (!map || !L || !position) return;
		if (!userRef.current) {
			userRef.current = L.circleMarker([position.lat, position.lng], {
				radius: 8,
				color: "#0f172a",
				weight: 2,
				fillColor: "#22d3ee",
				fillOpacity: 1,
				interactive: false
			}).addTo(map);
			map.setView([position.lat, position.lng], map.getZoom());
			lastCenterRef.current = position;
		} else {
			userRef.current.setLatLng([position.lat, position.lng]);
			const last = lastCenterRef.current;
			if (followRef.current && (!last || haversine(last, position) > 8)) {
				map.panTo([position.lat, position.lng]);
				lastCenterRef.current = position;
			}
		}
		if (accuracy) {
			if (!accRef.current) accRef.current = L.circle([position.lat, position.lng], {
				radius: accuracy,
				color: "#22d3ee",
				weight: 1,
				opacity: .4,
				fillColor: "#22d3ee",
				fillOpacity: .12,
				interactive: false
			}).addTo(map);
			else {
				accRef.current.setLatLng([position.lat, position.lng]);
				accRef.current.setRadius(accuracy);
			}
		}
	}, [position, accuracy]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		const L = LRef.current;
		if (!map || !L) return;
		if (!match) {
			highlightRef.current?.remove();
			highlightRef.current = null;
			balloonRef.current?.remove();
			balloonRef.current = null;
			return;
		}
		const path = match.street.path.map((p) => [p.lat, p.lng]);
		if (!highlightRef.current) highlightRef.current = L.polyline(path, {
			color: "#f5c518",
			weight: 5,
			opacity: 1,
			interactive: false
		}).addTo(map);
		else highlightRef.current.setLatLngs(path);
		const text = `E-${match.estaca}`;
		const icon = L.divIcon({
			className: "stake-balloon",
			html: `<div class="stake-balloon-inner">${text}</div>`,
			iconSize: [88, 44],
			iconAnchor: [44, 44]
		});
		if (!balloonRef.current) balloonRef.current = L.marker([match.snapped.lat, match.snapped.lng], {
			icon,
			interactive: false,
			zIndexOffset: 900
		}).addTo(map);
		else {
			balloonRef.current.setLatLng([match.snapped.lat, match.snapped.lng]);
			balloonRef.current.setIcon(icon);
		}
	}, [match]);
	(0, import_react.useEffect)(() => {
		if (!recenterNonce) return;
		const map = mapRef.current;
		if (!map || !position) return;
		map.panTo([position.lat, position.lng]);
		lastCenterRef.current = position;
	}, [recenterNonce, position]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: hostRef,
		className: "absolute inset-0 z-0 bg-bg"
	});
}
var MAX_ACCURACY = 100;
var MAX_SPEED = 40;
function useGeolocation(enabled = true) {
	const [state, setState] = (0, import_react.useState)({
		position: null,
		accuracy: null,
		heading: null,
		speed: null,
		error: null
	});
	const lastRef = (0, import_react.useRef)(null);
	const lastEmitRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!enabled) return;
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			setState((s) => ({
				...s,
				error: "Geolocalização não suportada neste navegador."
			}));
			return;
		}
		const id = navigator.geolocation.watchPosition((pos) => {
			const raw = {
				lat: pos.coords.latitude,
				lng: pos.coords.longitude
			};
			const acc = Math.max(pos.coords.accuracy ?? 30, 1);
			const t = pos.timestamp || Date.now();
			if (acc > MAX_ACCURACY && lastRef.current) return;
			const prev = lastRef.current;
			let next = raw;
			let nextAcc = acc;
			if (prev) {
				const dt = Math.max((t - prev.t) / 1e3, .001);
				if (haversine(prev.pos, raw) / dt > MAX_SPEED && acc > prev.acc) return;
				const predVar = prev.acc * prev.acc + dt * 4;
				const k = predVar / (predVar + acc * acc);
				next = {
					lat: prev.pos.lat + k * (raw.lat - prev.pos.lat),
					lng: prev.pos.lng + k * (raw.lng - prev.pos.lng)
				};
				nextAcc = Math.sqrt((1 - k) * predVar);
			}
			lastRef.current = {
				pos: next,
				acc: nextAcc,
				t
			};
			const emitted = lastEmitRef.current;
			const moved = emitted ? haversine(emitted.pos, next) : Infinity;
			if (emitted && t - emitted.t < 1e3 && moved < 2) return;
			lastEmitRef.current = {
				pos: next,
				t
			};
			setState({
				position: next,
				accuracy: Math.round(Math.min(nextAcc, acc) * 10) / 10,
				heading: pos.coords.heading,
				speed: pos.coords.speed,
				error: null
			});
		}, (err) => setState((s) => ({
			...s,
			error: err.message
		})), {
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 2e4
		});
		return () => navigator.geolocation.clearWatch(id);
	}, [enabled]);
	return state;
}
function Index() {
	const geo = useGeolocation(true);
	const online = useOnlineStatus();
	const [demo, setDemo] = (0, import_react.useState)(false);
	const [cameraOpen, setCameraOpen] = (0, import_react.useState)(false);
	const [exportMsg, setExportMsg] = (0, import_react.useState)(null);
	const [follow, setFollow] = (0, import_react.useState)(true);
	const [recenterNonce, setRecenterNonce] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (geo.position || geo.error) return;
		const t = setTimeout(() => setDemo(true), 3500);
		return () => clearTimeout(t);
	}, [geo.position, geo.error]);
	const position = demo ? PROJECT_CENTER : geo.position;
	const accuracy = demo ? 8 : geo.accuracy;
	const posKey = position ? quantize(position) : null;
	const match = (0, import_react.useMemo)(() => position ? findNearestStake(position) : null, [posKey]);
	const cameraMatch = match ?? (position ? findNearestStake(position, 800) : null);
	const recenter = () => {
		setFollow(true);
		setRecenterNonce((n) => n + 1);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Splash, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "px-3 pt-4 pb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-3xl border border-border bg-surface/80 p-4 shadow-[0_18px_50px_-24px_rgba(245,197,24,0.45)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] uppercase tracking-[0.25em] text-muted",
							children: "Retiro São Joaquim · Itaboraí/RJ"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								!online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent ring-1 ring-accent/30",
									children: "Offline"
								}),
								demo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-gps/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gps ring-1 ring-gps/30",
									children: "Demo"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-semibold uppercase tracking-wide text-accent/80",
									children: "By Vitor Lucas"
								})
							]
						})]
					}), match ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-fg",
						children: match.street.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-end gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-accent px-4 py-2 font-mono text-4xl font-bold tabular-nums leading-none text-accent-fg",
							children: ["E-", match.estaca]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pb-1 text-sm tabular-nums text-muted",
							children: [
								match.offset >= 0 ? "+" : "",
								match.offset.toFixed(1),
								" m",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted/70",
									children: [match.distance.toFixed(1), " m do eixo"]
								})
							]
						})]
					})] }) : geo.error && !demo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-3 text-2xl font-semibold text-danger",
							children: "Sem GPS"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: geo.error
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setDemo(true),
							className: "mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg",
							children: "Simular no bairro"
						})
					] }) : !position ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-3 text-2xl font-semibold text-muted",
							children: "Obtendo GPS…"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted/80",
							children: "Permita o acesso à localização para começar."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setDemo(true),
							className: "mt-3 rounded-full bg-subtle px-4 py-2 text-sm font-semibold text-fg",
							children: "Simular no bairro"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-3 text-2xl font-semibold text-muted",
							children: "Fora do projeto"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted/80",
							children: "Nenhuma rua do bairro a menos de 60 m da sua posição."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setDemo(true),
							className: "mt-3 rounded-full bg-subtle px-4 py-2 text-sm font-semibold text-fg",
							children: "Ir para o bairro"
						})
					] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-3 mb-3 min-h-[380px] flex-1 overflow-hidden rounded-3xl border border-border shadow-2xl shadow-black/50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeMap, {
					position,
					accuracy,
					match,
					follow,
					onUserDrag: () => setFollow(false),
					recenterNonce
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto rounded-full border border-border bg-bg/70 px-3 py-1.5 text-xs font-medium text-fg backdrop-blur",
						children: [
							exportMsg ? exportMsg : null,
							exportMsg ? " · " : null,
							"GPS ±",
							accuracy ? accuracy.toFixed(0) : "--",
							" m"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto mb-10 flex flex-col items-center gap-2 rounded-full border border-border bg-bg/70 p-1.5 backdrop-blur",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/fotos",
								"aria-label": "Ver fotos capturadas",
								className: "grid h-11 w-11 place-items-center rounded-full bg-fg/5 text-accent transition active:scale-95",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setCameraOpen(true),
								"aria-label": "Abrir câmera com carimbo de estaca",
								className: "grid h-11 w-11 place-items-center rounded-full bg-fg/5 text-accent transition active:scale-95",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const n = exportPhotoLogCsv();
									setExportMsg(n ? `${n} foto(s) exportadas` : "Nenhuma foto salva ainda");
									setTimeout(() => setExportMsg(null), 3e3);
								},
								"aria-label": "Exportar CSV das fotos salvas",
								className: "grid h-11 w-11 place-items-center rounded-full bg-fg/5 text-accent transition active:scale-95",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: recenter,
								"aria-label": "Centralizar no GPS",
								className: "grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/20 transition active:scale-95",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocateFixed, { size: 18 })
							})
						]
					})]
				})]
			}),
			cameraOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraCapture, {
				onClose: () => setCameraOpen(false),
				stamp: {
					estaca: cameraMatch ? `E-${cameraMatch.estaca}` : null,
					street: cameraMatch?.street.name ?? null,
					lat: position?.lat ?? null,
					lng: position?.lng ?? null
				}
			})
		]
	});
}
//#endregion
export { Index as component };
