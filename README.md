# MusicLab

A powerful web-based music production environment built on [Strudel](https://strudel.cc/), the JavaScript port of TidalCycles. Create beats, melodies, and full compositions using live coding or visual sequencers.

## Features

### DAW-Style Arrangement View
- Multi-track timeline with drag-and-drop clips
- Real-time playhead animation synced to audio engine
- Track controls: Mute, Solo, Volume, Pan per track
- Clip positioning with snap-to-grid
- Loop regions with visual markers
- Zoom and scroll controls
- Double-click to create inline clips
- Drag patterns from library to timeline

### Live Coding Editor
- Real-time pattern evaluation with Strudel mini notation
- Syntax highlighting and autocomplete for 296+ samples
- Per-clip code editing in arrangement
- Cheat sheet with pattern examples and sample browser

### Step Sequencer (Drum Machine)
- 8/16/32 step grid with 32 drum sounds
- Swing control (0-100%)
- 30+ genre presets (Hip Hop, Techno, House, Trap, etc.)
- Real-time preview with visual step indicator

### Melodic Sequencer
- Piano-roll style note input (C-B, octaves 1-6)
- 10 synthesizer sounds (Arpy, Pluck, Moog, Juno, FM, etc.)
- 8 melodic presets (arpeggios, basslines, melodies)
- Color-coded notes for easy visualization

### Track Mixer
- Unlimited tracks with solo/mute controls
- Per-track parameters: Gain, Pan, Speed, Cutoff, Resonance
- FT2-style oscilloscope per channel
- Stack drum patterns with melodies seamlessly

### Audio Visualizer
- 6 visualization modes: Bars, Wave, Circle, Starburst, Tunnel, Nebula
- Real-time frequency analysis
- Reactive to audio output

### Recording
- Record your sessions to audio files
- Export as WAV or WebM format
- Built-in audio conversion

### Project Management
- Save and load full arrangements with tracks
- Export/import projects as JSON (v2.0 format)
- Backwards compatible with legacy layer format
- Pattern library with categories and drag-to-timeline

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/musiclab.git
cd musiclab

# Install all dependencies (client + server)
npm install
cd server && npm install && cd ..

# Start everything (client + server)
npm run dev
```

- **Client**: http://localhost:5173
- **Server API**: http://localhost:3001

## Usage

### Quick Start

1. Click anywhere to initialize audio
2. Type a pattern in the editor: `bd sd hh oh`
3. Press Play or hit the play button
4. Adjust BPM with the tempo slider

### Pattern Syntax (Mini Notation)

```javascript
// Basic drum pattern
bd sd bd sd

// Hi-hat pattern with rests
hh hh ~ hh

// Grouping (plays faster)
[bd bd] sd [hh hh hh] sd

// Alternating patterns
<bd sd> hh

// Euclidean rhythms
bd(3,8)

// With effects
bd sd hh oh .speed(1.5) .gain(0.8)
```

### Sample Categories

| Category | Examples |
|----------|----------|
| Kicks | bd, kick, hardkick, softkick |
| Snares | sd, sn, snare, rim, clap, cp |
| Hi-hats | hh, ch, ho, chh, ohh |
| Percussion | perc, conga, bongo, tabla |
| Bass | bass, bass1, jvbass, moog |
| Synths | arpy, pluck, juno, fm |
| FX | noise, glitch, metal |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + Enter` | Evaluate pattern |
| `Ctrl/Cmd + .` | Stop playback |

## Architecture

```
MusicLab/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ArrangementView/  # DAW-style timeline
│   │   │   ├── Editor/     # Code editor, cheat sheet
│   │   │   ├── StepSequencer/    # Drum machine
│   │   │   ├── MelodicSequencer/ # Note sequencer
│   │   │   ├── Visualizer/       # Audio visualizations
│   │   │   └── Transport/        # Playback controls
│   │   ├── hooks/          # useStrudel, useArrangement
│   │   ├── store/          # Zustand state management
│   │   ├── strudel/        # Audio engine wrapper
│   │   └── data/           # Sample database
│   └── package.json
├── server/                 # Express backend (optional)
│   ├── routes/             # API routes
│   └── db/                 # JSON file storage
└── package.json            # Monorepo config
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Audio**: Strudel (@strudel/core, @strudel/mini, @strudel/webaudio)
- **Editor**: CodeMirror 6
- **State**: Zustand
- **Icons**: Lucide React
- **Backend**: Express (optional, for pattern storage)

## Development

```bash
# Run everything (client + server)
npm run dev

# Run client only (no server)
npm run dev:client

# Run server only
npm run dev:server

# Build client for production
npm run build

# Preview production build
npm run preview
```

### Server API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/patterns` | GET/POST | Pattern library CRUD |
| `/api/projects` | GET/POST | Project storage |

## Browser Support

MusicLab requires a modern browser with Web Audio API support:
- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

## Samples

MusicLab uses the [Dirt-Samples](https://github.com/tidalcycles/Dirt-Samples) collection from TidalCycles, providing 296 high-quality samples across 14 categories.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Strudel](https://strudel.cc/) - The amazing live coding library
- [TidalCycles](https://tidalcycles.org/) - The original live coding environment
- [Dirt-Samples](https://github.com/tidalcycles/Dirt-Samples) - Sample collection

---

Made with [Claude Code](https://claude.com/claude-code)
