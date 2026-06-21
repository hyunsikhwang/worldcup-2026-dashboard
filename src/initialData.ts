import { WorldCupData, GroupStanding, Match, BracketData } from './types';

// The 48 teams distributed officially in 12 groups (A~L) as registered in the official FIFA match schedule
const groupTeamsMap: Record<string, string[]> = {
  'A': ['멕시코', '남아프리카공화국', '대한민국', '체코'],
  'B': ['캐나다', '보스니아 헤르체고비나', '카타르', '스위스'],
  'C': ['브라질', '모로코', '아이티', '스코틀랜드'],
  'D': ['미국', '파라과이', '호주', '터키'],
  'E': ['독일', '퀴라소', '코트디부아르', '에콰도르'],
  'F': ['네덜란드', '일본', '스웨덴', '튀니지'],
  'G': ['벨기에', '이집트', '이란', '뉴질랜드'],
  'H': ['스페인', '카보베르데', '사우디아라비아', '우루과이'],
  'I': ['프랑스', '세네갈', '이라크', '노르웨이'],
  'J': ['아르헨티나', '알제리', '오스트리아', '요르단'],
  'K': ['포르투갈', '콩고민주공화국', '우즈베키스탄', '콜롬비아'],
  'L': ['잉글랜드', '크로아티아', '가나', '파나마']
};

// Generate the initial group standings structure with 0 values
const initialGroups: GroupStanding[] = Object.keys(groupTeamsMap).map((groupLetter) => {
  const teams = groupTeamsMap[groupLetter].map((teamName, index) => ({
    rank: index + 1,
    name: teamName,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0
  }));

  return {
    groupLetter,
    teams
  };
});

// The official list of all 104 matches of the 2026 World Cup fetched and mapped directly from official FIFA feed
const initialMatches: Match[] = [
  {
    "id": "m_1",
    "homeTeam": "멕시코",
    "awayTeam": "남아프리카공화국",
    "homeScore": 2,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 12일",
    "time": "04:00",
    "group": "A",
    "stage": "Group Stage"
  },
  {
    "id": "m_2",
    "homeTeam": "대한민국",
    "awayTeam": "체코",
    "homeScore": 2,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 12일",
    "time": "11:00",
    "group": "A",
    "stage": "Group Stage"
  },
  {
    "id": "m_3",
    "homeTeam": "캐나다",
    "awayTeam": "보스니아 헤르체고비나",
    "homeScore": 1,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 13일",
    "time": "04:00",
    "group": "B",
    "stage": "Group Stage"
  },
  {
    "id": "m_4",
    "homeTeam": "미국",
    "awayTeam": "파라과이",
    "homeScore": 4,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 13일",
    "time": "10:00",
    "group": "D",
    "stage": "Group Stage"
  },
  {
    "id": "m_5",
    "homeTeam": "아이티",
    "awayTeam": "스코틀랜드",
    "homeScore": 0,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 14일",
    "time": "10:00",
    "group": "C",
    "stage": "Group Stage"
  },
  {
    "id": "m_6",
    "homeTeam": "호주",
    "awayTeam": "터키",
    "homeScore": 2,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 14일",
    "time": "13:00",
    "group": "D",
    "stage": "Group Stage"
  },
  {
    "id": "m_7",
    "homeTeam": "브라질",
    "awayTeam": "모로코",
    "homeScore": 1,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 14일",
    "time": "07:00",
    "group": "C",
    "stage": "Group Stage"
  },
  {
    "id": "m_8",
    "homeTeam": "카타르",
    "awayTeam": "스위스",
    "homeScore": 1,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 14일",
    "time": "04:00",
    "group": "B",
    "stage": "Group Stage"
  },
  {
    "id": "m_9",
    "homeTeam": "코트디부아르",
    "awayTeam": "에콰도르",
    "homeScore": 1,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 15일",
    "time": "08:00",
    "group": "E",
    "stage": "Group Stage"
  },
  {
    "id": "m_10",
    "homeTeam": "독일",
    "awayTeam": "퀴라소",
    "homeScore": 7,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 15일",
    "time": "02:00",
    "group": "E",
    "stage": "Group Stage"
  },
  {
    "id": "m_11",
    "homeTeam": "네덜란드",
    "awayTeam": "일본",
    "homeScore": 2,
    "awayScore": 2,
    "status": "Finished",
    "date": "6월 15일",
    "time": "05:00",
    "group": "F",
    "stage": "Group Stage"
  },
  {
    "id": "m_12",
    "homeTeam": "스웨덴",
    "awayTeam": "튀니지",
    "homeScore": 5,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 15일",
    "time": "11:00",
    "group": "F",
    "stage": "Group Stage"
  },
  {
    "id": "m_13",
    "homeTeam": "사우디아라비아",
    "awayTeam": "우루과이",
    "homeScore": 1,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 16일",
    "time": "07:00",
    "group": "H",
    "stage": "Group Stage"
  },
  {
    "id": "m_14",
    "homeTeam": "스페인",
    "awayTeam": "카보베르데",
    "homeScore": 0,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 16일",
    "time": "01:00",
    "group": "H",
    "stage": "Group Stage"
  },
  {
    "id": "m_15",
    "homeTeam": "이란",
    "awayTeam": "뉴질랜드",
    "homeScore": 2,
    "awayScore": 2,
    "status": "Finished",
    "date": "6월 16일",
    "time": "10:00",
    "group": "G",
    "stage": "Group Stage"
  },
  {
    "id": "m_16",
    "homeTeam": "벨기에",
    "awayTeam": "이집트",
    "homeScore": 1,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 16일",
    "time": "04:00",
    "group": "G",
    "stage": "Group Stage"
  },
  {
    "id": "m_17",
    "homeTeam": "프랑스",
    "awayTeam": "세네갈",
    "homeScore": 3,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 17일",
    "time": "04:00",
    "group": "I",
    "stage": "Group Stage"
  },
  {
    "id": "m_18",
    "homeTeam": "이라크",
    "awayTeam": "노르웨이",
    "homeScore": 1,
    "awayScore": 4,
    "status": "Finished",
    "date": "6월 17일",
    "time": "07:00",
    "group": "I",
    "stage": "Group Stage"
  },
  {
    "id": "m_19",
    "homeTeam": "아르헨티나",
    "awayTeam": "알제리",
    "homeScore": 3,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 17일",
    "time": "10:00",
    "group": "J",
    "stage": "Group Stage"
  },
  {
    "id": "m_20",
    "homeTeam": "오스트리아",
    "awayTeam": "요르단",
    "homeScore": 3,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 17일",
    "time": "13:00",
    "group": "J",
    "stage": "Group Stage"
  },
  {
    "id": "m_21",
    "homeTeam": "가나",
    "awayTeam": "파나마",
    "homeScore": 1,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 18일",
    "time": "08:00",
    "group": "L",
    "stage": "Group Stage"
  },
  {
    "id": "m_22",
    "homeTeam": "잉글랜드",
    "awayTeam": "크로아티아",
    "homeScore": 4,
    "awayScore": 2,
    "status": "Finished",
    "date": "6월 18일",
    "time": "05:00",
    "group": "L",
    "stage": "Group Stage"
  },
  {
    "id": "m_23",
    "homeTeam": "포르투갈",
    "awayTeam": "콩고민주공화국",
    "homeScore": 1,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 18일",
    "time": "02:00",
    "group": "K",
    "stage": "Group Stage"
  },
  {
    "id": "m_24",
    "homeTeam": "우즈베키스탄",
    "awayTeam": "콜롬비아",
    "homeScore": 1,
    "awayScore": 3,
    "status": "Finished",
    "date": "6월 18일",
    "time": "11:00",
    "group": "K",
    "stage": "Group Stage"
  },
  {
    "id": "m_25",
    "homeTeam": "체코",
    "awayTeam": "남아프리카공화국",
    "homeScore": 1,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 19일",
    "time": "01:00",
    "group": "A",
    "stage": "Group Stage"
  },
  {
    "id": "m_26",
    "homeTeam": "스위스",
    "awayTeam": "보스니아 헤르체고비나",
    "homeScore": 4,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 19일",
    "time": "04:00",
    "group": "B",
    "stage": "Group Stage"
  },
  {
    "id": "m_27",
    "homeTeam": "캐나다",
    "awayTeam": "카타르",
    "homeScore": 6,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 19일",
    "time": "07:00",
    "group": "B",
    "stage": "Group Stage"
  },
  {
    "id": "m_28",
    "homeTeam": "멕시코",
    "awayTeam": "대한민국",
    "homeScore": 1,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 19일",
    "time": "10:00",
    "group": "A",
    "stage": "Group Stage"
  },
  {
    "id": "m_29",
    "homeTeam": "브라질",
    "awayTeam": "아이티",
    "homeScore": 3,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 20일",
    "time": "09:30",
    "group": "C",
    "stage": "Group Stage"
  },
  {
    "id": "m_30",
    "homeTeam": "스코틀랜드",
    "awayTeam": "모로코",
    "homeScore": 0,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 20일",
    "time": "07:00",
    "group": "C",
    "stage": "Group Stage"
  },
  {
    "id": "m_31",
    "homeTeam": "터키",
    "awayTeam": "파라과이",
    "homeScore": 0,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 20일",
    "time": "12:00",
    "group": "D",
    "stage": "Group Stage"
  },
  {
    "id": "m_32",
    "homeTeam": "미국",
    "awayTeam": "호주",
    "homeScore": 2,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 20일",
    "time": "04:00",
    "group": "D",
    "stage": "Group Stage"
  },
  {
    "id": "m_33",
    "homeTeam": "독일",
    "awayTeam": "코트디부아르",
    "homeScore": 2,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 21일",
    "time": "05:00",
    "group": "E",
    "stage": "Group Stage"
  },
  {
    "id": "m_34",
    "homeTeam": "에콰도르",
    "awayTeam": "퀴라소",
    "homeScore": 0,
    "awayScore": 0,
    "status": "Finished",
    "date": "6월 21일",
    "time": "09:00",
    "group": "E",
    "stage": "Group Stage"
  },
  {
    "id": "m_35",
    "homeTeam": "네덜란드",
    "awayTeam": "스웨덴",
    "homeScore": 5,
    "awayScore": 1,
    "status": "Finished",
    "date": "6월 21일",
    "time": "02:00",
    "group": "F",
    "stage": "Group Stage"
  },
  {
    "id": "m_36",
    "homeTeam": "튀니지",
    "awayTeam": "일본",
    "homeScore": 0,
    "awayScore": 4,
    "status": "Finished",
    "date": "6월 21일",
    "time": "13:00",
    "group": "F",
    "stage": "Group Stage"
  },
  {
    "id": "m_37",
    "homeTeam": "우루과이",
    "awayTeam": "카보베르데",
    "status": "Upcoming",
    "date": "6월 22일",
    "time": "07:00",
    "group": "H",
    "stage": "Group Stage"
  },
  {
    "id": "m_38",
    "homeTeam": "스페인",
    "awayTeam": "사우디아라비아",
    "status": "Upcoming",
    "date": "6월 22일",
    "time": "01:00",
    "group": "H",
    "stage": "Group Stage"
  },
  {
    "id": "m_39",
    "homeTeam": "벨기에",
    "awayTeam": "이란",
    "status": "Upcoming",
    "date": "6월 22일",
    "time": "04:00",
    "group": "G",
    "stage": "Group Stage"
  },
  {
    "id": "m_40",
    "homeTeam": "뉴질랜드",
    "awayTeam": "이집트",
    "status": "Upcoming",
    "date": "6월 22일",
    "time": "10:00",
    "group": "G",
    "stage": "Group Stage"
  },
  {
    "id": "m_41",
    "homeTeam": "노르웨이",
    "awayTeam": "세네갈",
    "status": "Upcoming",
    "date": "6월 23일",
    "time": "09:00",
    "group": "I",
    "stage": "Group Stage"
  },
  {
    "id": "m_42",
    "homeTeam": "프랑스",
    "awayTeam": "이라크",
    "status": "Upcoming",
    "date": "6월 23일",
    "time": "06:00",
    "group": "I",
    "stage": "Group Stage"
  },
  {
    "id": "m_43",
    "homeTeam": "아르헨티나",
    "awayTeam": "오스트리아",
    "status": "Upcoming",
    "date": "6월 23일",
    "time": "02:00",
    "group": "J",
    "stage": "Group Stage"
  },
  {
    "id": "m_44",
    "homeTeam": "요르단",
    "awayTeam": "알제리",
    "status": "Upcoming",
    "date": "6월 23일",
    "time": "12:00",
    "group": "J",
    "stage": "Group Stage"
  },
  {
    "id": "m_45",
    "homeTeam": "잉글랜드",
    "awayTeam": "가나",
    "status": "Upcoming",
    "date": "6월 24일",
    "time": "05:00",
    "group": "L",
    "stage": "Group Stage"
  },
  {
    "id": "m_46",
    "homeTeam": "파나마",
    "awayTeam": "크로아티아",
    "status": "Upcoming",
    "date": "6월 24일",
    "time": "08:00",
    "group": "L",
    "stage": "Group Stage"
  },
  {
    "id": "m_47",
    "homeTeam": "포르투갈",
    "awayTeam": "우즈베키스탄",
    "status": "Upcoming",
    "date": "6월 24일",
    "time": "02:00",
    "group": "K",
    "stage": "Group Stage"
  },
  {
    "id": "m_48",
    "homeTeam": "콜롬비아",
    "awayTeam": "콩고민주공화국",
    "status": "Upcoming",
    "date": "6월 24일",
    "time": "11:00",
    "group": "K",
    "stage": "Group Stage"
  },
  {
    "id": "m_49",
    "homeTeam": "스코틀랜드",
    "awayTeam": "브라질",
    "status": "Upcoming",
    "date": "6월 25일",
    "time": "07:00",
    "group": "C",
    "stage": "Group Stage"
  },
  {
    "id": "m_50",
    "homeTeam": "모로코",
    "awayTeam": "아이티",
    "status": "Upcoming",
    "date": "6월 25일",
    "time": "07:00",
    "group": "C",
    "stage": "Group Stage"
  },
  {
    "id": "m_51",
    "homeTeam": "스위스",
    "awayTeam": "캐나다",
    "status": "Upcoming",
    "date": "6월 25일",
    "time": "04:00",
    "group": "B",
    "stage": "Group Stage"
  },
  {
    "id": "m_52",
    "homeTeam": "보스니아 헤르체고비나",
    "awayTeam": "카타르",
    "status": "Upcoming",
    "date": "6월 25일",
    "time": "04:00",
    "group": "B",
    "stage": "Group Stage"
  },
  {
    "id": "m_53",
    "homeTeam": "체코",
    "awayTeam": "멕시코",
    "status": "Upcoming",
    "date": "6월 25일",
    "time": "10:00",
    "group": "A",
    "stage": "Group Stage"
  },
  {
    "id": "m_54",
    "homeTeam": "남아프리카공화국",
    "awayTeam": "대한민국",
    "status": "Upcoming",
    "date": "6월 25일",
    "time": "10:00",
    "group": "A",
    "stage": "Group Stage"
  },
  {
    "id": "m_55",
    "homeTeam": "퀴라소",
    "awayTeam": "코트디부아르",
    "status": "Upcoming",
    "date": "6월 26일",
    "time": "05:00",
    "group": "E",
    "stage": "Group Stage"
  },
  {
    "id": "m_56",
    "homeTeam": "에콰도르",
    "awayTeam": "독일",
    "status": "Upcoming",
    "date": "6월 26일",
    "time": "05:00",
    "group": "E",
    "stage": "Group Stage"
  },
  {
    "id": "m_57",
    "homeTeam": "일본",
    "awayTeam": "스웨덴",
    "status": "Upcoming",
    "date": "6월 26일",
    "time": "08:00",
    "group": "F",
    "stage": "Group Stage"
  },
  {
    "id": "m_58",
    "homeTeam": "튀니지",
    "awayTeam": "네덜란드",
    "status": "Upcoming",
    "date": "6월 26일",
    "time": "08:00",
    "group": "F",
    "stage": "Group Stage"
  },
  {
    "id": "m_59",
    "homeTeam": "터키",
    "awayTeam": "미국",
    "status": "Upcoming",
    "date": "6월 26일",
    "time": "11:00",
    "group": "D",
    "stage": "Group Stage"
  },
  {
    "id": "m_60",
    "homeTeam": "파라과이",
    "awayTeam": "호주",
    "status": "Upcoming",
    "date": "6월 26일",
    "time": "11:00",
    "group": "D",
    "stage": "Group Stage"
  },
  {
    "id": "m_61",
    "homeTeam": "노르웨이",
    "awayTeam": "프랑스",
    "status": "Upcoming",
    "date": "6월 27일",
    "time": "04:00",
    "group": "I",
    "stage": "Group Stage"
  },
  {
    "id": "m_62",
    "homeTeam": "세네갈",
    "awayTeam": "이라크",
    "status": "Upcoming",
    "date": "6월 27일",
    "time": "04:00",
    "group": "I",
    "stage": "Group Stage"
  },
  {
    "id": "m_63",
    "homeTeam": "이집트",
    "awayTeam": "이란",
    "status": "Upcoming",
    "date": "6월 27일",
    "time": "12:00",
    "group": "G",
    "stage": "Group Stage"
  },
  {
    "id": "m_64",
    "homeTeam": "뉴질랜드",
    "awayTeam": "벨기에",
    "status": "Upcoming",
    "date": "6월 27일",
    "time": "12:00",
    "group": "G",
    "stage": "Group Stage"
  },
  {
    "id": "m_65",
    "homeTeam": "카보베르데",
    "awayTeam": "사우디아라비아",
    "status": "Upcoming",
    "date": "6월 27일",
    "time": "09:00",
    "group": "H",
    "stage": "Group Stage"
  },
  {
    "id": "m_66",
    "homeTeam": "우루과이",
    "awayTeam": "스페인",
    "status": "Upcoming",
    "date": "6월 27일",
    "time": "09:00",
    "group": "H",
    "stage": "Group Stage"
  },
  {
    "id": "m_67",
    "homeTeam": "파나마",
    "awayTeam": "잉글랜드",
    "status": "Upcoming",
    "date": "6월 28일",
    "time": "06:00",
    "group": "L",
    "stage": "Group Stage"
  },
  {
    "id": "m_68",
    "homeTeam": "크로아티아",
    "awayTeam": "가나",
    "status": "Upcoming",
    "date": "6월 28일",
    "time": "06:00",
    "group": "L",
    "stage": "Group Stage"
  },
  {
    "id": "m_69",
    "homeTeam": "알제리",
    "awayTeam": "오스트리아",
    "status": "Upcoming",
    "date": "6월 28일",
    "time": "11:00",
    "group": "J",
    "stage": "Group Stage"
  },
  {
    "id": "m_70",
    "homeTeam": "요르단",
    "awayTeam": "아르헨티나",
    "status": "Upcoming",
    "date": "6월 28일",
    "time": "11:00",
    "group": "J",
    "stage": "Group Stage"
  },
  {
    "id": "m_71",
    "homeTeam": "콜롬비아",
    "awayTeam": "포르투갈",
    "status": "Upcoming",
    "date": "6월 28일",
    "time": "08:30",
    "group": "K",
    "stage": "Group Stage"
  },
  {
    "id": "m_72",
    "homeTeam": "콩고민주공화국",
    "awayTeam": "우즈베키스탄",
    "status": "Upcoming",
    "date": "6월 28일",
    "time": "08:30",
    "group": "K",
    "stage": "Group Stage"
  },
  {
    "id": "m_73",
    "homeTeam": "A조 2위",
    "awayTeam": "B조 2위",
    "status": "Upcoming",
    "date": "6월 29일",
    "time": "04:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_74",
    "homeTeam": "독일",
    "awayTeam": "ABCDF조 3위",
    "status": "Upcoming",
    "date": "6월 30일",
    "time": "05:30",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_75",
    "homeTeam": "F조 1위",
    "awayTeam": "C조 2위",
    "status": "Upcoming",
    "date": "6월 30일",
    "time": "10:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_76",
    "homeTeam": "C조 1위",
    "awayTeam": "F조 2위",
    "status": "Upcoming",
    "date": "6월 30일",
    "time": "02:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_77",
    "homeTeam": "I조 1위",
    "awayTeam": "CDFGH조 3위",
    "status": "Upcoming",
    "date": "7월 1일",
    "time": "06:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_78",
    "homeTeam": "E조 2위",
    "awayTeam": "I조 2위",
    "status": "Upcoming",
    "date": "7월 1일",
    "time": "02:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_79",
    "homeTeam": "멕시코",
    "awayTeam": "CEFHI조 3위",
    "status": "Upcoming",
    "date": "7월 1일",
    "time": "10:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_80",
    "homeTeam": "L조 1위",
    "awayTeam": "EHIJK조 3위",
    "status": "Upcoming",
    "date": "7월 2일",
    "time": "01:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_81",
    "homeTeam": "미국",
    "awayTeam": "BEFIJ조 3위",
    "status": "Upcoming",
    "date": "7월 2일",
    "time": "09:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_82",
    "homeTeam": "G조 1위",
    "awayTeam": "AEHIJ조 3위",
    "status": "Upcoming",
    "date": "7월 2일",
    "time": "05:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_83",
    "homeTeam": "K조 2위",
    "awayTeam": "L조 2위",
    "status": "Upcoming",
    "date": "7월 3일",
    "time": "08:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_84",
    "homeTeam": "H조 1위",
    "awayTeam": "J조 2위",
    "status": "Upcoming",
    "date": "7월 3일",
    "time": "04:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_85",
    "homeTeam": "B조 1위",
    "awayTeam": "EFGIJ조 3위",
    "status": "Upcoming",
    "date": "7월 3일",
    "time": "12:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_86",
    "homeTeam": "J조 1위",
    "awayTeam": "H조 2위",
    "status": "Upcoming",
    "date": "7월 4일",
    "time": "07:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_87",
    "homeTeam": "K조 1위",
    "awayTeam": "DEIJL조 3위",
    "status": "Upcoming",
    "date": "7월 4일",
    "time": "10:30",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_88",
    "homeTeam": "D조 2위",
    "awayTeam": "G조 2위",
    "status": "Upcoming",
    "date": "7월 4일",
    "time": "03:00",
    "group": null,
    "stage": "Round of 32"
  },
  {
    "id": "m_89",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 5일",
    "time": "06:00",
    "group": null,
    "stage": "Round of 16"
  },
  {
    "id": "m_90",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 5일",
    "time": "02:00",
    "group": null,
    "stage": "Round of 16"
  },
  {
    "id": "m_91",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 6일",
    "time": "05:00",
    "group": null,
    "stage": "Round of 16"
  },
  {
    "id": "m_92",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 6일",
    "time": "09:00",
    "group": null,
    "stage": "Round of 16"
  },
  {
    "id": "m_93",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 7일",
    "time": "04:00",
    "group": null,
    "stage": "Round of 16"
  },
  {
    "id": "m_94",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 7일",
    "time": "09:00",
    "group": null,
    "stage": "Round of 16"
  },
  {
    "id": "m_95",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 8일",
    "time": "01:00",
    "group": null,
    "stage": "Round of 16"
  },
  {
    "id": "m_96",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 8일",
    "time": "05:00",
    "group": null,
    "stage": "Round of 16"
  },
  {
    "id": "m_97",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 10일",
    "time": "05:00",
    "group": null,
    "stage": "Quarter-finals"
  },
  {
    "id": "m_98",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 11일",
    "time": "04:00",
    "group": null,
    "stage": "Quarter-finals"
  },
  {
    "id": "m_99",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 12일",
    "time": "06:00",
    "group": null,
    "stage": "Quarter-finals"
  },
  {
    "id": "m_100",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 12일",
    "time": "10:00",
    "group": null,
    "stage": "Quarter-finals"
  },
  {
    "id": "m_101",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 15일",
    "time": "04:00",
    "group": null,
    "stage": "Semi-finals"
  },
  {
    "id": "m_102",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 16일",
    "time": "04:00",
    "group": null,
    "stage": "Semi-finals"
  },
  {
    "id": "m_103",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 19일",
    "time": "06:00",
    "group": null,
    "stage": "Third-place"
  },
  {
    "id": "m_104",
    "homeTeam": "미정",
    "awayTeam": "미정",
    "status": "Upcoming",
    "date": "7월 20일",
    "time": "04:00",
    "group": null,
    "stage": "Final"
  }
];

// Generate initial empty bracket with proper matchup routes
const generateBracket = (): BracketData => {
  const roundOf32 = [
    { id: 'r32_1', stage: 'RoundOf32' as const, matchNumber: 1, homeTeam: 'A조 1위', awayTeam: 'C조 3위', date: '6월 28일', time: '04:00', nextMatchId: 'r16_1' },
    { id: 'r32_2', stage: 'RoundOf32' as const, matchNumber: 2, homeTeam: 'B조 2위', awayTeam: 'F조 2위', date: '6월 28일', time: '07:30', nextMatchId: 'r16_1' },
    { id: 'r32_3', stage: 'RoundOf32' as const, matchNumber: 3, homeTeam: 'C조 1위', awayTeam: 'F조 3위', date: '6월 29일', time: '04:00', nextMatchId: 'r16_2' },
    { id: 'r32_4', stage: 'RoundOf32' as const, matchNumber: 4, homeTeam: 'D조 2위', awayTeam: 'G조 2위', date: '6월 29일', time: '07:30', nextMatchId: 'r16_2' },
    { id: 'r32_5', stage: 'RoundOf32' as const, matchNumber: 5, homeTeam: 'E조 1위', awayTeam: 'I조 3위', date: '6월 30일', time: '04:00', nextMatchId: 'r16_3' },
    { id: 'r32_6', stage: 'RoundOf32' as const, matchNumber: 6, homeTeam: 'F조 1위', awayTeam: 'K조 2위', date: '6월 30일', time: '07:30', nextMatchId: 'r16_3' },
    { id: 'r32_7', stage: 'RoundOf32' as const, matchNumber: 7, homeTeam: 'G조 1위', awayTeam: 'J조 3위', date: '7월 1일', time: '04:00', nextMatchId: 'r16_4' },
    { id: 'r32_8', stage: 'RoundOf32' as const, matchNumber: 8, homeTeam: 'H조 2위', awayTeam: 'L조 2위', date: '7월 1일', time: '07:30', nextMatchId: 'r16_4' },
    { id: 'r32_9', stage: 'RoundOf32' as const, matchNumber: 9, homeTeam: 'I조 1위', awayTeam: 'A조 3위', date: '7월 2일', time: '04:00', nextMatchId: 'r16_5' },
    { id: 'r32_10', stage: 'RoundOf32' as const, matchNumber: 10, homeTeam: 'J조 1위', awayTeam: 'D조 3위', date: '7월 2일', time: '07:30', nextMatchId: 'r16_5' },
    { id: 'r32_11', stage: 'RoundOf32' as const, matchNumber: 11, homeTeam: 'K조 1위', awayTeam: 'E조 3위', date: '7월 3일', time: '04:00', nextMatchId: 'r16_6' },
    { id: 'r32_12', stage: 'RoundOf32' as const, matchNumber: 12, homeTeam: 'L조 1위', awayTeam: 'H조 3위', date: '7월 3일', time: '07:30', nextMatchId: 'r16_6' },
    { id: 'r32_13', stage: 'RoundOf32' as const, matchNumber: 13, homeTeam: 'B조 1위', awayTeam: 'E조 2위', date: '7월 4일', time: '04:00', nextMatchId: 'r16_7' },
    { id: 'r32_14', stage: 'RoundOf32' as const, matchNumber: 14, homeTeam: 'D조 1위', awayTeam: 'I조 2위', date: '7월 4일', time: '07:30', nextMatchId: 'r16_7' },
    { id: 'r32_15', stage: 'RoundOf32' as const, matchNumber: 15, homeTeam: 'H조 1위', awayTeam: 'J조 2위', date: '7월 5일', time: '04:00', nextMatchId: 'r16_8' },
    { id: 'r32_16', stage: 'RoundOf32' as const, matchNumber: 16, homeTeam: 'A조 2위', awayTeam: 'C조 2위', date: '7월 5일', time: '07:30', nextMatchId: 'r16_8' }
  ];

  const roundOf16 = Array.from({ length: 8 }, (_, idx) => ({
    id: `r16_${idx + 1}`,
    stage: 'RoundOf16' as const,
    matchNumber: idx + 1,
    homeTeam: `32강 ${idx * 2 + 1}경기 승자`,
    awayTeam: `32강 ${idx * 2 + 2}경기 승자`,
    date: `7월 ${6 + Math.floor(idx / 2)}일`,
    time: idx % 2 === 0 ? '04:00' : '08:00',
    nextMatchId: `qf_${Math.floor(idx / 2) + 1}`
  }));

  const quarterFinals = Array.from({ length: 4 }, (_, idx) => ({
    id: `qf_${idx + 1}`,
    stage: 'QuarterFinals' as const,
    matchNumber: idx + 1,
    homeTeam: `16강 ${idx * 2 + 1}경기 승자`,
    awayTeam: `16강 ${idx * 2 + 2}경기 승자`,
    date: `7월 ${11 + Math.floor(idx / 2)}일`,
    time: idx % 2 === 0 ? '04:00' : '08:00',
    nextMatchId: `sf_${Math.floor(idx / 2) + 1}`
  }));

  const semiFinals = Array.from({ length: 2 }, (_, idx) => ({
    id: `sf_${idx + 1}`,
    stage: 'SemiFinals' as const,
    matchNumber: idx + 1,
    homeTeam: `준준결승 ${idx * 2 + 1}경기 승자`,
    awayTeam: `준준결승 ${idx * 2 + 2}경기 승자`,
    date: `7월 ${15 + idx}일`,
    time: '08:00',
    nextMatchId: 'fn_1'
  }));

  const final = [
    {
      id: 'fn_1',
      stage: 'Final' as const,
      matchNumber: 1,
      homeTeam: '준결승 1경기 승자',
      awayTeam: '준결승 2경기 승자',
      date: '7월 20일',
      time: '04:00'
    }
  ];

  return {
    roundOf32,
    roundOf16,
    quarterFinals,
    semiFinals,
    final
  };
};

export const initialWorldCupData: WorldCupData = {
  lastUpdated: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
  isRealTime: false,
  groups: initialGroups,
  matches: initialMatches,
  bracket: generateBracket()
};
