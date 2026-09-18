export function collectionAddUrl(params: {
  deviceModelId: string;
  shellId?: string;
  shellImage?: string | null;
}): string {
  const search = new URLSearchParams();
  search.set("deviceModelId", params.deviceModelId);
  if (params.shellId) search.set("shellId", params.shellId);
  if (params.shellImage) search.set("shellImage", params.shellImage);
  return `/collection/add?${search.toString()}`;
}
