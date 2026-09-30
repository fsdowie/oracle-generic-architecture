// Copy to config.js for local testing. In CI, config.js is generated from GitHub secrets.
// The anon key is designed to be public; access to the map data is enforced by
// row-level security in Supabase, not by keeping this key secret.
window.MAP_CONFIG = {
  url: "https://YOUR-PROJECT-REF.supabase.co",
  anonKey: "YOUR-ANON-PUBLIC-KEY",
  bucket: "estate-map",
  object: "map.json"
};
