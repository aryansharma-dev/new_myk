export function getToken() {
  try {
    return localStorage.getItem("token") || "";
  } catch (error) {
    console.warn("Unable to read auth token from storage", error);
    return "";
  }
}
export function setToken(t) {
  try {
    localStorage.setItem("token", t || "");
  } catch (error) {
    console.warn("Unable to persist auth token", error);
  }
}
export function clearToken() {
  try {
    localStorage.removeItem("token");
  } catch (error) {
    console.warn("Unable to clear auth token", error);
  }
}
export function isAuthed() {
  return !!getToken();
}
