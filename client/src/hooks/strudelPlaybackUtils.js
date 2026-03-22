function layerHasPlayableCode(layer) {
  return Boolean(layer?.code && layer.code.trim());
}

function layersHavePlayableCode(layers = []) {
  const hasSolo = layers.some((layer) => layer?.solo);
  return layers.some((layer) => {
    if (!layerHasPlayableCode(layer) || layer?.muted) return false;
    return hasSolo ? layer.solo : true;
  });
}

function patternHasPlayableCode(patternDef) {
  if (!patternDef) return false;
  if (Array.isArray(patternDef.layers)) {
    return layersHavePlayableCode(patternDef.layers);
  }
  return Boolean(patternDef.code && patternDef.code.trim());
}

export function arrangementHasPlayableClips(arrangement, patternLibrary = []) {
  if (!arrangement?.tracks?.length) return false;

  const hasSolo = arrangement.tracks.some((track) => track.solo);

  for (const track of arrangement.tracks) {
    if (track.muted) continue;
    if (hasSolo && !track.solo) continue;

    for (const clip of track.clips || []) {
      if (Array.isArray(clip.layers) && layersHavePlayableCode(clip.layers)) {
        return true;
      }

      if (clip.patternId) {
        const patternDef = patternLibrary.find((pattern) => pattern.id === clip.patternId);
        if (patternHasPlayableCode(patternDef)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function getPlaybackStartBar(arrangement) {
  return arrangement?.loopEnabled ? arrangement.loopStart || 0 : 0;
}
