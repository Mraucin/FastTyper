export interface Passage {
  id: string
  title: string
  source: string
  text: string
}

/** ~40-word passages from Polish fairy tales and accessible literature */
export const PASSAGES: Passage[] = [
  {
    id: 'kopciuszek-1',
    title: 'Kopciuszek',
    source: 'Bajka ludowa',
    text: 'Dawno temu żyła sobie uboga dziewczyna zwana Kopciuszkiem. Musiała ciężko pracować od rana do nocy, podczas gdy jej siostry przyrodnie bawiły się w pięknych sukniach. Pewnego dnia król ogłosił wielki bal dla całego królestwa.',
  },
  {
    id: 'kapturek-1',
    title: 'Czerwony Kapturek',
    source: 'Bajka ludowa',
    text: 'Pewnego dnia mama poprosiła Czerwonego Kapturka, by zaniosła chorej babci koszyk z jedzeniem. Dziewczynka poszła przez las i spotkała wilka. Wilk zapytał, dokąd zmierza, a ona niewinnie opowiedziała mu o chorej babci w chatce za gęstwiną.',
  },
  {
    id: 'jas-malgosia-1',
    title: 'Jaś i Małgosia',
    source: 'Bajka ludowa',
    text: 'Jaś i Małgosia zgubili się w głębokim lesie. Po długiej wędrówce zobaczyli chatkę z piernika i cukierków. Gdy zaczęli jeść słodycze, wyszła stara kobieta i zaprosiła ich do domu, obiecując ciepło, jedzenie i bezpieczne schronienie.',
  },
  {
    id: 'rybak-1',
    title: 'O rybaku i złotej rybce',
    source: 'Bajka ludowa',
    text: 'Stary rybak złowił kiedyś złotą rybkę. Rybka błagała, by ją wypuścił, a w zamian spełni każde życzenie. Rybak zlitował się i wypuścił ją do morza. Gdy wrócił do domu, żona kazała mu wracać i prosić o nową chatę.',
  },
  {
    id: 'krol-1',
    title: 'O śpiącej królewnie',
    source: 'Bajka ludowa',
    text: 'Na zamku urodziła się piękna królewna. Dwanaście wróżek obdarzyło ją darami, lecz trzynasta rzuciła klątwę. Dziewczyna miała ukłuć się wrzecionem i spać sto lat. Cały zamek zapadł w głęboki sen wraz z nią, aż pewnego dnia pojawił się książę.',
  },
  {
    id: 'brzechwa-1',
    title: 'Na straganie',
    source: 'Jan Brzechwa',
    text: 'Wyskakuje na stragan warzyw i owoców. Marchewka krzyczy, że jest najzdrowsza, a pietruszka nie chce ustąpić. Pomidor rumieni się ze złości, a cebula płacze bez powodu. Na straganie robi się gwarno, bo każdy chce być najważniejszy.',
  },
  {
    id: 'tuwim-1',
    title: 'Lokomotywa',
    source: 'Julian Tuwim',
    text: 'Stoi na stacji lokomotywa, ciężka, ogromna i potężnie zadyszana. Nagle gwizd, nagle świst, para buch, koła w ruch. I pociąg rusza, ciągnąc za sobą długi szereg wagonów pełnych ludzi, węgla, bagażu i głośnych rozmów podróżnych.',
  },
  {
    id: 'konopnicka-1',
    title: 'Na jagody',
    source: 'Maria Konopnicka',
    text: 'Dzieci poszły do lasu zbierać jagody. Słońce świeciło przez gałęzie, a powietrze pachniało żywicą i mchem. Każdy miał swój koszyczek i zbierał uważnie, by nie zgubić drogi między drzewami. Wieczorem wracali do domu z fioletowymi ustami i pełnymi koszykami.',
  },
  {
    id: 'mickiewicz-1',
    title: 'Pan Tadeusz',
    source: 'Adam Mickiewicz',
    text: 'Litwo, ojczyzno moja, ty jesteś jak zdrowie. Ile cię trzeba cenić, ten tylko się dowie, kto cię stracił. Dziś piękność twą w całej ozdobie widzę i opisuję, bo tęsknię po tobie. Tak wspominał poeta ojczyste strony pełne pól i lasów.',
  },
  {
    id: 'sienkiewicz-1',
    title: 'W pustyni i w puszczy',
    source: 'Henryk Sienkiewicz',
    text: 'Staś i Nel wędrowali przez afrykańską pustynię. Słońce paliło mocno, a woda była na wagę złota. Mimo strachu i zmęczenia dzieci trzymały się razem. Staś opiekował się Nel, a ona dodawała mu odwagi uśmiechem nawet w najtrudniejszych chwilach podróży.',
  },
  {
    id: 'lem-1',
    title: 'Bajki robotów',
    source: 'Stanisław Lem',
    text: 'W królestwie robotów żył pewien konstruktor, który budował maszyny mądrzejsze od siebie. Pewnego dnia stworzył urządzenie potrafiące odpowiadać na każde pytanie. Król chciał je zdobyć, lecz konstruktor ukrył je w labiryncie pełnym luster, dźwięków i mylących korytarzy.',
  },
  {
    id: 'herbert-1',
    title: 'Pan Cogito',
    source: 'Zbigniew Herbert',
    text: 'Pan Cogito rozmyśla o zwykłych sprawach: o wierności, odwadze i pamięci. Wie, że wielkie słowa łatwo wypowiadać, lecz trudniej wypełniać je codziennym czynem. Dlatego wybiera małe gesty prawdy i uważa, że właśnie w nich kryje się prawdziwa siła człowieka.',
  },
  {
    id: 'szymborska-1',
    title: 'Nic dwa razy',
    source: 'Wisława Szymborska',
    text: 'Nic dwa razy się nie zdarza i nie zdarzy. Z tej przyczyny zrodziliśmy się bez wprawy i pomrzemy bez rutyny. Choć jesteśmy uczniami ziemi, nie będziemy powtarzać żadnej zimy ani żadnego lata. Każdy dzień jest nowy i niepowtarzalny jak pierwsza rozmowa.',
  },
  {
    id: 'prus-1',
    title: 'Lalka',
    source: 'Bolesław Prus',
    text: 'Wokulski szedł ulicą pełen niepokoju i nadziei. Myślał o interesach, o podróżach i o kobiecie, która zajmowała jego serce. Warszawa tętniła życiem, a on wśród tłumów czuł się samotny. Marzył o wielkiej zmianie, która mogłaby nadać sens jego staraniom.',
  },
  {
    id: 'orzeszkowa-1',
    title: 'Nad Niemnem',
    source: 'Eliza Orzeszkowa',
    text: 'Nad szerokim Niemnem rozciągały się zielone łąki i pola. Ludzie pracowali od świtu, zbierając plony i rozmawiając o sprawach domu. Między rodzinami żyły dawne urazy, lecz młode pokolenie pragnęło zgody. Natura była spokojna, choć ludzkie serca pełne sprzecznych uczuć.',
  },
  {
    id: 'zeromski-1',
    title: 'Syzyfowe prace',
    source: 'Stefan Żeromski',
    text: 'Uczniowie w szkole uczyli się wśród surowych zasad i obcych nakazów. Mimo to w ich myślach rosła potrzeba własnego języka i własnej pamięci. Marzyli o wolności, czytając potajemnie książki i rozmawiając szeptem. Każda mała odwaga była dla nich wielkim zwycięstwem.',
  },
  {
    id: 'naalkowska-1',
    title: 'Granica',
    source: 'Zofia Nałkowska',
    text: 'Ludzie mówią o winie i niewinności, lecz granica między nimi bywa nieostra. Bohater chce żyć uczciwie, a jednocześnie pragnie pozycji i uznania. Wybory, które wydaje się drobne, zmieniają całe życie. Historia pokazuje, że konsekwencje rosną ciszej, niż się spodziewamy.',
  },
  {
    id: 'gombrowicz-1',
    title: 'Ferdydurke',
    source: 'Witold Gombrowicz',
    text: 'Bohater nagle zostaje wtłoczony z powrotem w szkolną formę. Musi znosić miny, gęby i sztuczne role narzucane przez innych. Chce być sobą, lecz otoczenie wciąż go kształtuje. Komizm miesza się z niepokojem, a walka o dojrzałość staje się coraz trudniejsza.',
  },
  {
    id: 'boy-1',
    title: 'Słówka',
    source: 'Tadeusz Boy-Żeleński',
    text: 'W dawnej Warszawie ludzie lubili dowcip i szybką rozmowę. Na salonach śmiano się z mód, urzędów i wielkich gestów. Autor chwytał te sceny lekkim piórem, by pokazać, jak język potrafi rozbroić powagę. Za żartem kryła się często bystra obserwacja świata.',
  },
  {
    id: 'bajka-kot-1',
    title: 'Kot w butach',
    source: 'Bajka ludowa',
    text: 'Biedny chłopiec dostał w spadku tylko kota. Kot jednak był sprytny i poprosił o buty oraz worek. Dzięki pomysłom zdobył dla pana zamek i szacunek króla. Okazało się, że mądrość i odwaga potrafią zmienić los nawet tego, kto zaczyna z niczym.',
  },
  {
    id: 'bajka-krol-2',
    title: 'Calineczka',
    source: 'Bajka ludowa',
    text: 'Calineczka była malutka jak kciuk i żyła wśród kwiatów. Porwana przez ropuchę, musiała szukać drogi do domu przez łąki i strumienie. Spotykała życzliwe istoty i groźne stworzenia. W końcu odnalazła krainę, gdzie mogła być wolna i szczęśliwa wśród skrzydlatych przyjaciół.',
  },
  {
    id: 'leśmian-1',
    title: 'Ballada',
    source: 'Bolesław Leśmian',
    text: 'W lesie działo się coś dziwnego i cichego zarazem. Drzewa szeptały słowa, których ludzie zwykle nie słyszą. Bohater szedł wąską ścieżką, niesiony ciekawością i lekkim lękiem. Każdy krok otwierał nową zagadkę, a świat baśni mieszał się z codziennością coraz mocniej.',
  },
  {
    id: 'galczynski-1',
    title: 'Zaczarowana dorożka',
    source: 'Konstanty Ildefons Gałczyński',
    text: 'Nocą przez miasto jechała zaczarowana dorożka. Koła stukały lekko po brukowanych ulicach, a latarnie migotały jak małe gwiazdy. Poeta patrzył na ten widok z uśmiechem, bo zwykła rzeczywistość nagle stała się baśnią. Wystarczyła odrobina wyobraźni, by świat zabłysnął inaczej.',
  },
  {
    id: 'trylogia-1',
    title: 'Ogniem i mieczem',
    source: 'Henryk Sienkiewicz',
    text: 'Na kresach Rzeczypospolitej żyli ludzie dzielni i hardzi. Między wojną a spokojem szukali miłości, wierności i honoru. Skrzetuski jechał przez step, myśląc o obowiązku i o dziewczynie, którą pragnął chronić. Historia wielkich starć mieszała się tu z osobistymi losami bohaterów.',
  },
  {
    id: 'bajka-pinokio',
    title: 'O kłamczuchu',
    source: 'Bajka współczesna (ludowa)',
    text: 'Pewien chłopiec lubił wymyślać historie zamiast mówić prawdę. Im częściej kłamał, tym trudniej było mu wrócić do zwykłych słów. Dopiero gdy stracił zaufanie przyjaciół, zrozumiał wartość szczerości. Od tej pory starał się mówić prosto, nawet gdy prawda bywała niewygodna.',
  },
  {
    id: 'tokarczuk-1',
    title: 'Prawiek i inne czasy',
    source: 'Olga Tokarczuk',
    text: 'W małej wsi czas płynął inaczej niż w wielkim świecie. Ludzie rodzili się, pracowali i odchodzili, a historie przechodziły z pokolenia na pokolenie. Każdy dom krył własne tajemnice. Autorka pokazuje, że zwyczajne życie potrafi być pełne snów, znaków i głębokiego sensu.',
  },
  {
    id: 'kapuscinski-1',
    title: 'Podróże',
    source: 'Ryszard Kapuściński',
    text: 'Reporter jechał przez obce kraje, słuchając ludzi i patrząc uważnie. Wiedza rodziła się nie z map, lecz z rozmów przy stole i w tłumie. Każda granica zmieniała język i rytm dnia. Podróż uczyła pokory wobec świata, który zawsze jest bogatszy niż nasze wyobrażenia.',
  },
  {
    id: 'bajka-rycerz',
    title: 'O odważnym rycerzu',
    source: 'Bajka ludowa',
    text: 'Młody rycerz wyruszył, by odnaleźć zaginiony skarb królestwa. Po drodze pomagał podróżnym i nie unikał trudnych prób. Smok strzegł wejścia do jaskini, lecz rycerz zwyciężył odwagą i rozumem. Gdy wrócił z skarbem, oddał go ludziom, bo prawdziwym bogactwem okazała się sprawiedliwość.',
  },
  {
    id: 'norwid-1',
    title: 'Fortepian Szopena',
    source: 'Cyprian Kamil Norwid',
    text: 'Artysta słyszał w muzyce echo ojczyzny i ludzkiego cierpienia. Dźwięki fortepianu niosły pamięć o domu, walce i nadziei. Poeta wiedział, że sztuka potrafi przetrwać dłużej niż mur i miecz. Dlatego słowa i melodie stawały się świadectwem czasu, którego nie wolno zapomnieć.',
  },
  {
    id: 'bajka-zima',
    title: 'O dwunastu miesiącach',
    source: 'Bajka ludowa',
    text: 'Dziewczyna poszła zimą do lasu szukać fiołków na rozkaz złej macochy. Spotkała dwunastu braci, którzy rządzili miesiącami roku. Dzięki ich pomocy znalazła kwiaty wśród śniegu. Dobroć została nagrodzona, a pycha i zawiść nie przyniosły macochie żadnego szczęścia ani spokojnego snu.',
  },
]

export function pickPassage(excludeIds: string[] = []): Passage {
  const available = PASSAGES.filter((p) => !excludeIds.includes(p.id))
  const pool = available.length > 0 ? available : PASSAGES
  return pool[Math.floor(Math.random() * pool.length)]!
}
