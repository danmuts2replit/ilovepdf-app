// CommonJS bootstrap for Hostinger's LiteSpeed Node.js hosting (lsnode.js).
// lsnode.js loads the app entry file with require(), which cannot load
// native ES modules. This file stays CommonJS (.cjs) and uses dynamic
// import(), which works from CommonJS, to start the real ESM server.
import('./server.js').catch((err) => {
  console.error('Failed to start server.js:', err);
  process.exit(1);
});
