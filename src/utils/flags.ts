export function getCountryFlag(countryName: string): string {
  if (!countryName) return '🏳️';
  
  const flags: Record<string, string> = {
    // A
    "멕시코": "🇲🇽", "Mexico": "🇲🇽",
    "에콰도르": "🇪🇨", "Ecuador": "🇪🇨",
    "크로아티아": "🇭🇷", "Croatia": "🇭🇷",
    "뉴질랜드": "🇳🇿", "New Zealand": "🇳🇿",
    // B
    "폴란드": "🇵🇱", "Poland": "🇵🇱",
    "대한민국": "🇰🇷", "South Korea": "🇰🇷", "Korea": "🇰🇷", "Korea Republic": "🇰🇷",
    "캐나다": "🇨🇦", "Canada": "🇨🇦",
    "코트디부아르": "🇨🇮", "Ivory Coast": "🇨🇮", "Cote d'Ivoire": "🇨🇮",
    // C
    "미국": "🇺🇸", "USA": "🇺🇸", "United States": "🇺🇸",
    "스웨덴": "🇸🇪", "Sweden": "🇸🇪",
    "세네갈": "🇸🇳", "Senegal": "🇸🇳",
    "칠레": "🇨🇱", "Chile": "🇨🇱",
    // D
    "아르헨티나": "🇦🇷", "Argentina": "🇦🇷",
    "우크라이나": "🇺🇦", "Ukraine": "🇺🇦",
    "카메룬": "🇨🇲", "Cameroon": "🇨🇲",
    "이란": "🇮🇷", "Iran": "🇮🇷",
    // E
    "브라질": "🇧🇷", "Brazil": "🇧🇷",
    "터키": "🇹🇷", "Turkey": "🇹🇷", "튀르키예": "🇹🇷",
    "알제리": "🇩🇿", "Algeria": "🇩🇿",
    "요르단": "🇯🇴", "Jordan": "🇯🇴",
    // F
    "프랑스": "🇫🇷", "France": "🇫🇷",
    "콜롬비아": "🇨🇴", "Colombia": "🇨🇴",
    "일본": "🇯🇵", "Japan": "🇯🇵",
    "루마니아": "🇷🇴", "Romania": "🇷🇴",
    // G
    "스페인": "🇪🇸", "Spain": "🇪🇸",
    "덴마크": "🇩🇰", "Denmark": "🇩🇰",
    "사우디아라비아": "🇸🇦", "Saudi Arabia": "🇸🇦", "사우디": "🇸🇦",
    "말리": "🇲🇱", "Mali": "🇲🇱",
    // H
    "영국": "🇬🇧", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "잉글랜드": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "우루과이": "🇺🇾", "Uruguay": "🇺🇾",
    "노르웨이": "🇳🇴", "Norway": "🇳🇴",
    "이집트": "🇪🇬", "Egypt": "🇪🇬",
    // I
    "포르투갈": "🇵🇹", "Portugal": "🇵🇹",
    "스위스": "🇨🇭", "Switzerland": "🇨🇭",
    "나이지리아": "🇳🇬", "Nigeria": "🇳🇬",
    "우즈베키스탄": "🇺🇿", "Uzbekistan": "🇺🇿",
    // J
    "이탈리아": "🇮🇹", "Italy": "🇮🇹",
    "모로코": "🇲🇦", "Morocco": "🇲🇦",
    "호주": "🇦🇺", "Australia": "🇦🇺",
    "자메이카": "🇯🇲", "Jamaica": "🇯🇲",
    // K
    "벨기에": "🇧🇪", "Belgium": "🇧🇪",
    "독일": "🇩🇪", "Germany": "🇩🇪",
    "페루": "🇵🇪", "Peru": "🇵🇪",
    "파나마": "🇵🇦", "Panama": "🇵🇦",
    // L
    "네덜란드": "🇳🇱", "Netherlands": "🇳🇱",
    "오스트리아": "🇦🇹", "Austria": "🇦🇹",
    "남아공": "🇿🇦", "South Africa": "🇿🇦", "남아프리카 공화국": "🇿🇦", "남아프리카공화국": "🇿🇦",
    "이라크": "🇮🇶", "Iraq": "🇮🇶",
    
    // Additional 2026 Teams
    "보스니아 헤르체고비나": "🇧🇦", "보스니아": "🇧🇦", "Bosnia and Herzegovina": "🇧🇦", "Bosnia": "🇧🇦",
    "카타르": "🇶🇦", "Qatar": "🇶🇦",
    "아이티": "🇭🇹", "Haiti": "🇭🇹",
    "스코틀랜드": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "파라과이": "🇵🇾", "Paraguay": "🇵🇾",
    "퀴라소": "🇨🇼", "Curaçao": "🇨🇼", "Curacao": "🇨🇼",
    "카보베르데": "🇨🇻", "Cape Verde": "🇨🇻",
    "민주 콩고": "🇨🇩", "DR 콩고": "🇨🇩", "DR Congo": "🇨🇩", "DRC": "🇨🇩", "콩고민주공화국": "🇨🇩", "DR콩고": "🇨🇩", "콩고": "🇨🇩",
    "체코": "🇨🇿", "Czech Republic": "🇨🇿", "Czechia": "🇨🇿",
    "가나": "🇬🇭", "Ghana": "🇬🇭",
    "튀니지": "🇹🇳", "Tunisia": "🇹🇳"
  };

  const clean = countryName.trim();
  if (flags[clean]) return flags[clean];

  // Try substring checks
  for (const [key, value] of Object.entries(flags)) {
    if (clean.includes(key) || key.includes(clean)) {
      return value;
    }
  }

  // Common countries that might appear unexpectedly
  const genericFlags: Record<string, string> = {
    "가나": "🇬🇭", "슬로베니아": "🇸🇮", "조지아": "🇬🇪", "헝가리": "🇭🇺",
    "체코": "🇨🇿", "터키": "🇹🇷", "튀니지": "🇹🇳", "코스타리카": "🇨🇷", "온두라스": "🇭🇳"
  };
  
  if (genericFlags[clean]) return genericFlags[clean];

  return "🏳️";
}
export function formatTeamNameWithFlag(teamName: string): string {
  if (!teamName) return '';
  const flag = getCountryFlag(teamName);
  return `${flag} ${teamName}`;
}
