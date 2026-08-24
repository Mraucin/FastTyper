export interface Passage {
  id: string
  title: string
  source: string
  text: string
}

/** ~20–25-word passages from Polish fairy tales and accessible literature */
export const PASSAGES: Passage[] = [
  {
    id: 'kopciuszek-1',
    title: 'Kopciuszek',
    source: 'Bajka ludowa',
    text: 'Dawno temu żyła uboga dziewczyna zwana Kopciuszkiem. Musiała pracować od rana do nocy, podczas gdy siostry bawiły się w pięknych sukniach.',
  },
  {
    id: 'kapturek-1',
    title: 'Czerwony Kapturek',
    source: 'Bajka ludowa',
    text: 'Mama poprosiła Czerwonego Kapturka, by zaniosła babci koszyk z jedzeniem. Dziewczynka poszła przez las i spotkała przebiegłego wilka.',
  },
  {
    id: 'jas-malgosia-1',
    title: 'Jaś i Małgosia',
    source: 'Bajka ludowa',
    text: 'Jaś i Małgosia zgubili się w głębokim lesie. Po długiej drodze zobaczyli chatkę z piernika i cukierków stojącą między drzewami.',
  },
  {
    id: 'rybak-1',
    title: 'O rybaku i złotej rybce',
    source: 'Bajka ludowa',
    text: 'Stary rybak złowił kiedyś złotą rybkę. Rybka błagała, by ją wypuścił, a w zamian spełni każde jego życzenie.',
  },
  {
    id: 'krol-1',
    title: 'O śpiącej królewnie',
    source: 'Bajka ludowa',
    text: 'Na zamku urodziła się piękna królewna. Dwanaście wróżek dało jej dary, lecz trzynasta rzuciła surową klątwę.',
  },
  {
    id: 'brzechwa-1',
    title: 'Na straganie',
    source: 'Jan Brzechwa',
    text: 'Na straganie warzyw i owoców zrobiło się gwarno. Marchewka krzyczy, pietruszka nie ustępuje, a cebula płacze bez powodu.',
  },
  {
    id: 'tuwim-1',
    title: 'Lokomotywa',
    source: 'Julian Tuwim',
    text: 'Stoi na stacji lokomotywa, ciężka, ogromna i zadyszana. Nagle gwizd, para buch, koła w ruch, i pociąg rusza.',
  },
  {
    id: 'konopnicka-1',
    title: 'Na jagody',
    source: 'Maria Konopnicka',
    text: 'Dzieci poszły do lasu zbierać jagody. Słońce świeciło przez gałęzie, a powietrze pachniało żywicą i miękkim mchem.',
  },
  {
    id: 'mickiewicz-1',
    title: 'Pan Tadeusz',
    source: 'Adam Mickiewicz',
    text: 'Litwo, ojczyzno moja, ty jesteś jak zdrowie. Ile cię trzeba cenić, ten tylko się dowie, kto cię stracił.',
  },
  {
    id: 'sienkiewicz-1',
    title: 'W pustyni i w puszczy',
    source: 'Henryk Sienkiewicz',
    text: 'Staś i Nel wędrowali przez afrykańską pustynię. Słońce paliło mocno, a woda była dla nich na wagę złota.',
  },
  {
    id: 'lem-1',
    title: 'Bajki robotów',
    source: 'Stanisław Lem',
    text: 'W królestwie robotów żył konstruktor budujący maszyny mądrzejsze od siebie. Pewnego dnia stworzył urządzenie znające każdą odpowiedź.',
  },
  {
    id: 'herbert-1',
    title: 'Pan Cogito',
    source: 'Zbigniew Herbert',
    text: 'Pan Cogito rozmyśla o wierności, odwadze i pamięci. Wie, że wielkie słowa łatwo mówić, a trudniej wypełniać czynem.',
  },
  {
    id: 'szymborska-1',
    title: 'Nic dwa razy',
    source: 'Wisława Szymborska',
    text: 'Nic dwa razy się nie zdarza i nie zdarzy. Z tej przyczyny zrodziliśmy się bez wprawy i pomrzemy bez rutyny.',
  },
  {
    id: 'prus-1',
    title: 'Lalka',
    source: 'Bolesław Prus',
    text: 'Wokulski szedł ulicą pełen niepokoju i nadziei. Myślał o interesach, podróżach i kobiecie zajmującej jego serce.',
  },
  {
    id: 'orzeszkowa-1',
    title: 'Nad Niemnem',
    source: 'Eliza Orzeszkowa',
    text: 'Nad szerokim Niemnem rozciągały się zielone łąki i pola. Ludzie pracowali od świtu, zbierając plony i rozmawiając o domu.',
  },
  {
    id: 'zeromski-1',
    title: 'Syzyfowe prace',
    source: 'Stefan Żeromski',
    text: 'Uczniowie uczyli się wśród surowych zasad. Mimo to w ich myślach rosła potrzeba własnego języka i pamięci.',
  },
  {
    id: 'bajka-kot-1',
    title: 'Kot w butach',
    source: 'Bajka ludowa',
    text: 'Biedny chłopiec dostał w spadku tylko kota. Kot był sprytny i poprosił o buty oraz worek na przygody.',
  },
  {
    id: 'calineczka-1',
    title: 'Calineczka',
    source: 'Bajka ludowa',
    text: 'Calineczka była malutka jak kciuk i żyła wśród kwiatów. Porwana przez ropuchę, szukała drogi do domu przez łąki.',
  },
  {
    id: 'lesmian-1',
    title: 'Ballada',
    source: 'Bolesław Leśmian',
    text: 'W lesie działo się coś dziwnego i cichego. Drzewa szeptały słowa, których ludzie zwykle nie potrafią usłyszeć.',
  },
  {
    id: 'galczynski-1',
    title: 'Zaczarowana dorożka',
    source: 'Konstanty Ildefons Gałczyński',
    text: 'Nocą przez miasto jechała zaczarowana dorożka. Koła stukały po bruku, a latarnie migotały jak małe gwiazdy.',
  },
  {
    id: 'trylogia-1',
    title: 'Ogniem i mieczem',
    source: 'Henryk Sienkiewicz',
    text: 'Na kresach Rzeczypospolitej żyli ludzie dzielni i hardzi. Między wojną a spokojem szukali miłości, wierności i honoru.',
  },
  {
    id: 'tokarczuk-1',
    title: 'Prawiek',
    source: 'Olga Tokarczuk',
    text: 'W małej wsi czas płynął inaczej niż w wielkim świecie. Ludzie rodzili się, pracowali i odchodzili, a historie zostawały.',
  },
  {
    id: 'kapuscinski-1',
    title: 'Podróże',
    source: 'Ryszard Kapuściński',
    text: 'Reporter jechał przez obce kraje, słuchając ludzi uważnie. Wiedza rodziła się z rozmów przy stole i w tłumie ulicznym.',
  },
  {
    id: 'bajka-rycerz',
    title: 'O odważnym rycerzu',
    source: 'Bajka ludowa',
    text: 'Młody rycerz wyruszył odnaleźć zaginiony skarb królestwa. Po drodze pomagał podróżnym i nie unikał trudnych prób.',
  },
  {
    id: 'norwid-1',
    title: 'Fortepian Szopena',
    source: 'Cyprian Kamil Norwid',
    text: 'Artysta słyszał w muzyce echo ojczyzny i ludzkiego cierpienia. Dźwięki fortepianu niosły pamięć o domu i nadziei.',
  },
  {
    id: 'bajka-zima',
    title: 'O dwunastu miesiącach',
    source: 'Bajka ludowa',
    text: 'Dziewczyna poszła zimą do lasu szukać fiołków. Spotkała dwunastu braci, którzy rządzili miesiącami całego roku.',
  },
  {
    id: 'gombrowicz-1',
    title: 'Ferdydurke',
    source: 'Witold Gombrowicz',
    text: 'Bohater nagle wraca do szkolnej formy. Musi znosić miny i role narzucane przez innych, chcąc pozostać sobą.',
  },
  {
    id: 'boy-1',
    title: 'Słówka',
    source: 'Tadeusz Boy-Żeleński',
    text: 'W dawnej Warszawie lubiano dowcip i szybką rozmowę. Na salonach śmiano się z mód, urzędów i wielkich gestów.',
  },
]

export function pickPassage(excludeIds: string[] = []): Passage {
  const available = PASSAGES.filter((p) => !excludeIds.includes(p.id))
  const pool = available.length > 0 ? available : PASSAGES
  return pool[Math.floor(Math.random() * pool.length)]!
}
