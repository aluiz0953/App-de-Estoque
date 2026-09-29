// FlatList windowing for long lists on modest Android phones: render a small
// first batch, keep a short window of off-screen rows, and detach the rest.
export const LIST_PERF_PROPS = {
  initialNumToRender: 12,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  windowSize: 7,
  removeClippedSubviews: true,
};
