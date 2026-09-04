/* ============================================================
   AURA STYLE — Settings page (settings.html)
   Persists profile name + preference toggles to /api/settings.
   - "Save Changes"    -> profile_name
   - Toggle buttons tagged [data-toggle-key] -> notifications / ai_scoring
   ============================================================ */
import { api } from "./api.js";
import { toast } from "./toast.js";

function setToggle(btn, on) {
  const knob = btn.querySelector("span");
  if (!knob) return;
  if (on) {
    btn.classList.remove("bg-outline-variant");
    btn.classList.add("bg-primary");
    knob.classList.remove("left-1");
    knob.classList.add("right-1");
    btn.dataset.on = "1";
  } else {
    btn.classList.remove("bg-primary");
    btn.classList.add("bg-outline-variant");
    knob.classList.remove("right-1");
    knob.classList.add("left-1");
    btn.dataset.on = "0";
  }
}

function isOn(btn) {
  return btn.dataset.on === "1" || btn.classList.contains("bg-primary");
}

export async function initSettings() {
  // Toggles we manage (tagged in the HTML).
  const toggles = document.querySelectorAll("[data-toggle-key]");

  let prefs = { profile_name: "Aura User", notifications: "on", ai_scoring: "on" };
  try {
    prefs = await api.getSettings();
  } catch (err) {
    console.warn("Settings API unavailable, using defaults:", err.message);
  }

  // Profile name
  const profileInput = document.querySelector('[data-settings="profile_name"]');
  const firstNameInput = document.querySelector('[data-settings="first_name"]');
  if (prefs.profile_name && firstNameInput && !profileInput) {
    firstNameInput.value = prefs.profile_name.split(" ")[0] || prefs.profile_name;
  }
  if (profileInput && prefs.profile_name) {
    profileInput.value = prefs.profile_name;
  }

  // Apply toggle states
  toggles.forEach((btn) => {
    const key = btn.dataset.toggleKey;
    const on = prefs[key] === "on" || prefs[key] === true;
    setToggle(btn, on);

    btn.addEventListener("click", async () => {
      const next = !isOn(btn);
      setToggle(btn, next);
      try {
        await api.updateSettings({ [key]: next ? "on" : "off" });
        toast("Preference saved");
      } catch (err) {
        // revert on failure
        setToggle(btn, !next);
        toast(err.message, "error");
      }
    });
  });

  // Save Changes (account profile)
  const saveBtn = document.querySelector('[data-settings="save"]');
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const first = (document.querySelector('[data-settings="first_name"]')?.value || "").trim();
      const last = (document.querySelector('[data-settings="last_name"]')?.value || "").trim();
      const name = [first, last].filter(Boolean).join(" ").trim() || "Aura User";
      try {
        await api.updateSettings({ profile_name: name });
        profileInput && (profileInput.value = name);
        toast("Profile updated");
      } catch (err) {
        toast(err.message, "error");
      }
    });
  }
}

export default initSettings;
