// Trend velocity: how fast a niche is moving, computed by comparing the
// top-selling result set against a recent-sort sample (seller workflow step 4).
// Upload dates are not published on the marketplace, so velocity is derived
// from set overlap: fresh top sellers and incumbent upload activity.

export type VelocityInputProduct = {
  url: string;
  artistName: string | null;
};

export type TrendVelocity = {
  // How many recent uploads were sampled.
  recentSampleSize: number;
  // Top sellers that also appear among recent uploads — high values mean the
  // winners are new listings: the niche is rising fast.
  freshTopSellerCount: number;
  freshTopSellerPct: number;
  // Recent uploads made by artists already in the top-selling set — high
  // values mean incumbents are actively defending the niche.
  incumbentUploadPct: number;
  // Distinct artists uploading recently who are NOT in the top-selling set —
  // the volume of new competition entering.
  newEntrantArtists: number;
};

export function computeTrendVelocity(
  topProducts: VelocityInputProduct[],
  recentSample: VelocityInputProduct[],
): TrendVelocity {
  const topUrls = new Set(topProducts.map((product) => product.url));
  const topArtists = new Set(
    topProducts.map((product) => product.artistName).filter((artist): artist is string => Boolean(artist)),
  );

  const freshTopSellerCount = recentSample.filter((item) => topUrls.has(item.url)).length;

  const recentWithArtist = recentSample.filter((item) => item.artistName !== null);
  const incumbentUploads = recentWithArtist.filter((item) => topArtists.has(item.artistName as string)).length;
  const newEntrants = new Set(
    recentWithArtist
      .filter((item) => !topArtists.has(item.artistName as string))
      .map((item) => item.artistName as string),
  );

  const pct = (part: number, whole: number): number => (whole === 0 ? 0 : Math.round((part / whole) * 100));

  return {
    recentSampleSize: recentSample.length,
    freshTopSellerCount,
    freshTopSellerPct: pct(freshTopSellerCount, topProducts.length),
    incumbentUploadPct: pct(incumbentUploads, recentWithArtist.length),
    newEntrantArtists: newEntrants.size,
  };
}
