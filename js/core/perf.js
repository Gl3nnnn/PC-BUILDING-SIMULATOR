export const RESOLUTIONS = [
  { id: '1080p', label: '1080p', sublabel: '1920 × 1080', multiplier: 1 },
  { id: '1440p', label: '1440p', sublabel: '2560 × 1440', multiplier: 0.67 },
  { id: '4k', label: '4K', sublabel: '3840 × 2160', multiplier: 0.38 },
];

export const QUALITY = [
  { id: 'low', label: 'Low', multiplier: 1.45 },
  { id: 'medium', label: 'Medium', multiplier: 1.25 },
  { id: 'high', label: 'High', multiplier: 1.08 },
  { id: 'ultra', label: 'Ultra', multiplier: 1 },
];

export const GAMES = [
  { id: 'valorant', name: 'Valorant', genre: 'Tactical FPS', gpuWeight: 9.2, cpuCap: 6.6, accent: '#f43f5e' },
  { id: 'cs2', name: 'Counter-Strike 2', genre: 'Tactical FPS', gpuWeight: 7.4, cpuCap: 6.0, accent: '#f59e0b' },
  { id: 'apex', name: 'Apex Legends', genre: 'Battle Royale', gpuWeight: 5.6, cpuCap: 4.2, accent: '#ef4444' },
  { id: 'fortnite', name: 'Fortnite', genre: 'Battle Royale', gpuWeight: 3.5, cpuCap: 3.3, accent: '#8b5cf6' },
  { id: 'gta5', name: 'GTA V', genre: 'Open world', gpuWeight: 4.3, cpuCap: 2.6, accent: '#22c55e' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', genre: 'Open-world RPG', gpuWeight: 2.25, cpuCap: 2.0, accent: '#facc15' },
  { id: 'eldenring', name: 'Elden Ring', genre: 'Action RPG', gpuWeight: 2.9, cpuCap: 2.3, fpsCap: 60, accent: '#d4a373' },
  { id: 'forza', name: 'Forza Horizon 5', genre: 'Racing', gpuWeight: 3.7, cpuCap: 2.8, accent: '#38bdf8' },
  { id: 'hogwarts', name: 'Hogwarts Legacy', genre: 'Action RPG', gpuWeight: 2.1, cpuCap: 1.8, accent: '#a78bfa' },
  { id: 'msfs', name: 'Microsoft Flight Simulator', genre: 'Simulation', gpuWeight: 1.8, cpuCap: 2.7, accent: '#60a5fa' },
];

export const GAMES_BY_ID = Object.fromEntries(GAMES.map((game) => [game.id, game]));

export function resolutionById(id) {
  return RESOLUTIONS.find((entry) => entry.id === id) || RESOLUTIONS[0];
}

export function qualityById(id) {
  return QUALITY.find((entry) => entry.id === id) || QUALITY[3];
}

export function fpsTier(fps) {
  if (fps >= 144) return { label: 'Competitive', tone: 'excellent' };
  if (fps >= 100) return { label: 'Excellent', tone: 'great' };
  if (fps >= 60) return { label: 'Smooth', tone: 'good' };
  if (fps >= 40) return { label: 'Playable', tone: 'fair' };
  return { label: 'Limited', tone: 'low' };
}

export function estimatePerformance({ cpu, gpu, resolution = '1080p', quality = 'ultra' }) {
  const base = {
    ready: false,
    reason: '',
    integrated: !gpu,
    cpu: cpu || null,
    gpu: gpu || null,
    cpuScore: null,
    gpuScore: null,
    resolution: resolutionById(resolution),
    quality: qualityById(quality),
    games: [],
    hitRate: 0,
  };

  if (!cpu) {
    return { ...base, reason: 'Select a CPU to estimate gaming performance.' };
  }

  const integratedScore = Number(cpu.specs.igpuScore) || 0;
  const gpuScore = gpu ? Number(gpu.score) : integratedScore;
  const cpuScore = Number(cpu.score);

  if (!Number.isFinite(gpuScore) || gpuScore <= 0) {
    return { ...base, reason: 'This CPU has no integrated graphics and no dedicated GPU is selected.' };
  }
  if (!Number.isFinite(cpuScore) || cpuScore <= 0) {
    return { ...base, reason: 'The selected CPU does not have a performance score yet.' };
  }

  const res = resolutionById(resolution);
  const qual = qualityById(quality);
  const cpuQualityMultiplier = Math.pow(qual.multiplier, 0.35);

  const games = GAMES.map((game) => {
    const gpuLimit = gpuScore * game.gpuWeight * res.multiplier * qual.multiplier;
    const cpuLimit = cpuScore * game.cpuCap * cpuQualityMultiplier;
    let fps = Math.min(gpuLimit, cpuLimit * 1.08);
    const uncapped = fps;
    if (game.fpsCap) fps = Math.min(fps, game.fpsCap);
    const finalFps = Math.max(1, Math.round(fps));
    const spread = finalFps < 50 ? 0.15 : 0.09;
    const low = Math.max(1, Math.round(finalFps * (1 - spread)));
    const high = Math.round(Math.min(game.fpsCap || Infinity, finalFps * (1 + spread)));
    const bottleneck = gpuLimit < cpuLimit * 0.92 ? 'GPU' : cpuLimit < gpuLimit * 0.92 ? 'CPU' : 'Balanced';
    return {
      ...game,
      fps: finalFps,
      low,
      high: Math.max(high, finalFps),
      bottleneck,
      tier: fpsTier(finalFps),
      capped: Boolean(game.fpsCap && uncapped > game.fpsCap),
    };
  });

  const hitRate = games.filter((game) => game.fps >= 60).length;
  const average = Math.round(games.reduce((sum, game) => sum + game.fps, 0) / games.length);

  return {
    ...base,
    ready: true,
    integrated: !gpu,
    cpuScore,
    gpuScore,
    games,
    hitRate,
    average,
    resolution: res,
    quality: qual,
  };
}

export function performanceVerdict(result) {
  if (!result?.ready) return null;
  const ratio = result.hitRate / result.games.length;
  if (result.resolution.id === '4k' && ratio >= 0.8) return { title: '4K-capable', detail: 'Most tested titles should hold 60 FPS or more at these settings.' };
  if (result.resolution.id === '1440p' && ratio >= 0.8) return { title: '1440p powerhouse', detail: 'High-refresh 1440p gaming looks comfortable at these settings.' };
  if (ratio >= 0.8) return { title: 'Great match', detail: 'Most tested titles should average 60 FPS or more at these settings.' };
  if (ratio >= 0.5) return { title: 'Playable, with settings tuning', detail: 'Lower quality or enable upscaling to reach a steady 60 FPS in heavier titles.' };
  return { title: 'Performance limited', detail: 'Consider lowering resolution or quality, or upgrading the graphics card.' };
}
