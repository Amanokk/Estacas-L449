import { i as __toESM } from "../_runtime.mjs";
import { L as require_jsx_runtime, R as require_react, _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as putPhoto, f as retouchEstaca, h as useOnlineStatus, i as deletePhoto, m as sharePhoto, o as listPhotos, p as savePhoto, r as addExif, t as MiniMapThumb } from "./MiniMapThumb-ByCEAEvR.mjs";
import { a as Trash2, c as Pencil, f as Download, h as ArrowLeft, o as Share2, p as Check } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fotos-BFLKrzv1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function fmt(iso) {
	const d = new Date(iso);
	const p = (n) => String(n).padStart(2, "0");
	return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function FotosPage() {
	const [photos, setPhotos] = (0, import_react.useState)(null);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)(null);
	const online = useOnlineStatus();
	(0, import_react.useEffect)(() => {
		listPhotos().then(setPhotos);
	}, []);
	const refresh = () => void listPhotos().then(setPhotos);
	const applyRetouch = async (photo) => {
		const value = draft.trim();
		try {
			const stamped = await retouchEstaca(photo, value);
			await putPhoto({
				...photo,
				estaca: value || null,
				stamped: addExif(stamped, {
					lat: photo.lat,
					lng: photo.lng,
					estaca: value || null,
					street: photo.street,
					date: new Date(photo.stampDate)
				})
			});
			setEditing(null);
			setStatus("Estaca atualizada na foto.");
			refresh();
		} catch {
			setStatus("Não foi possível retocar a estaca.");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-10 flex items-center gap-3 bg-bg/95 px-4 py-4 backdrop-blur",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						"aria-label": "Voltar ao mapa",
						className: "grid h-11 w-11 place-items-center rounded-full bg-surface text-accent",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 18 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-semibold leading-tight",
						children: "Fotos"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted",
						children: photos ? `${photos.length} foto(s) salvas no aparelho` : "Carregando…"
					})] }),
					!online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent ring-1 ring-accent/30",
						children: "Offline"
					})
				]
			}),
			status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pb-2 text-[12px] text-accent",
				children: status
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 px-4 pb-16",
				children: [photos && photos.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl bg-surface p-6 text-center text-sm text-muted",
					children: "Nenhuma foto ainda. Tire uma foto pela câmera do mapa."
				}), photos?.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "overflow-hidden rounded-2xl bg-surface",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: p.stamped,
							alt: `Foto ${p.file} com carimbo da estaca ${p.estaca ?? "sem estaca"}`,
							className: "w-full",
							loading: "lazy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 p-3",
							children: [p.lat !== null && p.lng !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniMapThumb, {
								center: {
									lat: p.lat,
									lng: p.lng
								},
								className: "h-24 w-24 shrink-0 rounded-xl bg-subtle object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "min-w-0 flex-1 space-y-0.5 text-[12px] text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-base font-black text-accent",
										children: p.estaca ?? "Sem estaca"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate font-semibold text-fg",
										children: p.street ?? "Rua não identificada"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Carimbo: ", fmt(p.stampDate)] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Capturada: ", fmt(p.timestamp)] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "tabular-nums",
										children: [
											"GPS: ",
											p.lat !== null ? p.lat.toFixed(6) : "--",
											", ",
											p.lng !== null ? p.lng.toFixed(6) : "--"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-muted/70",
										children: p.file
									})
								]
							})]
						}),
						editing === p.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 px-3 pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: draft,
								onChange: (e) => setDraft(e.target.value),
								placeholder: "E-1127",
								className: "min-w-0 flex-1 rounded-xl bg-subtle px-3 py-2 text-sm outline-none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void applyRetouch(p),
								"aria-label": "Salvar estaca retocada",
								className: "grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-fg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 18 })
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2 px-3 pb-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setEditing(p.id);
										setDraft(p.estaca ?? "");
									},
									className: "flex items-center gap-1.5 rounded-full bg-subtle px-3 py-2 text-[12px] font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 14 }), " Retocar estaca"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: async () => {
										const r = await savePhoto(p.stamped, p.file.replace(/\.jpg$/, ""));
										setStatus(r.message);
									},
									className: "flex items-center gap-1.5 rounded-full bg-subtle px-3 py-2 text-[12px] font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 14 }), " Salvar"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: async () => {
										const r = await sharePhoto(p.stamped, p.file.replace(/\.jpg$/, ""), [
											p.estaca,
											p.street,
											fmt(p.stampDate)
										].filter(Boolean).join(" · "));
										setStatus(r.message);
									},
									className: "flex items-center gap-1.5 rounded-full bg-whatsapp px-3 py-2 text-[12px] font-bold text-fg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 14 }), " Enviar"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: async () => {
										await deletePhoto(p.id);
										refresh();
									},
									"aria-label": "Apagar foto",
									className: "ml-auto grid h-11 w-11 place-items-center rounded-full bg-subtle text-danger",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 })
								})
							]
						})
					]
				}, p.id))]
			})
		]
	});
}
//#endregion
export { FotosPage as component };
