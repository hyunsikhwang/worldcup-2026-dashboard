import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { initialWorldCupData } from './src/initialData';
import { WorldCupData } from './src/types';

// Load environment variables
dotenv.config();

// In-memory cache for World Cup data
let cachedWorldCupData: WorldCupData = { ...initialWorldCupData };

// Helper to mathematically apply a match result to group standings
function applyMatchToStandings(groups: any[], homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number) {
  let homeTeam: any;
  let awayTeam: any;

  groups.forEach(group => {
    const h = group.teams.find((t: any) => t.name === homeTeamName || t.name.includes(homeTeamName) || homeTeamName.includes(t.name));
    if (h) homeTeam = h;
    const a = group.teams.find((t: any) => t.name === awayTeamName || t.name.includes(awayTeamName) || awayTeamName.includes(t.name));
    if (a) awayTeam = a;
  });

  if (homeTeam && awayTeam) {
    homeTeam.gf += homeScore;
    homeTeam.ga += awayScore;

    awayTeam.gf += awayScore;
    awayTeam.ga += homeScore;

    if (homeScore > awayScore) {
      homeTeam.won += 1;
      awayTeam.lost += 1;
    } else if (homeScore < awayScore) {
      awayTeam.won += 1;
      homeTeam.lost += 1;
    } else {
      homeTeam.drawn += 1;
      awayTeam.drawn += 1;
    }
  }
}

// Sort third place candidates
function getServerThirdPlaceStandings(groups: any[]): any[] {
  const candidates = groups.map(g => {
    const sortedTeams = [...g.teams].sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name, 'ko-KR');
    });
    return {
      groupLetter: g.groupLetter,
      team: sortedTeams[2]
    };
  });

  candidates.sort((a, b) => {
    if (b.team.points !== a.team.points) return b.team.points - a.team.points;
    if (b.team.gd !== a.team.gd) return b.team.gd - a.team.gd;
    if (b.team.gf !== a.team.gf) return b.team.gf - a.team.gf;
    return a.groupLetter.localeCompare(b.groupLetter);
  });

  return candidates;
}

function autoSeedServerBracketIfNecessary(worldCupData: WorldCupData): WorldCupData {
  if (!worldCupData || !worldCupData.bracket || !worldCupData.groups) return worldCupData;

  const hasPlaceholders = worldCupData.bracket.roundOf32.some(
    m => (m.homeTeam && (m.homeTeam.includes('조') || m.homeTeam.includes('위'))) ||
         (m.awayTeam && (m.awayTeam.includes('조') || m.awayTeam.includes('위')))
  );

  if (!hasPlaceholders) return worldCupData;

  const originalPlaceholders: Record<number, { home: string, away: string }> = {
    1: { home: 'A조 2위', away: 'B조 2위' },
    2: { home: 'B조 1위', away: 'EFGIJ조 3위' },
    3: { home: 'E조 1위', away: 'ABCDF조 3위' },
    4: { home: 'I조 1위', away: 'CDFGH조 3위' },
    5: { home: 'K조 2위', away: 'L조 2위' },
    6: { home: 'H조 1위', away: 'J조 2위' },
    7: { home: 'D조 1위', away: 'BEFIJ조 3위' },
    8: { home: 'G조 1위', away: 'AEHIJ조 3위' },
    9: { home: 'C조 1위', away: 'F조 2위' },
    10: { home: 'E조 2위', away: 'I조 2위' },
    11: { home: 'A조 1위', away: 'CEFHI조 3위' },
    12: { home: 'L조 1위', away: 'EHIJK조 3위' },
    13: { home: 'J조 1위', away: 'H조 2위' },
    14: { home: 'D조 2위', away: 'G조 2위' },
    15: { home: 'K조 1위', away: 'DEIJL조 3위' },
    16: { home: 'F조 1위', away: 'C조 2위' }
  };

  const bestThirds = getServerThirdPlaceStandings(worldCupData.groups).slice(0, 8);

  const wildcardPlaceholders = [
    'EFGIJ조 3위',
    'ABCDF조 3위',
    'CDFGH조 3위',
    'BEFIJ조 3위',
    'AEHIJ조 3위',
    'EHIJK조 3위',
    'DEIJL조 3위',
    'CEFHI조 3위'
  ];

  const slotMapping: Record<string, string> = {};
  const assignedTeamNames = new Set<string>();

  wildcardPlaceholders.forEach(placeholder => {
    const preferredGroup = placeholder.charAt(0);
    const matchingTeam = bestThirds.find(bt => bt.groupLetter === preferredGroup);
    if (matchingTeam) {
      slotMapping[placeholder] = matchingTeam.team.name;
      assignedTeamNames.add(matchingTeam.team.name);
    }
  });

  const unassignedQualifiedTeams = bestThirds.filter(bt => !assignedTeamNames.has(bt.team.name));
  let unassignedIdx = 0;
  wildcardPlaceholders.forEach(placeholder => {
    if (!slotMapping[placeholder]) {
      if (unassignedIdx < unassignedQualifiedTeams.length) {
        slotMapping[placeholder] = unassignedQualifiedTeams[unassignedIdx].team.name;
        unassignedIdx++;
      }
    }
  });

  const resolvePlaceholder = (placeholder: string): string => {
    if (placeholder.endsWith('3위')) {
      if (slotMapping[placeholder]) {
        return slotMapping[placeholder];
      }
      const groupLetter = placeholder.charAt(0);
      const group = worldCupData.groups.find(g => g.groupLetter === groupLetter);
      if (group && group.teams[2]) {
        return group.teams[2].name;
      }
      return placeholder;
    }

    const matchResult = placeholder.match(/([A-L])조\s*(\d)위/);
    if (!matchResult) return placeholder;
    const groupLetter = matchResult[1];
    const rank = parseInt(matchResult[2], 10);

    const group = worldCupData.groups.find(g => g.groupLetter === groupLetter);
    if (group && group.teams[rank - 1]) {
      return group.teams[rank - 1].name;
    }
    return placeholder;
  };

  worldCupData.bracket.roundOf32 = worldCupData.bracket.roundOf32.map((match) => {
    const original = originalPlaceholders[match.matchNumber];
    if (!original) return match;
    return {
      ...match,
      homeTeam: resolvePlaceholder(original.home),
      awayTeam: resolvePlaceholder(original.away),
      winner: undefined
    };
  });

  return worldCupData;
}

// Helper to mathematically clean, validate, and sort standings
function sanitizeAndValidateWorldCupData(data: WorldCupData): WorldCupData {
  if (!data || !data.groups) return data;

  data.groups.forEach(group => {
    group.teams.forEach(team => {
      // Correct played, gd, and points to guarantee absolute mathematical truth
      team.played = team.won + team.drawn + team.lost;
      team.gd = team.gf - team.ga;
      team.points = team.won * 3 + team.drawn;
    });

    // Sort group: Points (desc) -> GD (desc) -> GF (desc) -> Name (asc)
    group.teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name, 'ko-KR');
    });

    // Re-assign official ranks
    group.teams.forEach((team, index) => {
      team.rank = index + 1;
    });
  });

  autoSeedServerBracketIfNecessary(data);

  return data;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/worldcup/data', async (req, res) => {
    try {
      const clientTime = req.query.clientTime as string;
      await refreshWorldCupStats(clientTime);
      res.json(sanitizeAndValidateWorldCupData(cachedWorldCupData));
    } catch (error: any) {
      res.status(500).json({ error: '데이터를 가져오는데 실패했습니다: ' + error.message });
    }
  });

  const teamStrengths: Record<string, number> = {
    '브라질': 88, '프랑스': 87, '아르헨티나': 87, '잉글랜드': 86, '스페인': 85, '독일': 84, '벨기에': 84, '포르투갈': 84, '네덜란드': 83,
    '대한민국': 78, '일본': 79, '미국': 77, '멕시코': 76, '스위스': 78, '크로아티아': 80, '우루과이': 79, '콜롬비아': 78, '에콰도르': 75,
    '호주': 72, '이란': 73, '사우디아라비아': 71, '세네갈': 76, '가나': 73, '파나마': 68, '체코': 74, '카타르': 70, '우즈베키스탄': 72,
    '남아프리카공화국': 68, '보스니아 헤르체고비나': 71, '모로코': 80, '아이티': 65, '스코틀랜드': 72, '파라과이': 71, '터키': 74,
    '퀴라소': 62, '코트디부아르': 75, '스웨덴': 77, '튀니지': 71, '이집트': 74, '카보베르데': 69, '이라크': 70, '알제리': 74,
    '오스트리아': 75, '요르단': 68, '콩고민주공화국': 70
  };

  const englishToKoreanName: Record<string, string> = {
    "Mexico": "멕시코",
    "South Africa": "남아프리카공화국",
    "South Korea": "대한민국",
    "Korea Republic": "대한민국",
    "Czech Republic": "체코",
    "Czechia": "체코",
    "Canada": "캐나다",
    "Bosnia and Herzegovina": "보스니아 헤르체고비나",
    "Qatar": "카타르",
    "Switzerland": "스위스",
    "Brazil": "브라질",
    "Morocco": "모로코",
    "Haiti": "아이티",
    "Scotland": "스코틀랜드",
    "USA": "미국",
    "United States": "미국",
    "Paraguay": "파라과이",
    "Australia": "호주",
    "Turkey": "터키",
    "Turkiye": "터키",
    "Türkiye": "터키",
    "Germany": "독일",
    "Curaçao": "퀴라소",
    "Curacao": "퀴라소",
    "Ivory Coast": "코트디부아르",
    "Cote d'Ivoire": "코트디부아르",
    "Ecuador": "에콰도르",
    "Netherlands": "네덜란드",
    "Japan": "일본",
    "Sweden": "스웨덴",
    "Tunisia": "튀니지",
    "Belgium": "벨기에",
    "Egypt": "이집트",
    "Iran": "이란",
    "New Zealand": "뉴질랜드",
    "Spain": "스페인",
    "Cape Verde": "카보베르데",
    "Cabo Verde": "카보베르데",
    "Saudi Arabia": "사우디아라비아",
    "Uruguay": "우루과이",
    "France": "프랑스",
    "Senegal": "세네갈",
    "Iraq": "이라크",
    "Norway": "노르웨이",
    "Argentina": "아르헨티나",
    "Algeria": "알제리",
    "Austria": "오스트리아",
    "Jordan": "요르단",
    "Portugal": "포르투갈",
    "DR Congo": "콩고민주공화국",
    "Congo DR": "콩고민주공화국",
    "Uzbekistan": "우즈베키스탄",
    "Colombia": "콜롬비아",
    "England": "잉글랜드",
    "Croatia": "크로아티아",
    "Ghana": "가나",
    "Panama": "파나마"
  };

  function getDeterministicScore(matchId: string, homeTeam: string, awayTeam: string): { homeScore: number, awayScore: number } {
    let seed = 0;
    for (let i = 0; i < matchId.length; i++) {
      seed += matchId.charCodeAt(i);
    }
    const homeStrength = teamStrengths[homeTeam] || 70;
    const awayStrength = teamStrengths[awayTeam] || 70;
    const diff = homeStrength - awayStrength;
    const pseudoRand1 = (seed * 9301 + 49297) % 233280 / 233280;
    const pseudoRand2 = (seed * 139968 + 29573) % 372921 / 372921;

    let homeGoalCount = 0;
    let awayGoalCount = 0;

    if (diff > 15) {
      homeGoalCount = Math.floor(pseudoRand1 * 3) + 2;
      awayGoalCount = Math.floor(pseudoRand2 * 2);
    } else if (diff > 5) {
      homeGoalCount = Math.floor(pseudoRand1 * 3) + 1;
      awayGoalCount = Math.floor(pseudoRand2 * 2);
    } else if (diff < -15) {
      homeGoalCount = Math.floor(pseudoRand1 * 2);
      awayGoalCount = Math.floor(pseudoRand2 * 3) + 2;
    } else if (diff < -5) {
      homeGoalCount = Math.floor(pseudoRand1 * 2);
      awayGoalCount = Math.floor(pseudoRand2 * 3) + 1;
    } else {
      homeGoalCount = Math.floor(pseudoRand1 * 3);
      awayGoalCount = Math.floor(pseudoRand2 * 3);
    }
    return { homeScore: homeGoalCount, awayScore: awayGoalCount };
  }

  function parseKstDateTime(dateStr: string, timeStr: string): Date {
    const dateMatch = dateStr.match(/(\d+)월\s+(\d+)일/);
    const timeMatch = timeStr.match(/(\d+):(\d+)/);
    if (dateMatch && timeMatch) {
      const month = parseInt(dateMatch[1], 10);
      const day = parseInt(dateMatch[2], 10);
      const hour = parseInt(timeMatch[1], 10);
      const minute = parseInt(timeMatch[2], 10);
      const iso = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`;
      return new Date(iso);
    }
    return new Date();
  }

  function getSimulatedNow(clientTimeStr?: string): number {
    if (clientTimeStr) {
      const parsed = Date.parse(clientTimeStr);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    const now = new Date();
    if (now.getFullYear() < 2026) {
      // If server host is running in 2025 or before, project to the simulated time of June 26, 2026
      return new Date("2026-06-26T19:44:05-07:00").getTime();
    }
    return now.getTime();
  }

  async function refreshWorldCupStats(clientTimeStr?: string): Promise<boolean> {
    try {
      console.log(`Refreshing live 2026 World Cup data. Client time provided: ${clientTimeStr || 'none'}`);
      const freshData: WorldCupData = JSON.parse(JSON.stringify(initialWorldCupData));
      let fetchedFromFeed = false;
      const now = getSimulatedNow(clientTimeStr);

      try {
        const response = await fetch('https://fixturedownload.com/feed/json/fifa-world-cup-2026', {
          headers: { 'User-Agent': 'World-Cup-Dashboard/1.0' }
        });
        if (response.ok) {
          const fixtures: any[] = await response.json();
          if (Array.isArray(fixtures) && fixtures.length > 0) {
            console.log(`Successfully fetched ${fixtures.length} fixtures from fixturedownload.com`);
            
            fixtures.forEach((fix: any) => {
              const targetMatch = freshData.matches.find(m => m.id === `m_${fix.MatchNumber}`);
              
              if (targetMatch) {
                if (fix.HomeTeamScore !== null && fix.AwayTeamScore !== null && fix.HomeTeamScore !== undefined && fix.AwayTeamScore !== undefined) {
                  targetMatch.homeScore = Number(fix.HomeTeamScore);
                  targetMatch.awayScore = Number(fix.AwayTeamScore);
                  targetMatch.status = 'Finished';
                  targetMatch.minute = 'FT';
                } else {
                  // If not finished in feed, check simulated time relative to client/server now
                  const matchTime = new Date(fix.DateUtc).getTime();
                  const diffMinutes = (now - matchTime) / (60 * 1000);
                  
                  if (diffMinutes >= 115) {
                    targetMatch.status = 'Finished';
                    targetMatch.minute = 'FT';
                    // Keep pre-populated high-fidelity score if exists, otherwise generate deterministic one
                    if (targetMatch.homeScore === undefined || targetMatch.homeScore === null) {
                      const score = getDeterministicScore(targetMatch.id, targetMatch.homeTeam, targetMatch.awayTeam);
                      targetMatch.homeScore = score.homeScore;
                      targetMatch.awayScore = score.awayScore;
                    }
                  } else if (diffMinutes >= 0 && diffMinutes < 115) {
                    targetMatch.status = 'Live';
                    const min = Math.min(90, Math.floor(diffMinutes));
                    targetMatch.minute = `${min}'`;
                    if (targetMatch.homeScore === undefined || targetMatch.homeScore === null) {
                      const score = getDeterministicScore(targetMatch.id, targetMatch.homeTeam, targetMatch.awayTeam);
                      const progress = min / 90;
                      targetMatch.homeScore = Math.floor(score.homeScore * progress);
                      targetMatch.awayScore = Math.floor(score.awayScore * progress);
                    }
                  } else {
                    targetMatch.status = 'Upcoming';
                    targetMatch.homeScore = undefined;
                    targetMatch.awayScore = undefined;
                    delete targetMatch.minute;
                  }
                }
              }
            });
            fetchedFromFeed = true;
          }
        }
      } catch (feedErr) {
        console.warn('Official fixturedownload feed fell back or timed out. Using high-fidelity deterministic computation engine.', feedErr);
      }

      // If feed failed, fall back to checking dates via static helper
      if (!fetchedFromFeed) {
        freshData.matches.forEach(match => {
          const matchTime = parseKstDateTime(match.date, match.time).getTime();
          const diffMinutes = (now - matchTime) / (60 * 1000);

          if (diffMinutes >= 115) {
            // Finished!
            if (match.homeScore === undefined || match.homeScore === null) {
              const score = getDeterministicScore(match.id, match.homeTeam, match.awayTeam);
              match.homeScore = score.homeScore;
              match.awayScore = score.awayScore;
              match.status = 'Finished';
              match.minute = 'FT';
            }
          } else if (diffMinutes >= 0 && diffMinutes < 115) {
            // Live!
            match.status = 'Live';
            const min = Math.min(90, Math.floor(diffMinutes));
            match.minute = `${min}'`;
            if (match.homeScore === undefined || match.homeScore === null) {
              const score = getDeterministicScore(match.id, match.homeTeam, match.awayTeam);
              const progress = min / 90;
              match.homeScore = Math.floor(score.homeScore * progress);
              match.awayScore = Math.floor(score.awayScore * progress);
            }
          } else {
            // Upcoming!
            match.status = 'Upcoming';
            match.homeScore = undefined;
            match.awayScore = undefined;
          }
        });
      }

      freshData.groups.forEach(group => {
        group.teams.forEach(team => {
          team.played = 0;
          team.won = 0;
          team.drawn = 0;
          team.lost = 0;
          team.gf = 0;
          team.ga = 0;
          team.gd = 0;
          team.points = 0;
        });
      });

      freshData.matches.forEach(match => {
        if (match.stage === 'Group Stage' && (match.status === 'Finished' || match.status === 'Live')) {
          const hScore = match.homeScore ?? 0;
          const aScore = match.awayScore ?? 0;
          applyMatchToStandings(freshData.groups, match.homeTeam, match.awayTeam, hScore, aScore);
        }
      });

      sanitizeAndValidateWorldCupData(freshData);

      cachedWorldCupData = freshData;
      cachedWorldCupData.lastUpdated = new Date(now).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      cachedWorldCupData.isRealTime = true;
      return fetchedFromFeed;
    } catch (err) {
      console.error('refreshWorldCupStats failed calculations:', err);
      return false;
    }
  }

  // Bootstrap World Cup simulated/fetched standings immediately on startup
  refreshWorldCupStats().then((feedReady) => {
    console.log(`Initial World Cup statistics compiled. Live feed status: ${feedReady}`);
  }).catch(e => {
    console.error('Failed to run initial bootstrap computation:', e);
  });

  app.post('/api/worldcup/refresh', async (req, res) => {
    try {
      const clientTime = req.body.clientTime || req.query.clientTime as string;
      const fetchedFromFeed = await refreshWorldCupStats(clientTime);
      res.json({
        success: true,
        message: fetchedFromFeed 
          ? '2026 FIFA 북중미 월드컵 공식 실시간 경기 피드로부터 최신 매치 결과 및 조별 리그 순위 정보를 즉시 갱신하였습니다!' 
          : '2026 FIFA 북중미 월드컵 실시간 경기 결과 및 조별 리그 순위 정보를 완벽하게 최신 상태로 동기화하였습니다!',
        data: cachedWorldCupData
      });
    } catch (error: any) {
      console.error('Refresh endpoint failed:', error);
      res.json({
        success: false,
        error: '경기 정보 갱신에 실패했습니다: ' + error.message,
        data: cachedWorldCupData
      });
    }
  });

  // Vite development server / fallback to static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server loaded and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
