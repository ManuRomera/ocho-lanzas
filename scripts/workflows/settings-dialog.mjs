export function getListOptions(settingKey) {
  const raw = game.settings.get("ocho-lanzas", settingKey) ?? "";
  return String(raw).split("\n").map(s => s.trim()).filter(Boolean);
}

export async function openConfigureListsDialog() {
  const DialogV2 = foundry.applications.api.DialogV2;
  const content = `
  <form class="ocho-lanzas" autocomplete="off">
    <div class="form-group">
      <label>${game.i18n.localize("OCHO.Config.Bonds")}</label>
      <textarea name="bondOptions" rows="6">${escapeHtml(game.settings.get("ocho-lanzas","bondOptions") ?? "")}</textarea>
    </div>
    <div class="form-group">
      <label>${game.i18n.localize("OCHO.Config.Events")}</label>
      <textarea name="eventOptions" rows="6">${escapeHtml(game.settings.get("ocho-lanzas","eventOptions") ?? "")}</textarea>
    </div>
    <div class="form-group">
      <label>${game.i18n.localize("OCHO.Config.Equipment")}</label>
      <textarea name="equipmentOptions" rows="6">${escapeHtml(game.settings.get("ocho-lanzas","equipmentOptions") ?? "")}</textarea>
    </div>
    <div class="form-group">
      <label>${game.i18n.localize("OCHO.Config.Haika")}</label>
      <textarea name="haikaOptions" rows="6">${escapeHtml(game.settings.get("ocho-lanzas","haikaOptions") ?? "")}</textarea>
    </div>
  </form>`;

  return DialogV2.prompt({
    title: game.i18n.localize("OCHO.Config.Title"),
    content,
    ok: {
      label: game.i18n.localize("OCHO.Config.Save"),
      callback: async (event, button, dialog) => {
        const form = dialog.element.querySelector("form");
        const fd = new FormData(form);
        await game.settings.set("ocho-lanzas","bondOptions", String(fd.get("bondOptions") ?? ""));
        await game.settings.set("ocho-lanzas","eventOptions", String(fd.get("eventOptions") ?? ""));
        await game.settings.set("ocho-lanzas","equipmentOptions", String(fd.get("equipmentOptions") ?? ""));
        await game.settings.set("ocho-lanzas","haikaOptions", String(fd.get("haikaOptions") ?? ""));
        return true;
      }
    },
    cancel: { label: game.i18n.localize("OCHO.Config.Close") },
    rejectClose: false
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
