import { v4 as uuidv4 } from 'uuid';

export const generateId = () => `layer-${uuidv4()}`;
export const generateTrackId = () => `track-${uuidv4()}`;
export const generateClipId = () => `clip-${uuidv4()}`;
