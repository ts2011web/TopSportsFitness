// The hosted application keeps its existing server-backed transport.
// The separate Pages build replaces this module with pages/demo-client.ts.
export const isStaticPreview=false;
export const isLiveBackend=false;
export const assetPath=(path:string)=>path;
export const apiFetch:typeof fetch=(input,init)=>fetch(input,init);
