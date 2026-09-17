import { i as __toESM } from "../_runtime.mjs";
import { L as require_jsx_runtime, R as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as require_piexif } from "../_libs/piexifjs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/MiniMapThumb-ByCEAEvR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_piexif = /* @__PURE__ */ __toESM(require_piexif());
var DB = "estacagps";
var STORE = "photos";
function open() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
function tx(mode, fn) {
	return open().then((db) => new Promise((resolve, reject) => {
		const req = fn(db.transaction(STORE, mode).objectStore(STORE));
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	}));
}
async function putPhoto(p) {
	try {
		await tx("readwrite", (s) => s.put(p));
	} catch {}
}
async function listPhotos() {
	try {
		return (await tx("readonly", (s) => s.getAll())).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
	} catch {
		return [];
	}
}
async function deletePhoto(id) {
	try {
		await tx("readwrite", (s) => s.delete(id));
	} catch {}
}
function retouchEstaca(photo, novaEstaca) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) return reject(/* @__PURE__ */ new Error("Canvas indisponível"));
			ctx.drawImage(img, 0, 0);
			const box = photo.box ?? {
				x: Math.round(canvas.width * .015),
				y: Math.round(canvas.width * .015),
				w: Math.round(canvas.width * .25),
				h: Math.round(canvas.width * .0475),
				fontSize: Math.round(canvas.width * .035)
			};
			const text = novaEstaca || "Sem estaca";
			ctx.font = `800 ${box.fontSize}px "IBM Plex Sans", system-ui, sans-serif`;
			const padX = box.fontSize * .43;
			const newW = ctx.measureText(text).width + padX * 2;
			ctx.fillStyle = "#0f172a";
			ctx.fillRect(box.x, box.y, Math.max(box.w, newW), box.h);
			ctx.fillStyle = "#f5c518";
			ctx.textBaseline = "middle";
			ctx.fillText(text, box.x + padX, box.y + box.h / 2);
			resolve(canvas.toDataURL("image/jpeg", .92));
		};
		img.onerror = () => reject(/* @__PURE__ */ new Error("Falha ao carregar a foto"));
		img.src = photo.stamped;
	});
}
function sanitize(name) {
	return (name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-") || "foto").slice(0, 60);
}
async function dataUrlToFile(dataUrl, name) {
	const blob = await (await fetch(dataUrl)).blob();
	return new File([blob], name, { type: "image/jpeg" });
}
async function savePhoto(dataUrl, fileName) {
	const name = `${sanitize(fileName)}.jpg`;
	try {
		const file = await dataUrlToFile(dataUrl, name);
		const nav = navigator;
		if (nav.share && nav.canShare?.({ files: [file] })) {
			await nav.share({
				files: [file],
				title: name
			});
			return {
				ok: true,
				message: "Escolha “Salvar imagem” para guardar na galeria."
			};
		}
	} catch (e) {
		if (e instanceof DOMException && e.name === "AbortError") return {
			ok: false,
			message: "Salvamento cancelado."
		};
	}
	const a = document.createElement("a");
	a.href = dataUrl;
	a.download = name;
	a.click();
	return {
		ok: true,
		message: `Baixado como ${name}`
	};
}
async function sharePhoto(dataUrl, fileName, text) {
	const name = `${sanitize(fileName)}.jpg`;
	try {
		const file = await dataUrlToFile(dataUrl, name);
		const nav = navigator;
		if (nav.share && nav.canShare?.({ files: [file] })) {
			await nav.share({
				files: [file],
				title: name,
				text
			});
			return {
				ok: true,
				message: "Compartilhado."
			};
		}
		return {
			ok: false,
			message: "Seu navegador não permite enviar fotos para outros apps."
		};
	} catch (e) {
		if (e instanceof DOMException && e.name === "AbortError") return {
			ok: false,
			message: "Compartilhamento cancelado."
		};
		return {
			ok: false,
			message: e instanceof Error ? e.message : "Falha ao compartilhar."
		};
	}
}
function toDms(value) {
	const abs = Math.abs(value);
	const deg = Math.floor(abs);
	const minFloat = (abs - deg) * 60;
	const min = Math.floor(minFloat);
	const sec = Math.round((minFloat - min) * 60 * 1e4);
	return [
		[deg, 1],
		[min, 1],
		[sec, 1e4]
	];
}
function fmt(d) {
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}:${p(d.getMonth() + 1)}:${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function addExif(dataUrl, stamp) {
	try {
		const description = [stamp.estaca, stamp.street].filter(Boolean).join(" · ");
		const zeroth = {
			[import_piexif.default.ImageIFD.Make]: "EstacaGPS",
			[import_piexif.default.ImageIFD.Software]: "EstacaGPS by Vitor Lucas",
			[import_piexif.default.ImageIFD.Orientation]: 1,
			[import_piexif.default.ImageIFD.DateTime]: fmt(stamp.date)
		};
		if (description) zeroth[import_piexif.default.ImageIFD.ImageDescription] = description;
		const exif = {
			[import_piexif.default.ExifIFD.DateTimeOriginal]: fmt(stamp.date),
			[import_piexif.default.ExifIFD.DateTimeDigitized]: fmt(stamp.date),
			[import_piexif.default.ExifIFD.UserComment]: `ASCII\0\0\0${JSON.stringify({
				estaca: stamp.estaca,
				rua: stamp.street,
				lat: stamp.lat,
				lng: stamp.lng,
				timestamp: stamp.date.toISOString()
			})}`
		};
		const gps = {};
		if (stamp.lat !== null && stamp.lng !== null) {
			gps[import_piexif.default.GPSIFD.GPSLatitudeRef] = stamp.lat >= 0 ? "N" : "S";
			gps[import_piexif.default.GPSIFD.GPSLatitude] = toDms(stamp.lat);
			gps[import_piexif.default.GPSIFD.GPSLongitudeRef] = stamp.lng >= 0 ? "E" : "W";
			gps[import_piexif.default.GPSIFD.GPSLongitude] = toDms(stamp.lng);
			gps[import_piexif.default.GPSIFD.GPSDateStamp] = fmt(stamp.date).split(" ")[0];
		}
		const bytes = import_piexif.default.dump({
			"0th": zeroth,
			Exif: exif,
			GPS: gps
		});
		return import_piexif.default.insert(bytes, dataUrl);
	} catch {
		return dataUrl;
	}
}
function useOnlineStatus() {
	const [online, setOnline] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		if (typeof navigator === "undefined") return;
		const update = () => setOnline(navigator.onLine);
		update();
		window.addEventListener("online", update);
		window.addEventListener("offline", update);
		return () => {
			window.removeEventListener("online", update);
			window.removeEventListener("offline", update);
		};
	}, []);
	return online;
}
var STREETS = [
	{
		name: "Rua Barão de Itapacorá",
		stakeStart: 1300,
		stakeEnd: 1380,
		path: [
			{
				lat: -22.7537186,
				lng: -42.8901404
			},
			{
				lat: -22.7533864,
				lng: -42.8904346
			},
			{
				lat: -22.7530822,
				lng: -42.8906527
			},
			{
				lat: -22.7523815,
				lng: -42.8912894
			},
			{
				lat: -22.751117,
				lng: -42.8923799
			},
			{
				lat: -22.7511263,
				lng: -42.8923913
			},
			{
				lat: -22.7464525,
				lng: -42.8963591
			},
			{
				lat: -22.7433176,
				lng: -42.8990813
			},
			{
				lat: -22.7425107,
				lng: -42.8997654
			}
		]
	},
	{
		name: "Rua José Leandro",
		stakeStart: 1200,
		stakeEnd: 1276.5,
		path: [
			{
				lat: -22.7552876,
				lng: -42.8914138
			},
			{
				lat: -22.7456099,
				lng: -42.8997031
			},
			{
				lat: -22.7448304,
				lng: -42.9003901
			},
			{
				lat: -22.7444443,
				lng: -42.9006505
			}
		]
	},
	{
		name: "Rua Visconde de Itaboraí",
		stakeStart: 1e3,
		stakeEnd: 1057,
		path: [
			{
				lat: -22.7582271,
				lng: -42.8952604
			},
			{
				lat: -22.7577993,
				lng: -42.8956054
			},
			{
				lat: -22.7550823,
				lng: -42.8979122
			},
			{
				lat: -22.7543816,
				lng: -42.8985489
			},
			{
				lat: -22.7531561,
				lng: -42.8995844
			},
			{
				lat: -22.7525171,
				lng: -42.9001462
			},
			{
				lat: -22.7519139,
				lng: -42.900635
			},
			{
				lat: -22.7501586,
				lng: -42.9021814
			}
		]
	},
	{
		name: "Rua João Caetano",
		stakeStart: 1155,
		stakeEnd: 1099.5,
		path: [
			{
				lat: -22.7484814,
				lng: -42.9003959
			},
			{
				lat: -22.7492098,
				lng: -42.8997753
			},
			{
				lat: -22.7504493,
				lng: -42.8987594
			},
			{
				lat: -22.751741,
				lng: -42.8976324
			},
			{
				lat: -22.7517503,
				lng: -42.8976438
			},
			{
				lat: -22.7530233,
				lng: -42.8964957
			},
			{
				lat: -22.7536414,
				lng: -42.8959704
			},
			{
				lat: -22.7543444,
				lng: -42.8954045
			},
			{
				lat: -22.7543351,
				lng: -42.8953931
			},
			{
				lat: -22.7562948,
				lng: -42.8937138
			}
		]
	},
	{
		name: "Rua Coronel Antônio Leal",
		stakeStart: 349.5,
		stakeEnd: 397,
		path: [{
			lat: -22.75315,
			lng: -42.8995911
		}, {
			lat: -22.7478829,
			lng: -42.8922682
		}]
	},
	{
		name: "Rua Prefeito Antônio Vianna",
		stakeStart: 99.5,
		stakeEnd: 147,
		path: [{
			lat: -22.7563985,
			lng: -42.8967964
		}, {
			lat: -22.7511466,
			lng: -42.8894815
		}]
	},
	{
		name: "Rua Prefeito Augusto de Andrade",
		stakeStart: 149.5,
		stakeEnd: 197,
		path: [{
			lat: -22.7557442,
			lng: -42.8973518
		}, {
			lat: -22.7504893,
			lng: -42.8900418
		}]
	},
	{
		name: "Rua Major Simões da Fonseca",
		stakeStart: 249.5,
		stakeEnd: 297,
		path: [
			{
				lat: -22.7544602,
				lng: -42.898477
			},
			{
				lat: -22.752983,
				lng: -42.8964403
			},
			{
				lat: -22.749224,
				lng: -42.8911899
			}
		]
	},
	{
		name: "Rua Ângelo Buriche",
		stakeStart: 299.5,
		stakeEnd: 347,
		path: [
			{
				lat: -22.7537983,
				lng: -42.8990408
			},
			{
				lat: -22.7498564,
				lng: -42.8935459
			},
			{
				lat: -22.7485607,
				lng: -42.8917635
			}
		]
	},
	{
		name: "Rua Doutor Amaral Júnior",
		stakeStart: 0,
		stakeEnd: 47,
		path: [
			{
				lat: -22.7577131,
				lng: -42.895679
			},
			{
				lat: -22.755117,
				lng: -42.8920843
			},
			{
				lat: -22.7548681,
				lng: -42.8916912
			},
			{
				lat: -22.7536581,
				lng: -42.8900573
			},
			{
				lat: -22.752489,
				lng: -42.8883932
			}
		]
	},
	{
		name: "Rua Alberto Torres",
		stakeStart: 203,
		stakeEnd: 248,
		path: [
			{
				lat: -22.7547049,
				lng: -42.8973645
			},
			{
				lat: -22.7523354,
				lng: -42.8940877
			},
			{
				lat: -22.7498659,
				lng: -42.8906248
			}
		]
	},
	{
		name: "Rua Ministro João Antunes",
		stakeStart: 49.5,
		stakeEnd: 89,
		path: [
			{
				lat: -22.7570483,
				lng: -42.8962444
			},
			{
				lat: -22.7548058,
				lng: -42.8931304
			},
			{
				lat: -22.7541972,
				lng: -42.8922649
			},
			{
				lat: -22.7536762,
				lng: -42.891576
			},
			{
				lat: -22.7533265,
				lng: -42.8910476
			},
			{
				lat: -22.7530087,
				lng: -42.8906357
			},
			{
				lat: -22.7527521,
				lng: -42.890236
			}
		]
	},
	{
		name: "Rua Doutor Altamir Moreira",
		stakeStart: 449.5,
		stakeEnd: 473,
		path: [{
			lat: -22.7504523,
			lng: -42.898756
		}, {
			lat: -22.7478624,
			lng: -42.8951647
		}]
	},
	{
		name: "Rua Desembargador Ferreira Pinto",
		stakeStart: 399.5,
		stakeEnd: 423,
		path: [{
			lat: -22.7510959,
			lng: -42.8981942
		}, {
			lat: -22.7485151,
			lng: -42.8946094
		}]
	},
	{
		name: "Rua Coronel João de Magalhães",
		stakeStart: 499.5,
		stakeEnd: 523,
		path: [
			{
				lat: -22.7498023,
				lng: -42.8992899
			},
			{
				lat: -22.7484123,
				lng: -42.8973952
			},
			{
				lat: -22.7472247,
				lng: -42.8957067
			}
		]
	},
	{
		name: "Rua Padre Mário de Castro",
		stakeStart: 549.5,
		stakeEnd: 563,
		path: [{
			lat: -22.7491403,
			lng: -42.8998339
		}, {
			lat: -22.7477283,
			lng: -42.8978901
		}]
	}
];
var EARTH_R = 6378137;
function haversine(a, b) {
	const toRad = (d) => d * Math.PI / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const la1 = toRad(a.lat);
	const la2 = toRad(b.lat);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}
function toXY(p, origin) {
	const toRad = (d) => d * Math.PI / 180;
	return {
		x: toRad(p.lng - origin.lng) * Math.cos(toRad(origin.lat)) * EARTH_R,
		y: toRad(p.lat - origin.lat) * EARTH_R
	};
}
function polylineLength(points) {
	let len = 0;
	for (let i = 1; i < points.length; i++) len += haversine(points[i - 1], points[i]);
	return len;
}
function projectOnPolyline(point, polyline) {
	if (polyline.length < 2) return null;
	const origin = polyline[0];
	const p = toXY(point, origin);
	let best = null;
	let cumulative = 0;
	let total = 0;
	for (let i = 1; i < polyline.length; i++) total += haversine(polyline[i - 1], polyline[i]);
	for (let i = 1; i < polyline.length; i++) {
		const a = toXY(polyline[i - 1], origin);
		const b = toXY(polyline[i], origin);
		const abx = b.x - a.x;
		const aby = b.y - a.y;
		const segLen = Math.hypot(abx, aby);
		if (segLen === 0) continue;
		let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / (segLen * segLen);
		t = Math.max(0, Math.min(1, t));
		const cx = a.x + abx * t;
		const cy = a.y + aby * t;
		const d = Math.hypot(p.x - cx, p.y - cy);
		const chain = cumulative + t * segLen;
		if (best === null || d < best.distance) best = {
			chainage: chain,
			distance: d,
			segmentIndex: i - 1,
			totalLength: total
		};
		cumulative += segLen;
	}
	return best;
}
function pointAtChainage(polyline, chainage) {
	if (polyline.length < 2) return null;
	const origin = polyline[0];
	let remaining = chainage;
	for (let i = 1; i < polyline.length; i++) {
		const a = toXY(polyline[i - 1], origin);
		const b = toXY(polyline[i], origin);
		const abx = b.x - a.x;
		const aby = b.y - a.y;
		const segLen = Math.hypot(abx, aby);
		if (remaining <= segLen) {
			const t = segLen === 0 ? 0 : remaining / segLen;
			const x = a.x + abx * t;
			const y = a.y + aby * t;
			return {
				lat: origin.lat + y / EARTH_R * (180 / Math.PI),
				lng: origin.lng + x / (EARTH_R * Math.cos(origin.lat * Math.PI / 180)) * (180 / Math.PI)
			};
		}
		remaining -= segLen;
	}
	return polyline[polyline.length - 1];
}
var BG = "#0b1220";
var AXIS = "#5ec8f0";
var HIGHLIGHT = "#f5c518";
var USER = "#22d3ee";
var GRID = "rgba(248,250,252,0.08)";
function renderMiniMap(canvas, center, opts) {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const w = canvas.width;
	const h = canvas.height;
	const meters = opts?.meters ?? 180;
	const origin = center;
	const scale = Math.min(w, h) / (meters * 2);
	ctx.fillStyle = BG;
	ctx.fillRect(0, 0, w, h);
	ctx.strokeStyle = GRID;
	ctx.lineWidth = 1;
	for (let i = -2; i <= 2; i++) {
		const px = w / 2 + i * (w / 4);
		const py = h / 2 + i * (h / 4);
		ctx.beginPath();
		ctx.moveTo(px, 0);
		ctx.lineTo(px, h);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0, py);
		ctx.lineTo(w, py);
		ctx.stroke();
	}
	const toPx = (p) => {
		const { x, y } = toXY(p, origin);
		return {
			x: w / 2 + x * scale,
			y: h / 2 - y * scale
		};
	};
	ctx.lineJoin = "round";
	ctx.lineCap = "round";
	ctx.strokeStyle = AXIS;
	ctx.globalAlpha = .85;
	ctx.lineWidth = Math.max(1.5, w / 80);
	for (const s of STREETS) {
		if (s.path.length < 2) continue;
		ctx.beginPath();
		s.path.forEach((p, i) => {
			const q = toPx(p);
			if (i === 0) ctx.moveTo(q.x, q.y);
			else ctx.lineTo(q.x, q.y);
		});
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
	if (opts?.highlight && opts.highlight.length > 1) {
		ctx.strokeStyle = HIGHLIGHT;
		ctx.lineWidth = Math.max(2.5, w / 50);
		ctx.beginPath();
		opts.highlight.forEach((p, i) => {
			const q = toPx(p);
			if (i === 0) ctx.moveTo(q.x, q.y);
			else ctx.lineTo(q.x, q.y);
		});
		ctx.stroke();
	}
	const u = toPx(opts?.user ?? center);
	ctx.fillStyle = USER;
	ctx.beginPath();
	ctx.arc(u.x, u.y, Math.max(4, w / 28), 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "#0f172a";
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.fillStyle = HIGHLIGHT;
	ctx.beginPath();
	ctx.arc(u.x, u.y - Math.max(10, w / 14), Math.max(3, w / 40), 0, Math.PI * 2);
	ctx.fill();
}
function miniMapDataUrl(center, size = 256, opts) {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	renderMiniMap(canvas, center, opts);
	return canvas.toDataURL("image/png");
}
function loadMiniMapImage(center, size = 320, opts) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error("mini map"));
		img.src = miniMapDataUrl(center, size, opts);
	});
}
function MiniMapThumb({ center, className, style, size = 160 }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		renderMiniMap(el, center, { user: center });
	}, [center]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		width: size,
		height: size,
		className,
		style,
		"aria-hidden": true
	});
}
//#endregion
export { haversine as a, pointAtChainage as c, putPhoto as d, retouchEstaca as f, useOnlineStatus as h, deletePhoto as i, polylineLength as l, sharePhoto as m, STREETS as n, listPhotos as o, savePhoto as p, addExif as r, loadMiniMapImage as s, MiniMapThumb as t, projectOnPolyline as u };
