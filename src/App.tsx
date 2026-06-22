import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  RefreshCw, 
  Calendar, 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  Search, 
  Sparkles, 
  Activity, 
  Check, 
  Play, 
  Clock, 
  Award,
  ChevronRight,
  Info,
  List,
  GitFork
} from 'lucide-react';
import { WorldCupData, GroupStanding, Match, BracketMatch, AIAnalysis } from './types';
import { getCountryFlag, formatTeamNameWithFlag } from './utils/flags';

interface ThirdPlaceCandidate {
  groupLetter: string;
  team: any;
}

export function getThirdPlaceStandings(groups: GroupStanding[]): ThirdPlaceCandidate[] {
  const candidates = groups.map(g => {
    // Sort group teams (Points desc -> GD desc -> GF desc -> Alphabetical name asc)
    const sortedTeams = [...g.teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name, 'ko-KR');
    });
    return {
      groupLetter: g.groupLetter,
      team: sortedTeams[2] // 3위 팀 (index 2)
    };
  });

  // Sort candidates against each other (Points desc -> GD desc -> GF desc -> Group letter asc)
  candidates.sort((a, b) => {
    if (b.team.points !== a.team.points) return b.team.points - a.team.points;
    if (b.team.gd !== a.team.gd) return b.team.gd - a.team.gd;
    if (b.team.gf !== a.team.gf) return b.team.gf - a.team.gf;
    return a.groupLetter.localeCompare(b.groupLetter);
  });

  return candidates;
}

export default function App() {
  const theme = 'light';

  const [data, setData] = useState<WorldCupData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'standings' | 'bracket'>('standings');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customHomeScore, setCustomHomeScore] = useState<Record<string, number>>({});
  const [customAwayScore, setCustomAwayScore] = useState<Record<string, number>>({});
  const [apiNotification, setApiNotification] = useState<{message: string, type: 'info' | 'success' | 'amber'} | null>(null);

  // Bracket UX states for responsive design
  const [bracketViewMode, setBracketViewMode] = useState<'list' | 'tree'>('list');

  useEffect(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }, []);
  const [selectedBracketRound, setSelectedBracketRound] = useState<'roundOf32' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final'>('roundOf32');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) {
        setBracketViewMode('tree');
      } else {
        setBracketViewMode('list');
      }
    }
  }, []);

  // Fetch initial data
  const fetchWorldCupData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/worldcup/data');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('Failed to load data');
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorldCupData();
  }, []);

  // Refresh via Gemini search grounding
  const handleRefresh = async () => {
    setRefreshing(true);
    setApiNotification(null);
    try {
      const response = await fetch('/api/worldcup/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      // Always update state if data exists, to ensure high-fidelity fallback is synced
      if (result.data) {
        setData(result.data);
      }

      if (!result.success) {
        setApiNotification({
          message: result.error || '실시간 갱신 중 오류가 발생했습니다.',
          type: 'amber'
        });
      }
    } catch (error: any) {
      setApiNotification({
        message: '네트워크 연결 상태를 확인해 주세요.',
        type: 'amber'
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-8">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-emerald-200 rounded-full animate-pulse"></div>
          <div className="absolute inset-x-0 top-0 border-4 border-emerald-600 rounded-full animate-spin border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-emerald-600 animate-bounce">🏆</div>
        </div>
        <h2 className="text-xl font-bold mb-2">2026 북중미 월드컵 데이터 로드 중</h2>
        <p className="text-slate-500 text-sm animate-pulse">실시간 FIFA 경기 피드 및 일정 테이블을 연동하고 있습니다...</p>
      </div>
    );
  }

  // Bracket logic: update interactive bracket on local frontend click
  const handleBracketMatchWinner = (roundKey: 'roundOf32' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final', matchId: string, winnerName: string) => {
    // Return a copy with updated winner
    const updatedData = { ...data };
    const roundMatches: BracketMatch[] = updatedData.bracket[roundKey] as any;
    const matchIdx = roundMatches.findIndex(m => m.id === matchId);
    
    if (matchIdx !== -1) {
      const updatedMatch = { ...roundMatches[matchIdx], winner: winnerName };
      
      // Update match record
      roundMatches[matchIdx] = updatedMatch;
      
      // Propagate winner to nextMatchId
      if (updatedMatch.nextMatchId) {
        // Track down where the next level lives
        let nextRoundKey: 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final' | null = null;
        if (roundKey === 'roundOf32') nextRoundKey = 'roundOf16';
        else if (roundKey === 'roundOf16') nextRoundKey = 'quarterFinals';
        else if (roundKey === 'quarterFinals') nextRoundKey = 'semiFinals';
        else if (roundKey === 'semiFinals') nextRoundKey = 'final';

        if (nextRoundKey) {
          const nextRoundMatches: BracketMatch[] = updatedData.bracket[nextRoundKey] as any;
          // Find the target match based on parent match reference
          // In World Cup, each consecutive pair feeds into next match's Home or Away slots
          const parentMatchNum = updatedMatch.matchNumber;
          const targetMatchId = updatedMatch.nextMatchId;
          const nextMatchIdx = nextRoundMatches.findIndex(m => m.id === targetMatchId);

          if (nextMatchIdx !== -1) {
            const nextMatch = { ...nextRoundMatches[nextMatchIdx] };
            // If parent match number is odd, fill homeTeam; if even, fill awayTeam
            if (parentMatchNum % 2 === 1) {
              nextMatch.homeTeam = winnerName;
            } else {
              nextMatch.awayTeam = winnerName;
            }
            nextRoundMatches[nextMatchIdx] = nextMatch;
          }
        }
      }
      setData(updatedData);
    }
  };

  // Render Bracket Connection Paths or Info
  const groupsList = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  
  // Filter core static groups data based on search and tab selections
  const filteredGroups = data.groups.filter(g => {
    if (selectedGroupFilter !== 'ALL' && g.groupLetter !== selectedGroupFilter) {
      return false;
    }
    if (searchTerm) {
      return g.teams.some(t => t.name.includes(searchTerm));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans leading-relaxed transition-colors duration-300">
      {/* Top Notice Banner */}
      {apiNotification && (
        <div className={`p-4 text-center text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-3 ${
          apiNotification.type === 'success' 
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200' 
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200'
        }`} id="live-notification">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{apiNotification.message}</span>
          <button 
            onClick={() => setApiNotification(null)}
            className="ml-4 px-2 py-1 text-xs font-bold rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      )}

      {/* Modern High-Contrast Elegant Header */}
      <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white relative overflow-hidden border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 dark:from-emerald-950/40 via-white dark:via-slate-950 to-white dark:to-slate-950 -z-1 transition-colors duration-300"></div>
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 select-none">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                2026 FIFA World Cup Live Grounding Mode
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white" id="main-title">
                2026 북중미 월드컵 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500">실시간 순위 & 대진표</span>
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-slate-500 dark:text-slate-400" id="metadata-bar">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/65">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>최종 갱신: <strong className="text-slate-700 dark:text-slate-200">{data.lastUpdated}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/65">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span>위치 기반 검색 지원</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center" id="quick-actions-card">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/10 active:translate-y-0.5 transition cursor-pointer text-sm"
                id="refresh-grounding-btn"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? '실시간 정보 확인 중...' : '실시간 정보 및 대진 갱신'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-20 border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-300" id="navigation-tabs">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-none items-center justify-between gap-8 h-14">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('standings')}
                className={`h-14 px-3 flex items-center gap-2 font-bold text-sm border-b-2 transition relative ${
                  activeTab === 'standings' 
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' 
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                id="tab-btn-standings"
              >
                <Layers className="w-4 h-4" />
                <span>조별리그 예선 상황</span>
              </button>

              <button
                onClick={() => setActiveTab('bracket')}
                className={`h-14 px-3 flex items-center gap-2 font-bold text-sm border-b-2 transition ${
                  activeTab === 'bracket' 
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' 
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                id="tab-btn-bracket"
              >
                <Trophy className="w-4 h-4" />
                <span>토너먼트 실시간 대진표</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="국가명으로 순위 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-none outline-none pl-9 pr-4 py-1.5 rounded-lg text-xs w-48 focus:w-60 focus:bg-slate-200/80 dark:focus:bg-slate-700 transition-all focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* STANDINGS TAB */}
        {activeTab === 'standings' && (
          <div className="space-y-8 animate-fade-in" id="content-standings">
            {/* Filter and Overview Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5" id="group-filters">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2 uppercase tracking-wide">조별 보기</span>
                {groupsList.map(grp => (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroupFilter(grp)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      selectedGroupFilter === grp
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {grp === 'ALL' ? '전체 보기' : `${grp}조`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-800 block rounded-xs"></span>
                  <span>1~2위 본선 진출</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 block rounded-xs"></span>
                  <span>3위 와일드카드 후보군</span>
                </div>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="groups-standings-grid">
              {filteredGroups.map(group => {
                // Check if Korea Republic (대한민국) is in this group
                const hasKorea = group.teams.some(team => team.name.includes('대한민국'));
                
                return (
                  <div 
                    key={group.groupLetter} 
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition shadow-sm hover:shadow-md overflow-visible relative z-10 hover:z-20 ${
                      hasKorea 
                        ? 'ring-2 ring-rose-500/80 border-rose-200 dark:border-rose-900/60 dark:ring-rose-500/50' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                    id={`group-card-${group.groupLetter}`}
                  >
                    <div className={`px-4 py-3.5 flex items-center justify-between font-bold rounded-t-2xl ${
                      hasKorea 
                        ? 'bg-rose-50/55 border-b border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 dark:bg-rose-950/20' 
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">Group {group.groupLetter}</span>
                        {hasKorea && (
                          <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse">
                            대한민국 조
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">조별 리그 진척</span>
                    </div>

                    <div className="overflow-visible">
                      <table className="w-full text-left text-xs min-w-[320px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-800">
                            <th className="py-2.5 px-3 text-center w-8">순위</th>
                            <th className="py-2.5 px-1">국가명</th>
                            <th className="py-2.5 px-1 text-center w-8">경기</th>
                            <th className="py-2.5 px-1 text-center w-8">승</th>
                            <th className="py-2.5 px-1 text-center w-8">무</th>
                            <th className="py-2.5 px-1 text-center w-8">패</th>
                            <th className="py-2.5 px-1 text-center w-8">득실</th>
                            <th className="py-2.5 px-2.5 text-center font-bold text-slate-600 dark:text-slate-350 w-14 whitespace-nowrap">승점</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.teams.map((team, idx) => {
                            const isAdvancing = team.rank <= 2;
                            const isThirdPlacePotential = team.rank === 3;
                            const isKorea = team.name.includes('대한민국');

                            return (
                              <tr 
                                key={team.name}
                                className={`border-b border-slate-100/60 dark:border-slate-800/40 hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors ${
                                  isKorea ? 'bg-rose-50/30 dark:bg-rose-950/15' : ''
                                }`}
                              >
                                <td className="py-3 px-3 text-center">
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-[11px] ${
                                    isKorea 
                                      ? 'bg-rose-600 text-white'
                                      : isAdvancing 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                        : isThirdPlacePotential 
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-300' 
                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                  }`}>
                                    {team.rank}
                                  </span>
                                </td>
                                <td className="py-3 px-1 font-semibold text-slate-800 dark:text-slate-200 relative overflow-visible group/tooltip cursor-help">
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-base">{getCountryFlag(team.name)}</span>
                                    <span className={`truncate max-w-[95px] ${isKorea ? 'text-rose-700 dark:text-rose-400 font-extrabold' : ''}`} title={team.name}>
                                      {team.name}
                                    </span>
                                  </span>

                                  {/* Hover match results Tooltip */}
                                  <div className={`absolute z-30 hidden group-hover/tooltip:flex flex-col w-[275px] bg-slate-900/95 backdrop-blur-md border border-slate-700/40 text-slate-200 rounded-xl shadow-2xl p-3 text-xs leading-relaxed pointer-events-none transition-all duration-200 ease-out origin-left animate-fade-in ${
                                    team.rank <= 2 
                                      ? "top-1 left-[75px]" 
                                      : "bottom-1 left-[75px]"
                                  }`}>
                                    {/* Tooltip Header */}
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 font-bold text-white">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-base">{getCountryFlag(team.name)}</span>
                                        <span>{team.name} 조별 매치 기록</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-normal">경과전적: {team.played}전 {team.won}승 {team.drawn}무 {team.lost}패</span>
                                    </div>

                                    {/* Matches List */}
                                    <div className="space-y-1.5">
                                      {(() => {
                                        const teamMatches = data.matches.filter(m => 
                                          (m.homeTeam === team.name || m.awayTeam === team.name) && 
                                          m.stage === 'Group Stage'
                                        );

                                        if (teamMatches.length === 0) {
                                          return <p className="text-slate-500 text-center py-1 text-[11px]">매치 기록이 존재하지 않습니다.</p>;
                                        }

                                        return teamMatches.map((m) => {
                                          const isHome = m.homeTeam === team.name;
                                          const opponent = isHome ? m.awayTeam : m.homeTeam;
                                          const isFinished = m.status === 'Finished';
                                          const isLive = m.status === 'Live';
                                          
                                          let resultText = '';
                                          let scoreText = '';
                                          let badgeColor = 'bg-slate-800 text-slate-400 border border-slate-700/20';
                                          
                                          if (isFinished) {
                                            const teamScore = isHome ? m.homeScore : m.awayScore;
                                            const oppScore = isHome ? m.awayScore : m.homeScore;
                                            scoreText = `${teamScore} - ${oppScore}`;
                                            if (teamScore! > oppScore!) {
                                              resultText = '승';
                                              badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                                            } else if (teamScore! < oppScore!) {
                                              resultText = '패';
                                              badgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                                            } else {
                                              resultText = '무';
                                              badgeColor = 'bg-slate-800 text-slate-300 border border-slate-700/20';
                                            }
                                          } else if (isLive) {
                                            const teamScore = isHome ? m.homeScore : m.awayScore;
                                            const oppScore = isHome ? m.awayScore : m.homeScore;
                                            scoreText = `${teamScore} - ${oppScore}`;
                                            resultText = m.minute || 'LIVE';
                                            badgeColor = 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse';
                                          } else {
                                            scoreText = 'vs';
                                            resultText = '예정';
                                            badgeColor = 'bg-slate-800 text-slate-400 border border-slate-700/20';
                                          }

                                          return (
                                            <div key={m.id} className="flex items-center justify-between gap-1.5 py-1 px-1.5 rounded bg-slate-800/20 hover:bg-slate-800/50 transition-colors border border-slate-800/10">
                                              <div className="flex items-center gap-1 text-[10px] text-slate-500 w-12 shrink-0">
                                                <span>{m.date}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 truncate text-slate-300 flex-1">
                                                <span className="text-[13px]">{getCountryFlag(opponent)}</span>
                                                <span className="truncate font-medium text-slate-200">{opponent}</span>
                                              </div>
                                              <div className="flex items-center gap-2 justify-end shrink-0 whitespace-nowrap min-w-[70px]">
                                                <span className="font-mono text-white text-[10px] font-bold whitespace-nowrap">{scoreText}</span>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 text-center min-w-[32px] ${badgeColor}`}>{resultText}</span>
                                              </div>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-1 text-center text-slate-500 dark:text-slate-400">{team.played}</td>
                                <td className="py-3 px-1 text-center text-slate-600 dark:text-slate-350">{team.won}</td>
                                <td className="py-3 px-1 text-center text-slate-600 dark:text-slate-350">{team.drawn}</td>
                                <td className="py-3 px-1 text-center text-slate-600 dark:text-slate-350">{team.lost}</td>
                                <td className="py-3 px-1 text-center font-mono text-xs text-slate-500 font-medium whitespace-nowrap">
                                   {team.gd > 0 ? `+${team.gd}` : team.gd}
                                 </td>
                                 <td className="py-3 px-2.5 text-center font-extrabold text-slate-900 dark:text-slate-100 bg-slate-50/20 dark:bg-slate-800/10 whitespace-nowrap">
                                   {team.points}
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 );
               })}
             </div>

             {/* 3위 와일드카드 실시간 종합 순위표 Section */}
             {selectedGroupFilter === 'ALL' && !searchTerm && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fade-in mt-6" id="wildcard-ranking-section">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-100/70 border border-amber-200 text-amber-800 p-2 rounded-xl">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        각 조 3위 팀간 와일드카드 실시간 종합 순위표
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        12개 조의 3위 팀 중 <strong className="text-amber-700">상위 8개 팀</strong>이 본선 32강에 와일드카드로 진출하며, 하위 4개 팀은 탈락합니다.
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-mono shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>순위 기준: 승점 → 골득실 → 다득점 → 소속조 순</span>
                  </div>
                </div>

                {/* Desktop/Tablet Table Layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="py-2 px-3 text-center w-12 text-[10px] uppercase tracking-wider">순위</th>
                        <th className="py-2 px-3 text-center w-14 text-[10px] uppercase tracking-wider">소속 조</th>
                        <th className="py-2 px-4 text-left text-[10px] uppercase tracking-wider">국가명</th>
                        <th className="py-2 px-2 text-center w-10 text-[10px] uppercase tracking-wider">경기</th>
                        <th className="py-2 px-2 text-center w-10 text-[10px] uppercase tracking-wider">승</th>
                        <th className="py-2 px-2 text-center w-10 text-[10px] uppercase tracking-wider">무</th>
                        <th className="py-2 px-2 text-center w-10 text-[10px] uppercase tracking-wider">패</th>
                        <th className="py-2 px-2 text-center w-16 text-[10px] uppercase tracking-wider">득/실</th>
                        <th className="py-2 px-2 text-center w-16 text-[10px] uppercase tracking-wider">골득실</th>
                        <th className="py-2 px-3 text-center font-bold text-amber-700 bg-amber-50/40 w-16 text-[10px] uppercase tracking-wider">승점</th>
                        <th className="py-2 px-4 text-center w-28 text-[10px] uppercase tracking-wider">본선 진출상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {getThirdPlaceStandings(data.groups).map((item, index) => {
                        const rank = index + 1;
                        const isQualified = rank <= 8;
                        const team = item.team;
                        const isKorea = team.name.includes('대한민국');

                        return (
                          <tr 
                            key={item.groupLetter} 
                            className={`hover:bg-slate-50/50 transition-colors ${
                              isKorea ? 'bg-rose-50/40' : (isQualified ? 'bg-emerald-50/5' : 'bg-rose-50/5')
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                                isQualified 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {rank}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500">{item.groupLetter}조</td>
                            <td className="py-2.5 px-4 font-bold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm shrink-0">{getCountryFlag(team.name)}</span>
                                <span className={isKorea ? 'text-rose-700 font-extrabold underline decoration-rose-300' : ''}>{team.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center">{team.played}</td>
                            <td className="py-2.5 px-2 text-center text-slate-500">{team.won}</td>
                            <td className="py-2.5 px-2 text-center text-slate-500">{team.drawn}</td>
                            <td className="py-2.5 px-2 text-center text-slate-500">{team.lost}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-400">{team.gf}/{team.ga}</td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600">
                              {team.gd > 0 ? `+${team.gd}` : team.gd}
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-amber-800 bg-amber-50/25">
                              {team.points}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {isQualified ? (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                                  <Check className="w-2.5 h-2.5" /> 32강 본선 진출
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-rose-500/10 text-rose-700 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/20 whitespace-nowrap">
                                  예선 탈락 대상
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card-based Layout */}
                <div className="block sm:hidden space-y-3" id="wildcard-mobile-list">
                  {getThirdPlaceStandings(data.groups).map((item, index) => {
                    const rank = index + 1;
                    const isQualified = rank <= 8;
                    const team = item.team;
                    const isKorea = team.name.includes('대한민국');

                    return (
                      <div 
                        key={item.groupLetter} 
                        className={`p-3.5 rounded-xl border transition-all ${
                          isKorea 
                            ? 'bg-rose-50/50 border-rose-200 shadow-xs' 
                            : (isQualified ? 'bg-emerald-50/10 border-slate-150 shadow-xs' : 'bg-slate-50/40 border-slate-150')
                        }`}
                      >
                        {/* Header bar with rank, country name, and status */}
                        <div className="flex items-center justify-between mb-2.5 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black shrink-0 ${
                              isQualified 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {rank}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 shrink-0">{item.groupLetter}조</span>
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-base shrink-0">{getCountryFlag(team.name)}</span>
                              <span className={`text-xs font-black truncate ${isKorea ? 'text-rose-700 underline decoration-rose-300' : 'text-slate-800'}`}>
                                {team.name}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isQualified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/10 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/15 whitespace-nowrap">
                                <Check className="w-2 h-2" /> 32강 진출
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-rose-500/10 text-rose-700 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/15 whitespace-nowrap">
                                탈락 대상
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dense Mobile Stats Grid */}
                        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 text-center font-mono animate-fade-in">
                          <div className="bg-slate-50/60 rounded py-1 px-1">
                            <div className="text-[8px] text-slate-400 font-sans leading-none mb-1">경기</div>
                            <div className="text-xs text-slate-700 font-extrabold">{team.played}</div>
                          </div>
                          <div className="bg-slate-50/60 rounded py-1 px-1">
                            <div className="text-[8px] text-slate-400 font-sans leading-none mb-1">승-무-패</div>
                            <div className="text-xs text-slate-700 font-bold">{team.won}-{team.drawn}-{team.lost}</div>
                          </div>
                          <div className="bg-slate-50/60 rounded py-1 px-1">
                            <div className="text-[8px] text-slate-400 font-sans leading-none mb-1">득/실 (득실차)</div>
                            <div className="text-xs text-slate-700 font-bold whitespace-nowrap">
                              {team.gf}/{team.ga} <span className={`text-[10px] font-black ${team.gd > 0 ? 'text-emerald-600' : team.gd < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                ({team.gd > 0 ? `+${team.gd}` : team.gd})
                              </span>
                            </div>
                          </div>
                          <div className="bg-amber-50/50 rounded py-1 px-1 border border-amber-100/30">
                            <div className="text-[8px] text-amber-700 font-sans font-bold leading-none mb-1">승점</div>
                            <div className="text-xs font-black text-amber-800">{team.points}점</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MATCHES SCHEDULES & SIMULATION TAB */}
        {false && (
          <div className="space-y-8 animate-fade-in" id="content-matches">
            {/* Simulation controls card */}
            <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white p-6 rounded-2xl border border-emerald-800 shadow-md">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-600/30 p-2.5 rounded-xl border border-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">임의 경기 결과 시뮬레이션 및 데이터 테스트</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    현재 한창 수집 중인 2026 월드컵 경기의 예상 스코어를 입력하거나 임의로 성적을 추가하여 본선 대진에 즉각 반영할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Central Matches list */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Live Matches Section */}
                <div className="space-y-3" id="live-matches-section">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">실시간 경기 중인 매치 (Live)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {data.matches.filter(m => m.status === 'Live').map(match => (
                      <div 
                        key={match.id}
                        className="bg-white rounded-xl border border-red-100 shadow-xs overflow-hidden hover:shadow-md transition"
                      >
                        <div className="bg-rose-50/50 px-4 py-2 border-b border-rose-100 flex items-center justify-between text-xs">
                          <span className="font-extrabold text-rose-700 uppercase tracking-widest">{match.stage} · {match.group ? `${match.group}조` : ''}</span>
                          <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse inline-flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Live {match.minute}
                          </span>
                        </div>

                        <div className="p-5 flex items-center justify-between">
                          <div className="flex-1 flex flex-col items-end pr-4 sm:pr-8">
                            <span className="text-2xl sm:text-3xl mb-1">{getCountryFlag(match.homeTeam)}</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm sm:text-base text-right">{match.homeTeam}</span>
                          </div>

                          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{match.homeScore ?? 0}</span>
                            <span className="text-slate-400 font-bold text-xs">VS</span>
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{match.awayScore ?? 0}</span>
                          </div>

                          <div className="flex-1 flex flex-col items-start pl-4 sm:pl-8">
                            <span className="text-2xl sm:text-3xl mb-1">{getCountryFlag(match.awayTeam)}</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm sm:text-base text-left">{match.awayTeam}</span>
                          </div>
                        </div>

                        {/* Interactive Prediction panel inside live cards */}
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                          <span>이 라이브 게임에 가상의 점수를 갱신해 승점 변화를 탐색해 보세요.</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              placeholder="홈" 
                              className="w-12 px-1.5 py-1 text-center border border-slate-200 rounded-md outline-none bg-white font-extrabold"
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                  const updated = { ...data };
                                  const m = updated.matches.find(item => item.id === match.id);
                                  if (m) m.homeScore = val;
                                  setData(updated);
                                }
                              }}
                            />
                            <span>:</span>
                            <input 
                              type="number" 
                              placeholder="어웨이" 
                              className="w-12 px-1.5 py-1 text-center border border-slate-200 rounded-md outline-none bg-white font-extrabold"
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                  const updated = { ...data };
                                  const m = updated.matches.find(item => item.id === match.id);
                                  if (m) m.awayScore = val;
                                  setData(updated);
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const updated = { ...data };
                                const m = updated.matches.find(item => item.id === match.id);
                                if (m) {
                                  m.status = 'Finished';
                                  m.minute = 'FT';
                                  
                                  // Auto recalculate group scores
                                  const groupLett = m.group;
                                  if (groupLett) {
                                    const grp = updated.groups.find(g => g.groupLetter === groupLett);
                                    if (grp) {
                                      const home = grp.teams.find(t => t.name === m.homeTeam);
                                      const away = grp.teams.find(t => t.name === m.awayTeam);
                                      if (home && away) {
                                        const hScore = m.homeScore ?? 0;
                                        const aScore = m.awayScore ?? 0;
                                        home.gf += hScore;
                                        home.ga += aScore;
                                        away.gf += aScore;
                                        away.ga += hScore;

                                        if (hScore > aScore) {
                                          home.won += 1;
                                          away.lost += 1;
                                        } else if (hScore < aScore) {
                                          away.won += 1;
                                          home.lost += 1;
                                        } else {
                                          home.drawn += 1;
                                          away.drawn += 1;
                                        }

                                        // Enforce absolute mathematical formulas to avoid discrepancy
                                        home.played = home.won + home.drawn + home.lost;
                                        home.gd = home.gf - home.ga;
                                        home.points = home.won * 3 + home.drawn;

                                        away.played = away.won + away.drawn + away.lost;
                                        away.gd = away.gf - away.ga;
                                        away.points = away.won * 3 + away.drawn;

                                        // re-rank teams
                                        grp.teams.sort((a,b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name, 'ko-KR'));
                                        grp.teams.forEach((t, i) => t.rank = i + 1);
                                      }
                                    }
                                  }
                                }
                                setData(updated);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-md cursor-pointer text-[10px]"
                            >
                              종료 확정
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Upcoming matches */}
                <div className="space-y-3" id="upcoming-matches-section">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <span>오늘과 다가오는 예정 경기 (Upcoming)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.matches.filter(m => m.status === 'Upcoming').map(match => (
                      <div key={match.id} className="bg-white rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50/50">
                        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2 mb-3">
                          <span className="font-bold">{match.stage} · {match.group ? `${match.group}조` : ''}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-slate-500 animate-pulse" /> {match.date} {match.time}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getCountryFlag(match.homeTeam)}</span>
                            <span className="font-bold text-slate-800 text-sm truncate max-w-[90px]">{match.homeTeam}</span>
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-[10px] font-semibold text-slate-500">
                            VS
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm truncate max-w-[90px] text-right">{match.awayTeam}</span>
                            <span className="text-2xl">{getCountryFlag(match.awayTeam)}</span>
                          </div>
                        </div>

                        {/* Interactive match starter */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">데이터 테스팅을 위해 원클릭 라이브 시작</span>
                          <button
                            onClick={() => {
                              const updated = { ...data };
                              const m = updated.matches.find(item => item.id === match.id);
                              if (m) {
                                m.status = 'Live';
                                m.minute = '1\'';
                                m.homeScore = 0;
                                m.awayScore = 0;
                              }
                              setData(updated);
                            }}
                            className="text-[10px] bg-slate-900 text-slate-100 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" /> 경기 시작
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Finished Matches */}
                <div className="space-y-3" id="finished-matches-section">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>이미 완료된 경기 결과 (Finished)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.matches.filter(m => m.status === 'Finished').map(match => (
                      <div key={match.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-3xs">
                        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                          <span className="font-semibold">{match.stage} · {match.group ? `${match.group}조` : ''}</span>
                          <span className="text-slate-400">{match.date} 종료</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span>{getCountryFlag(match.homeTeam)}</span>
                              <span className={`text-sm ${match.homeScore! > match.awayScore! ? 'font-black text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                {match.homeTeam}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>{getCountryFlag(match.awayTeam)}</span>
                              <span className={`text-sm ${match.awayScore! > match.homeScore! ? 'font-black text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                {match.awayTeam}
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg text-right font-black font-mono text-sm border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                            <div>{match.homeScore}</div>
                            <div>{match.awayScore}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Side Simulation Action Form */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-20">
                  <h3 className="text-base font-black text-slate-950 dark:text-slate-100 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                    <span>새로운 경기 수동 입력</span>
                  </h3>
                  
                  <p className="text-slate-500 text-xs mb-4">
                    공식적으로 검색되지 않은 평가전이나 사내 친선경기 등 2026 월드컵에 추가하고픈 임의 경기를 즉석에서 추가합니다.
                  </p>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const home = (form.elements.namedItem('homeTeam') as HTMLInputElement).value;
                    const away = (form.elements.namedItem('awayTeam') as HTMLInputElement).value;
                    const homeS = parseInt((form.elements.namedItem('homeScore') as HTMLInputElement).value || '0');
                    const awayS = parseInt((form.elements.namedItem('awayScore') as HTMLInputElement).value || '0');
                    const groupSel = (form.elements.namedItem('groupSelect') as HTMLSelectElement).value;

                    if (!home || !away) return;

                    const newMatch: Match = {
                      id: 'custom_' + Date.now(),
                      homeTeam: home,
                      awayTeam: away,
                      homeScore: homeS,
                      awayScore: awayS,
                      status: 'Finished',
                      minute: 'FT',
                      date: '6월 21일',
                      time: '수동 추가',
                      group: groupSel,
                      stage: 'Group Stage'
                    };

                    const updated = { ...data };
                    updated.matches = [newMatch, ...updated.matches];

                    // Recalculate group point logic
                    const grp = updated.groups.find(g => g.groupLetter === groupSel);
                    if (grp) {
                      const hTeam = grp.teams.find(t => t.name === home);
                      const aTeam = grp.teams.find(t => t.name === away);
                      if (hTeam && aTeam) {
                        hTeam.gf += homeS;
                        hTeam.ga += awayS;
                        aTeam.gf += awayS;
                        aTeam.ga += homeS;

                        if (homeS > awayS) {
                          hTeam.won += 1;
                          aTeam.lost += 1;
                        } else if (homeS < awayS) {
                          aTeam.won += 1;
                          hTeam.lost += 1;
                        } else {
                          hTeam.drawn += 1;
                          aTeam.drawn += 1;
                        }

                        // Enforce absolute mathematical formulas to avoid discrepancy
                        hTeam.played = hTeam.won + hTeam.drawn + hTeam.lost;
                        hTeam.gd = hTeam.gf - hTeam.ga;
                        hTeam.points = hTeam.won * 3 + hTeam.drawn;

                        aTeam.played = aTeam.won + aTeam.drawn + aTeam.lost;
                        aTeam.gd = aTeam.gf - aTeam.ga;
                        aTeam.points = aTeam.won * 3 + aTeam.drawn;
                      }

                      // Sort group teams based on rules (points, gd, gf, etc.)
                      grp.teams.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
                    }

                    setData(updated);
                    setApiNotification({
                      message: '새 경기의 득점 통계 및 순위정보가 시뮬레이션용으로 실시간 재조정 되었습니다.',
                      type: 'success'
                    });
                    form.reset();
                  }}>
                    {/* Select Group */}
                    <div className="mb-3.5">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">본선 조 선택 (A~L)</label>
                      <select name="groupSelect" defaultValue="A" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100">
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(g => (
                          <option key={g} value={g}>{g}조</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">홈팀 국가</label>
                        <input name="homeTeam" type="text" placeholder="예: 대한민국" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">어웨이팀 국가</label>
                        <input name="awayTeam" type="text" placeholder="예: 일본" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">홈 득점</label>
                        <input name="homeScore" type="number" min="0" defaultValue="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">어웨이 득점</label>
                        <input name="awayScore" type="number" min="0" defaultValue="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100" />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-lg text-xs tracking-wide cursor-pointer transition"
                    >
                      경기 완료 반영하기
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* BRACKET TAB - FULL DYNAMIC VISUALIZATION */}
        {activeTab === 'bracket' && (
          <div className="space-y-4 animate-fade-in" id="content-bracket">
            {/* Guide strip */}
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-3xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>2026 북중미 월드컵 토너먼트 본선 실시간 대진표 (32강~결승)</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">

                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button 
                  onClick={() => {
                    const updated = { ...data };
                    updated.bracket = {
                      roundOf32: [
                        { id: 'r32_1', stage: 'RoundOf32' as const, matchNumber: 1, homeTeam: 'A조 2위', awayTeam: 'B조 2위', date: '6월 29일', time: '04:00', nextMatchId: 'r16_1', winner: undefined },
                        { id: 'r32_2', stage: 'RoundOf32' as const, matchNumber: 2, homeTeam: 'B조 1위', awayTeam: 'EFGIJ조 3위', date: '7월 3일', time: '12:00', nextMatchId: 'r16_1', winner: undefined },
                        { id: 'r32_3', stage: 'RoundOf32' as const, matchNumber: 3, homeTeam: 'E조 1위', awayTeam: 'ABCDF조 3위', date: '6월 30일', time: '05:30', nextMatchId: 'r16_2', winner: undefined },
                        { id: 'r32_4', stage: 'RoundOf32' as const, matchNumber: 4, homeTeam: 'I조 1위', awayTeam: 'CDFGH조 3위', date: '7월 1일', time: '06:00', nextMatchId: 'r16_2', winner: undefined },
                        { id: 'r32_5', stage: 'RoundOf32' as const, matchNumber: 5, homeTeam: 'K조 2위', awayTeam: 'L조 2위', date: '7월 3일', time: '08:00', nextMatchId: 'r16_3', winner: undefined },
                        { id: 'r32_6', stage: 'RoundOf32' as const, matchNumber: 6, homeTeam: 'H조 1위', awayTeam: 'J조 2위', date: '7월 3일', time: '04:00', nextMatchId: 'r16_3', winner: undefined },
                        { id: 'r32_7', stage: 'RoundOf32' as const, matchNumber: 7, homeTeam: 'D조 1위', awayTeam: 'BEFIJ조 3위', date: '7월 2일', time: '09:00', nextMatchId: 'r16_4', winner: undefined },
                        { id: 'r32_8', stage: 'RoundOf32' as const, matchNumber: 8, homeTeam: 'G조 1위', awayTeam: 'AEHIJ조 3위', date: '7월 2일', time: '05:00', nextMatchId: 'r16_4', winner: undefined },
                        { id: 'r32_9', stage: 'RoundOf32' as const, matchNumber: 9, homeTeam: 'C조 1위', awayTeam: 'F조 2위', date: '6월 30일', time: '02:00', nextMatchId: 'r16_5', winner: undefined },
                        { id: 'r32_10', stage: 'RoundOf32' as const, matchNumber: 10, homeTeam: 'E조 2위', awayTeam: 'I조 2위', date: '7월 1일', time: '02:00', nextMatchId: 'r16_5', winner: undefined },
                        { id: 'r32_11', stage: 'RoundOf32' as const, matchNumber: 11, homeTeam: 'A조 1위', awayTeam: 'CEFHI조 3위', date: '7월 1일', time: '10:00', nextMatchId: 'r16_6', winner: undefined },
                        { id: 'r32_12', stage: 'RoundOf32' as const, matchNumber: 12, homeTeam: 'L조 1위', awayTeam: 'EHIJK조 3위', date: '7월 2일', time: '01:00', nextMatchId: 'r16_6', winner: undefined },
                        { id: 'r32_13', stage: 'RoundOf32' as const, matchNumber: 13, homeTeam: 'J조 1위', awayTeam: 'H조 2위', date: '7월 4일', time: '07:00', nextMatchId: 'r16_7', winner: undefined },
                        { id: 'r32_14', stage: 'RoundOf32' as const, matchNumber: 14, homeTeam: 'D조 2위', awayTeam: 'G조 2위', date: '7월 4일', time: '03:00', nextMatchId: 'r16_7', winner: undefined },
                        { id: 'r32_15', stage: 'RoundOf32' as const, matchNumber: 15, homeTeam: 'K조 1위', awayTeam: 'DEIJL조 3위', date: '7월 4일', time: '10:30', nextMatchId: 'r16_8', winner: undefined },
                        { id: 'r32_16', stage: 'RoundOf32' as const, matchNumber: 16, homeTeam: 'F조 1위', awayTeam: 'C조 2위', date: '6월 30일', time: '10:00', nextMatchId: 'r16_8', winner: undefined }
                      ],
                      roundOf16: Array.from({ length: 8 }, (_, idx) => ({
                        id: `r16_${idx + 1}`,
                        stage: 'RoundOf16' as const,
                        matchNumber: idx + 1,
                        homeTeam: `32강 ${idx * 2 + 1}경기 승자`,
                        awayTeam: `32강 ${idx * 2 + 2}경기 승자`,
                        date: `7월 ${6 + Math.floor(idx / 2)}일`,
                        time: idx % 2 === 0 ? '04:00' : '08:00',
                        nextMatchId: `qf_${Math.floor(idx / 2) + 1}`,
                        winner: undefined
                      })),
                      quarterFinals: Array.from({ length: 4 }, (_, idx) => ({
                        id: `qf_${idx + 1}`,
                        stage: 'QuarterFinals' as const,
                        matchNumber: idx + 1,
                        homeTeam: `16강 ${idx * 2 + 1}경기 승자`,
                        awayTeam: `16강 ${idx * 2 + 2}경기 승자`,
                        date: `7월 ${11 + Math.floor(idx / 2)}일`,
                        time: idx % 2 === 0 ? '04:00' : '08:00',
                        nextMatchId: `sf_${Math.floor(idx / 2) + 1}`,
                        winner: undefined
                      })),
                      semiFinals: Array.from({ length: 2 }, (_, idx) => ({
                        id: `sf_${idx + 1}`,
                        stage: 'SemiFinals' as const,
                        matchNumber: idx + 1,
                        homeTeam: `준준결승 ${idx * 2 + 1}경기 승자`,
                        awayTeam: `준준결승 ${idx * 2 + 2}경기 승자`,
                        date: `7월 ${15 + idx}일`,
                        time: '08:00',
                        nextMatchId: 'fn_1',
                        winner: undefined
                      })),
                      final: [
                        {
                          id: 'fn_1',
                          stage: 'Final' as const,
                          matchNumber: 1,
                          homeTeam: '준결승 1경기 승자',
                          awayTeam: '준결승 2경기 승자',
                          date: '7월 20일',
                          time: '04:00',
                          winner: undefined
                        }
                      ]
                    };
                    setData(updated);
                    setApiNotification({
                      message: '대진표가 초기 공백 템플릿 상태(A조 1위 등)로 완전히 초기화되었습니다.',
                      type: 'success'
                    });
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-50 transition cursor-pointer shrink-0"
                >
                  기본 템플릿(비우기) 초기화
                </button>

                <button 
                  onClick={() => {
                    // Fill bracket seeded from current top team standings
                    const updated = { ...data };
                    
                    // Map matches precisely based on their original placeholders: e.g. 'A조 1위' vs 'C조 3위'
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

                    // 1. Get the 8 qualified 3rd place teams
                    const bestThirds = getThirdPlaceStandings(data.groups).slice(0, 8);
                    
                    // Wildcard Slot Preferred Group Letters
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

                    // Map wildcard slots to qualified teams
                    // Group 3rd-place teams are placed in their preferred slots first.
                    // Remaining slots are filled by other qualified teams whose preferred slot did not qualify or are from groups without slots.
                    const slotMapping: Record<string, string> = {};
                    const assignedTeamNames = new Set<string>();

                    // First Pass: Assign preferred slots
                    wildcardPlaceholders.forEach(placeholder => {
                      const preferredGroup = placeholder.charAt(0);
                      const matchingTeam = bestThirds.find(bt => bt.groupLetter === preferredGroup);
                      if (matchingTeam) {
                        slotMapping[placeholder] = matchingTeam.team.name;
                        assignedTeamNames.add(matchingTeam.team.name);
                      }
                    });

                    // Second Pass: Fill empty slots with remaining qualified 3rd-place teams
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
                        
                        // Fallback group 3위
                        const groupLetter = placeholder.charAt(0);
                        const group = data.groups.find(g => g.groupLetter === groupLetter);
                        if (group && group.teams[2]) {
                          return group.teams[2].name;
                        }
                        return placeholder;
                      }

                      const matchResult = placeholder.match(/([A-L])조\s*(\d)위/);
                      if (!matchResult) return placeholder;
                      const groupLetter = matchResult[1];
                      const rank = parseInt(matchResult[2], 10);
                      
                      const group = data.groups.find(g => g.groupLetter === groupLetter);
                      if (group && group.teams[rank - 1]) {
                        return group.teams[rank - 1].name;
                      }
                      return placeholder;
                    };

                    // Assign actual teams based on correct seed locations
                    updated.bracket.roundOf32 = updated.bracket.roundOf32.map((match) => {
                      const original = originalPlaceholders[match.matchNumber];
                      if (!original) return match;
                      return {
                        ...match,
                        homeTeam: resolvePlaceholder(original.home),
                        awayTeam: resolvePlaceholder(original.away),
                        winner: undefined
                      };
                    });

                    // Wipe subsequent rounds for fresh play
                    updated.bracket.roundOf16 = updated.bracket.roundOf16.map(m => ({ ...m, homeTeam: undefined, awayTeam: undefined, winner: undefined }));
                    updated.bracket.quarterFinals = updated.bracket.quarterFinals.map(m => ({ ...m, homeTeam: undefined, awayTeam: undefined, winner: undefined }));
                    updated.bracket.semiFinals = updated.bracket.semiFinals.map(m => ({ ...m, homeTeam: undefined, awayTeam: undefined, winner: undefined }));
                    updated.bracket.final = updated.bracket.final.map(m => ({ ...m, homeTeam: undefined, awayTeam: undefined, winner: undefined }));

                    setData(updated);
                    setApiNotification({
                      message: '현재 12개 조별 예선의 실시간 순위를 기반으로 정확하게 시드가 배정되었습니다!',
                      type: 'success'
                    });
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition cursor-pointer shrink-0"
                >
                  실시간 순위 기반 대진 전개
                </button>
              </div>
            </div>

            {/* 뷰 모드 탭 컨트롤 (스마트 목록 및 트리 맵) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">보기 모드 선택:</span>
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700" id="bracket-view-tabs">
                  <button
                    onClick={() => setBracketViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bracketViewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-400 shadow-xs ring-1 ring-black/5'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>스마트 목록 뷰</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 rounded-sm py-0.2 shrink-0 md:inline hidden ml-1">추천</span>
                  </button>
                  <button
                    onClick={() => setBracketViewMode('tree')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bracketViewMode === 'tree'
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-400 shadow-xs ring-1 ring-black/5'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>전체 트리 맵</span>
                  </button>
                </div>
              </div>

              {bracketViewMode === 'list' ? (
                <div className="text-slate-500 text-[11px] font-medium">
                  💡 모바일/태블릿 맞춤 뷰: 경기 카드에서 <strong className="text-emerald-700 dark:text-emerald-400">진출국을 선택</strong>하면 다음 라운드 대진으로 자동 전송됩니다.
                </div>
              ) : (
                <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                  <span className="animate-pulse">↔️</span>
                  <span><strong>가로 스크롤 및 스와이프</strong>를 활용해 양방향 대칭 트리 맵의 승리 흐름을 한눈에 보세요.</span>
                </div>
              )}
            </div>

            {/* 1. 스마트 목록 뷰 */}
            {bracketViewMode === 'list' && (
              <div className="space-y-4 animate-fade-in" id="bracket-list-view">
                {/* 라운드 선택 슬라이더 */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50 justify-between items-center gap-1 shadow-3xs overflow-x-auto scrollbar-none">
                  {[
                    { key: 'roundOf32', label: '32강 대진' },
                    { key: 'roundOf16', label: '16강 대진' },
                    { key: 'quarterFinals', label: '8강 대진' },
                    { key: 'semiFinals', label: '준결승(4강)' },
                    { key: 'final', label: '월드컵 결승' }
                  ].map((round) => (
                    <button
                      key={round.key}
                      onClick={() => setSelectedBracketRound(round.key as any)}
                      className={`flex-1 min-w-[70px] text-[11px] sm:text-xs font-black text-center py-2.5 px-1.5 whitespace-nowrap rounded-lg transition-all cursor-pointer ${
                        selectedBracketRound === round.key
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      {round.label}
                    </button>
                  ))}
                </div>

                {/* 선택된 라운드의 매치 카드 목록 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {selectedBracketRound === 'roundOf32' && data.bracket.roundOf32.map(match => (
                    <div key={match.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs space-y-2 hover:border-emerald-400 transition relative">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] text-slate-500 font-mono font-bold">매치 #{match.matchNumber}</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">{match.date} {match.time}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        {/* Home */}
                        <div 
                          onClick={() => match.homeTeam && handleBracketMatchWinner('roundOf32', match.id, match.homeTeam)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border border-transparent select-none min-h-[44px] ${
                            match.winner === match.homeTeam 
                              ? 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-200' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                            <span className="truncate text-xs font-medium">{match.homeTeam || '미정'}</span>
                          </span>
                          {match.winner === match.homeTeam ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">선택</span>
                          )}
                        </div>

                        {/* Away */}
                        <div 
                          onClick={() => match.awayTeam && handleBracketMatchWinner('roundOf32', match.id, match.awayTeam)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border border-transparent select-none min-h-[44px] ${
                            match.winner === match.awayTeam 
                              ? 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-200' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                            <span className="truncate text-xs font-medium">{match.awayTeam || '미정'}</span>
                          </span>
                          {match.winner === match.awayTeam ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">선택</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedBracketRound === 'roundOf16' && data.bracket.roundOf16.map(match => (
                    <div key={match.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs space-y-2 hover:border-emerald-400 transition relative">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] text-slate-500 font-mono font-bold">매치 #{match.matchNumber}</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">{match.date} {match.time}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        {/* Home */}
                        <div 
                          onClick={() => match.homeTeam && handleBracketMatchWinner('roundOf16', match.id, match.homeTeam)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border border-transparent select-none min-h-[44px] ${
                            match.winner === match.homeTeam 
                              ? 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-200' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                            <span className="truncate text-xs font-medium">{match.homeTeam || '32강 승자'}</span>
                          </span>
                          {match.winner === match.homeTeam ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">선택</span>
                          )}
                        </div>

                        {/* Away */}
                        <div 
                          onClick={() => match.awayTeam && handleBracketMatchWinner('roundOf16', match.id, match.awayTeam)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border border-transparent select-none min-h-[44px] ${
                            match.winner === match.awayTeam 
                              ? 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-200' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                            <span className="truncate text-xs font-medium">{match.awayTeam || '32강 승자'}</span>
                          </span>
                          {match.winner === match.awayTeam ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">선택</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedBracketRound === 'quarterFinals' && data.bracket.quarterFinals.map(match => (
                    <div key={match.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs space-y-2 hover:border-emerald-400 transition relative">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] text-slate-500 font-mono font-bold">매치 #{match.matchNumber}</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">{match.date} {match.time}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        {/* Home */}
                        <div 
                          onClick={() => match.homeTeam && handleBracketMatchWinner('quarterFinals', match.id, match.homeTeam)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border border-transparent select-none min-h-[44px] ${
                            match.winner === match.homeTeam 
                              ? 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-200' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                            <span className="truncate text-xs font-medium">{match.homeTeam || '16강 승자'}</span>
                          </span>
                          {match.winner === match.homeTeam ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">선택</span>
                          )}
                        </div>

                        {/* Away */}
                        <div 
                          onClick={() => match.awayTeam && handleBracketMatchWinner('quarterFinals', match.id, match.awayTeam)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border border-transparent select-none min-h-[44px] ${
                            match.winner === match.awayTeam 
                              ? 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-200' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                            <span className="truncate text-xs font-medium">{match.awayTeam || '16강 승자'}</span>
                          </span>
                          {match.winner === match.awayTeam ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">선택</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedBracketRound === 'semiFinals' && data.bracket.semiFinals.map(match => (
                    <div key={match.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs space-y-2 hover:border-emerald-400 transition relative">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] text-slate-500 font-mono font-bold">매치 #{match.matchNumber}</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">{match.date} {match.time}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        {/* Home */}
                        <div 
                          onClick={() => match.homeTeam && handleBracketMatchWinner('semiFinals', match.id, match.homeTeam)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition border border-transparent select-none min-h-[44px] ${
                            match.winner === match.homeTeam 
                              ? 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-200' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-md shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                            <span className="truncate text-xs font-bold">{match.homeTeam || '8강 승자'}</span>
                          </span>
                          {match.winner === match.homeTeam ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">선택</span>
                          )}
                        </div>

                        {/* Away */}
                        <div 
                          onClick={() => match.awayTeam && handleBracketMatchWinner('semiFinals', match.id, match.awayTeam)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition border border-transparent select-none min-h-[44px] ${
                            match.winner === match.awayTeam 
                              ? 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-200' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-md shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                            <span className="truncate text-xs font-bold">{match.awayTeam || '8강 승자'}</span>
                          </span>
                          {match.winner === match.awayTeam ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">선택</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedBracketRound === 'final' && data.bracket.final.map(match => (
                    <div key={match.id} className="col-span-full max-w-md mx-auto bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4 hover:border-amber-400 transition relative w-full">
                      <div className="text-xs text-amber-800 font-black tracking-wider uppercase text-center flex items-center justify-center gap-1.5 border-b border-amber-200/60 pb-2.5">
                        <Trophy className="w-4 h-4 text-amber-600 animate-bounce" />
                        <span>Grand Final (월드컵 결승전)</span>
                        <Trophy className="w-4 h-4 text-amber-600 animate-bounce" />
                      </div>

                      <div className="space-y-2">
                        {/* Home Finalist */}
                        <div 
                          onClick={() => match.homeTeam && handleBracketMatchWinner('final', match.id, match.homeTeam)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border select-none min-h-[48px] ${
                            match.winner === match.homeTeam 
                              ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-xs' 
                              : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-lg shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                            <span className="truncate text-sm font-bold">{match.homeTeam || '준결승 승자1'}</span>
                          </span>
                          {match.winner === match.homeTeam ? (
                            <Award className="w-5 h-5 text-amber-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold shrink-0 bg-slate-100 px-2 py-0.5 rounded">터치 후 우승!</span>
                          )}
                        </div>

                        {/* Away Finalist */}
                        <div 
                          onClick={() => match.awayTeam && handleBracketMatchWinner('final', match.id, match.awayTeam)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border select-none min-h-[48px] ${
                            match.winner === match.awayTeam 
                              ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-xs' 
                              : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-lg shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                            <span className="truncate text-sm font-bold">{match.awayTeam || '준결승 승자2'}</span>
                          </span>
                          {match.winner === match.awayTeam ? (
                            <Award className="w-5 h-5 text-amber-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold shrink-0 bg-slate-100 px-2 py-0.5 rounded">터치 후 우승!</span>
                          )}
                        </div>
                      </div>

                      {match.winner && (
                        <div className="bg-amber-500 text-white p-3 rounded-xl text-center text-xs font-black tracking-widest shadow-md animate-pulse flex items-center justify-center gap-2">
                          🏆 {getCountryFlag(match.winner)} {match.winner} 우승 달성! 🏆
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 전체 트리 맵 뷰 */}
            {bracketViewMode === 'tree' && (
              <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-3 overflow-x-auto scrollbar-thin select-none touch-pan-x" id="tree-container">
                <div className="min-w-[1250px] space-y-2">
                  {/* Header Titles Row */}
                  <div className="grid grid-cols-9 gap-1 text-[9px] text-slate-500 font-bold text-center uppercase tracking-wider mb-2 border-b border-slate-200/50 pb-1.5">
                    <div>32강전 (A)</div>
                    <div>16강전 (A)</div>
                    <div>8강전 (A)</div>
                    <div>준결승 (A)</div>
                    <div className="text-amber-600 font-black">월드컵 결승전</div>
                    <div>준결승 (B)</div>
                    <div>8강전 (B)</div>
                    <div>16강전 (B)</div>
                    <div>32강전 (B)</div>
                  </div>

                  {/* The Bracket Symmetrical Grid */}
                  <div className="grid grid-cols-9 gap-1 h-[500px] items-stretch" id="symmetrical-bracket">
                    
                    {/* 1. Left Round of 32 (Matches 1 to 8) */}
                    <div className="flex flex-col justify-around h-full gap-0.5">
                      {data.bracket.roundOf32.slice(0, 8).map(match => (
                        <div key={match.id} className="bg-white border border-slate-200 rounded-lg p-1 shadow-3xs text-[10px] space-y-0.5 hover:border-emerald-400 transition relative">
                          <span className="text-[7px] text-slate-400 font-mono absolute right-1 top-[1px]">#{match.matchNumber}</span>
                          {/* Home */}
                          <div 
                            onClick={() => match.homeTeam && handleBracketMatchWinner('roundOf32', match.id, match.homeTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.homeTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                              <span className="truncate font-medium">{match.homeTeam || '미정'}</span>
                            </span>
                            {match.winner === match.homeTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                          {/* Away */}
                          <div 
                            onClick={() => match.awayTeam && handleBracketMatchWinner('roundOf32', match.id, match.awayTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.awayTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                              <span className="truncate font-medium">{match.awayTeam || '미정'}</span>
                            </span>
                            {match.winner === match.awayTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 2. Left Round of 16 (Matches 1 to 4) */}
                    <div className="flex flex-col justify-around h-full gap-0.5">
                      {data.bracket.roundOf16.slice(0, 4).map(match => (
                        <div key={match.id} className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-3xs text-[10px] space-y-0.5 hover:border-emerald-400 transition relative">
                          <span className="text-[7px] text-slate-400 font-mono absolute right-1 top-[1px]">#{match.matchNumber}</span>
                          {/* Home */}
                          <div 
                            onClick={() => match.homeTeam && handleBracketMatchWinner('roundOf16', match.id, match.homeTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.homeTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                              <span className="truncate font-medium">{match.homeTeam || '32강 승자'}</span>
                            </span>
                            {match.winner === match.homeTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                          {/* Away */}
                          <div 
                            onClick={() => match.awayTeam && handleBracketMatchWinner('roundOf16', match.id, match.awayTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.awayTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                              <span className="truncate font-medium">{match.awayTeam || '32강 승자'}</span>
                            </span>
                            {match.winner === match.awayTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 3. Left Quarter Finals (Matches 1 to 2) */}
                    <div className="flex flex-col justify-around h-full gap-0.5">
                      {data.bracket.quarterFinals.slice(0, 2).map(match => (
                        <div key={match.id} className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-3xs text-[10px] space-y-0.5 hover:border-emerald-400 transition relative">
                          <span className="text-[7px] text-slate-400 font-mono absolute right-1 top-[1px]">#{match.matchNumber}</span>
                          {/* Home */}
                          <div 
                            onClick={() => match.homeTeam && handleBracketMatchWinner('quarterFinals', match.id, match.homeTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.homeTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                              <span className="truncate font-medium">{match.homeTeam || '16강 승자'}</span>
                            </span>
                            {match.winner === match.homeTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                          {/* Away */}
                          <div 
                            onClick={() => match.awayTeam && handleBracketMatchWinner('quarterFinals', match.id, match.awayTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.awayTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                              <span className="truncate font-medium">{match.awayTeam || '16강 승자'}</span>
                            </span>
                            {match.winner === match.awayTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 4. Left Semi Finals (Match 1) */}
                    <div className="flex flex-col justify-around h-full gap-0.5">
                      {data.bracket.semiFinals.slice(0, 1).map(match => (
                        <div key={match.id} className="bg-white border border-emerald-100 rounded-lg p-2 shadow-2xs text-[10px] space-y-1 hover:border-emerald-400 transition relative">
                          <span className="text-[7.5px] text-emerald-600 font-bold absolute right-1.5 top-0.5">준결승 #1</span>
                          {/* Home */}
                          <div 
                            onClick={() => match.homeTeam && handleBracketMatchWinner('semiFinals', match.id, match.homeTeam)}
                            className={`flex items-center justify-between p-1 rounded cursor-pointer transition select-none ${
                              match.winner === match.homeTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-[12px] shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                              <span className="truncate font-semibold">{match.homeTeam || '8강 승자'}</span>
                            </span>
                            {match.winner === match.homeTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                          {/* Away */}
                          <div 
                            onClick={() => match.awayTeam && handleBracketMatchWinner('semiFinals', match.id, match.awayTeam)}
                            className={`flex items-center justify-between p-1 rounded cursor-pointer transition select-none ${
                              match.winner === match.awayTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-[12px] shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                              <span className="truncate font-semibold">{match.awayTeam || '8강 승자'}</span>
                            </span>
                            {match.winner === match.awayTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 5. Center Grand Final (Perfect Vertical Middle alignment) */}
                    <div className="flex flex-col justify-center items-center h-full">
                      {data.bracket.final.map(match => (
                        <div key={match.id} className="w-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-300 rounded-xl p-2.5 shadow-sm space-y-2 text-[10px] hover:border-amber-400 transition relative animate-fade-in">
                          <div className="text-[8px] text-amber-800 font-black tracking-wider uppercase text-center flex items-center justify-center gap-0.5">
                            <Trophy className="w-3 h-3 text-amber-500" />
                            <span>Grand Final</span>
                          </div>

                          <div className="space-y-1">
                            {/* Home Finalist */}
                            <div 
                              onClick={() => match.homeTeam && handleBracketMatchWinner('final', match.id, match.homeTeam)}
                              className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition border select-none ${
                                match.winner === match.homeTeam 
                                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-black' 
                                  : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-1 min-w-0 flex-1">
                                <span className="text-sm shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                                <span className="truncate font-bold">{match.homeTeam || '준결승 승자1'}</span>
                              </span>
                              {match.winner === match.homeTeam ? (
                                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <span className="text-[7.5px] text-slate-400 font-semibold shrink-0">선택</span>
                              )}
                            </div>

                            {/* Away Finalist */}
                            <div 
                              onClick={() => match.awayTeam && handleBracketMatchWinner('final', match.id, match.awayTeam)}
                              className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition border select-none ${
                                match.winner === match.awayTeam 
                                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-black' 
                                  : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-1 min-w-0 flex-1">
                                <span className="text-sm shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                                <span className="truncate font-bold">{match.awayTeam || '준결승 승자2'}</span>
                              </span>
                              {match.winner === match.awayTeam ? (
                                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <span className="text-[7.5px] text-slate-400 font-semibold shrink-0">선택</span>
                              )}
                            </div>
                          </div>

                          {match.winner && (
                            <div className="bg-amber-500 text-white py-1 px-1.5 rounded-md text-center text-[9px] font-black tracking-wide shadow-sm animate-bounce">
                              🏆 {getCountryFlag(match.winner)} {match.winner} 우승!
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 6. Right Semi Finals (Match 2) */}
                    <div className="flex flex-col justify-around h-full gap-0.5">
                      {data.bracket.semiFinals.slice(1, 2).map(match => (
                        <div key={match.id} className="bg-white border border-emerald-100 rounded-lg p-2 shadow-2xs text-[10px] space-y-1 hover:border-emerald-400 transition relative">
                          <span className="text-[7.5px] text-emerald-600 font-bold absolute right-1.5 top-0.5">준결승 #2</span>
                          {/* Home */}
                          <div 
                            onClick={() => match.homeTeam && handleBracketMatchWinner('semiFinals', match.id, match.homeTeam)}
                            className={`flex items-center justify-between p-1 rounded cursor-pointer transition select-none ${
                              match.winner === match.homeTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-[12px] shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                              <span className="truncate font-semibold">{match.homeTeam || '8강 승자'}</span>
                            </span>
                            {match.winner === match.homeTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                          {/* Away */}
                          <div 
                            onClick={() => match.awayTeam && handleBracketMatchWinner('semiFinals', match.id, match.awayTeam)}
                            className={`flex items-center justify-between p-1 rounded cursor-pointer transition select-none ${
                              match.winner === match.awayTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-[12px] shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                              <span className="truncate font-semibold">{match.awayTeam || '8강 승자'}</span>
                            </span>
                            {match.winner === match.awayTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 7. Right Quarter Finals (Matches 3 to 4) */}
                    <div className="flex flex-col justify-around h-full gap-0.5">
                      {data.bracket.quarterFinals.slice(2, 4).map(match => (
                        <div key={match.id} className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-3xs text-[10px] space-y-0.5 hover:border-emerald-400 transition relative">
                          <span className="text-[7px] text-slate-400 font-mono absolute right-1 top-[1px]">#{match.matchNumber}</span>
                          {/* Home */}
                          <div 
                            onClick={() => match.homeTeam && handleBracketMatchWinner('quarterFinals', match.id, match.homeTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.homeTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                              <span className="truncate font-medium">{match.homeTeam || '16강 승자'}</span>
                            </span>
                            {match.winner === match.homeTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                          {/* Away */}
                          <div 
                            onClick={() => match.awayTeam && handleBracketMatchWinner('quarterFinals', match.id, match.awayTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.awayTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                              <span className="truncate font-medium">{match.awayTeam || '16강 승자'}</span>
                            </span>
                            {match.winner === match.awayTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 8. Right Round of 16 (Matches 5 to 8) */}
                    <div className="flex flex-col justify-around h-full gap-0.5">
                      {data.bracket.roundOf16.slice(4, 8).map(match => (
                        <div key={match.id} className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-3xs text-[10px] space-y-0.5 hover:border-emerald-400 transition relative">
                          <span className="text-[7px] text-slate-400 font-mono absolute right-1 top-[1px]">#{match.matchNumber}</span>
                          {/* Home */}
                          <div 
                            onClick={() => match.homeTeam && handleBracketMatchWinner('roundOf16', match.id, match.homeTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.homeTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                              <span className="truncate font-medium">{match.homeTeam || '32강 승자'}</span>
                            </span>
                            {match.winner === match.homeTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                          {/* Away */}
                          <div 
                            onClick={() => match.awayTeam && handleBracketMatchWinner('roundOf16', match.id, match.awayTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.awayTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                              <span className="truncate font-medium">{match.awayTeam || '32강 승자'}</span>
                            </span>
                            {match.winner === match.awayTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 9. Right Round of 32 (Matches 9 to 16) */}
                    <div className="flex flex-col justify-around h-full gap-0.5">
                      {data.bracket.roundOf32.slice(8, 16).map(match => (
                        <div key={match.id} className="bg-white border border-slate-200 rounded-lg p-1 shadow-3xs text-[10px] space-y-0.5 hover:border-emerald-400 transition relative">
                          <span className="text-[7px] text-slate-400 font-mono absolute right-1 top-[1px]">#{match.matchNumber}</span>
                          {/* Home */}
                          <div 
                            onClick={() => match.homeTeam && handleBracketMatchWinner('roundOf32', match.id, match.homeTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.homeTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.homeTeam || '')}</span>
                              <span className="truncate font-medium">{match.homeTeam || '미정'}</span>
                            </span>
                            {match.winner === match.homeTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                          {/* Away */}
                          <div 
                            onClick={() => match.awayTeam && handleBracketMatchWinner('roundOf32', match.id, match.awayTeam)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                              match.winner === match.awayTeam 
                                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 flex-1">
                              <span className="text-xs shrink-0">{getCountryFlag(match.awayTeam || '')}</span>
                              <span className="truncate font-medium">{match.awayTeam || '미정'}</span>
                            </span>
                            {match.winner === match.awayTeam && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}



      </main>

      {/* Modern High-contrast Footer with explicit declaration */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 mt-20 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white tracking-widest uppercase">2026 FIFA World Cup</span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                실시간 데이터 통합망
              </span>
            </div>
            <p>본 서비스는 2026 FIFA World Cup 북중미 본선의 최신 정보와 토너먼트 결과를 실시간으로 중계합니다.</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">© 2026 World Cup Bracket Live Hub. Powered by Official FIFA Match Feed APIs & Fallback Simulator.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
