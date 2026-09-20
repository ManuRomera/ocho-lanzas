const HOVER_DELAY = 650;
const POPOVER_ID = "ol-context-info-popover";
let hoverTimer = null;
let persistent = false;
let activeTarget = null;
let escapeBound = false;

function rootElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function ensurePopover() {
  let pop = document.getElementById(POPOVER_ID);
  if (pop) return pop;

  pop = document.createElement("aside");
  pop.id = POPOVER_ID;
  pop.className = "ol-context-popover";
  pop.hidden = true;
  pop.innerHTML = `
    <div class="ol-context-popover-head">
      <div>
        <div class="ol-context-popover-category"></div>
        <strong class="ol-context-popover-title"></strong>
      </div>
      <button type="button" class="ol-context-popover-close" aria-label="Cerrar">×</button>
    </div>
    <div class="ol-context-popover-body"></div>
  `;
  document.body.append(pop);
  pop.querySelector(".ol-context-popover-close")?.addEventListener("click", () => hidePopover(true));

  if (!escapeBound) {
    escapeBound = true;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !pop.hidden) hidePopover(true);
    });
    document.addEventListener("pointerdown", (event) => {
      if (!persistent || pop.hidden) return;
      if (pop.contains(event.target) || activeTarget?.contains?.(event.target)) return;
      hidePopover(true);
    }, true);
  }
  return pop;
}

function getTarget(node, root) {
  if (!(node instanceof Element)) return null;
  const target = node.closest(".ol-info-target");
  return target && root.contains(target) ? target : null;
}

function targetData(target) {
  return {
    title: target?.dataset?.olInfoTitle || target?.textContent?.trim() || "",
    category: target?.dataset?.olInfoCategory || "",
    body: target?.dataset?.olInfoBody || ""
  };
}

function positionPopover(pop, target) {
  const tr = target.getBoundingClientRect();
  const pr = pop.getBoundingClientRect();
  const gap = 10;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = tr.right + gap;
  if (left + pr.width > vw - gap) left = tr.left - pr.width - gap;
  left = Math.max(gap, Math.min(left, vw - pr.width - gap));

  let top = tr.top;
  if (top + pr.height > vh - gap) top = Math.max(gap, tr.bottom - pr.height);
  top = Math.max(gap, Math.min(top, vh - pr.height - gap));

  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
}

function showPopover(target, { pin = false } = {}) {
  const data = targetData(target);
  if (!data.title && !data.body) return;

  const pop = ensurePopover();
  pop.querySelector(".ol-context-popover-title").textContent = data.title;
  pop.querySelector(".ol-context-popover-category").textContent = data.category;
  pop.querySelector(".ol-context-popover-body").textContent = data.body || game.i18n.localize("OCHO.Info.NoDescription");
  pop.classList.toggle("is-persistent", pin);
  pop.hidden = false;
  persistent = pin;
  activeTarget = target;

  requestAnimationFrame(() => positionPopover(pop, target));
}

function hidePopover(force = false) {
  if (persistent && !force) return;
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = null;
  persistent = false;
  activeTarget = null;
  const pop = document.getElementById(POPOVER_ID);
  if (pop) pop.hidden = true;
}

export function bindContextInfo(html) {
  const root = rootElement(html);
  if (!root || root.dataset.olContextBound === "1") return;
  root.dataset.olContextBound = "1";

  root.addEventListener("pointerover", (event) => {
    if (persistent) return;
    const target = getTarget(event.target, root);
    if (!target || target === activeTarget) return;
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => showPopover(target, { pin: false }), HOVER_DELAY);
  });

  root.addEventListener("pointerout", (event) => {
    const target = getTarget(event.target, root);
    if (!target) return;
    const next = event.relatedTarget;
    if (next instanceof Node && target.contains(next)) return;
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = null;
    if (!persistent) hidePopover();
  });

  root.addEventListener("focusin", (event) => {
    if (persistent) return;
    const target = getTarget(event.target, root);
    if (target) showPopover(target, { pin: false });
  });

  root.addEventListener("focusout", (event) => {
    const target = getTarget(event.target, root);
    if (target && !persistent) hidePopover();
  });

  root.addEventListener("click", (event) => {
    const target = getTarget(event.target, root);
    if (!target || target.dataset.olInfoClick !== "pin") return;
    event.preventDefault();
    event.stopPropagation();
    showPopover(target, { pin: true });
  });

  root.addEventListener("contextmenu", (event) => {
    const target = getTarget(event.target, root);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    showPopover(target, { pin: true });
  });
}

export function closeContextInfo() {
  hidePopover(true);
}