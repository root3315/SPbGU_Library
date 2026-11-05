/* Каталог библиотеки. Сведения взяты с титулов и оглавлений присланных сканов.
   Число страниц идёт по оглавлению. Если год или объём на скане не видны, поля нет.
   scans — сколько страниц издания лежит в scans/<id>/, spbu — издание университета */
export const SECTIONS = {
  law: 'Право',
  soc: 'Экономика и общество',
  tech: 'Статистика и цифровые технологии',
  hist: 'История',
  lit: 'Литература и язык',
};

export const LANGUAGES = {
  ru: 'Русский',
  uz: 'Узбекский',
  en: 'Английский',
};

const ZIYADULLAEV = 'Махмуджон Джуракулович Зиядуллаев';

const RAW_BOOKS = [
  { id: 'statistik-kuzatuvlar', title: 'Statistik kuzatuvlarni raqamli texnologiyalar asosida tashkil qilish jarayonlarini takomillashtirish', author: 'I. I. Abdusalomova', fullAuthor: 'Abdusalomova Istoraxon Ilhom qizi', year: 2025, section: 'tech', lang: 'uz', scans: 2, pages: 159, about: 'Монография. Ташкент, «Ilm-Ziyo-Zakovat».' },
  { id: 'notarys-diary', title: 'Notary’s Diary', author: 'Нотариальная палата Узбекистана', year: 2023, section: 'law', lang: 'en', scans: 8, pages: 297, image: 'covers/notarys-diary.jpg', color: '#e8e8ef', about: 'Истории из практики нотариусов. Ташкент.' },
  { id: 'ramayana', title: 'Ramayana', author: 'C. Rajagopalachari', year: 2001, section: 'lit', lang: 'en', scans: 3, image: 'covers/ramayana.jpg', color: '#e6b422', about: 'Рамаяна в пересказе Ч. Раджагопалачари. Мумбаи, Bharatiya Vidya Bhavan.' },
  { id: 'mehnat-tendensiyalar', title: 'Mehnat munosabatlarini huquqiy tartibga solishda yangi tendensiyalar: milliy va xorijiy tajriba', author: 'Ташкентский юридический университет', year: 2022, section: 'law', lang: 'uz', scans: 5, pages: 179, about: 'Сборник статей международной научно-практической конференции. Ташкент.' },
  { id: 'sed', title: 'Системы электронного документооборота', author: 'А. А. Мусалиев, Б. А. Бегалов, Е. А. Мохова', section: 'tech', lang: 'ru', scans: 3, pages: 127, about: 'Издание Ташкентского государственного экономического университета.' },
  { id: 'stat-poyasneniya', title: 'Краткие методологические пояснения к статистическим показателям', author: 'Агентство статистики', fullAuthor: 'Агентство статистики при Президенте Республики Узбекистан', year: 2023, section: 'tech', lang: 'ru', scans: 1, pages: 111, image: 'covers/stat-poyasneniya.jpg', color: '#dfe8ef', about: 'Справочное издание. Ташкент.' },
  { id: 'mehr', title: 'Меҳр. Сайланма', author: 'Ашурали Боймурод', year: 2006, section: 'lit', lang: 'uz', scans: 7, pages: 235, image: 'covers/mehr.jpg', color: '#1f4f8f', about: 'Избранное. Ташкент, «Янги аср авлоди».' },
  { id: 'stat-atamalar', title: 'Статистика соҳасининг асосий тушунча ва атамалари', author: 'Б. А. Бегалов и др.', fullAuthor: 'Бегалов Холмуродов Икрамов Зиядуллаев Зияев Закиров Жураев', year: 2020, section: 'tech', lang: 'uz', scans: 2, about: 'Издание Государственного комитета по статистике. Ташкент.' },
  { id: 'raqamli-strategiya', title: 'Рақамли стратегия ва ахборот тизимлари', author: 'Б. А. Бегалов, Р. А. Дадабаева', year: 2024, section: 'tech', lang: 'uz', scans: 4, pages: 240, about: 'Учебник для магистратуры. Ташкент, «Oltin Qalam».' },
  { id: 'vatan', title: 'Ватан ва миллат қайғуси', author: 'Қудратилла Рафиқов', year: 2020, section: 'soc', lang: 'uz', scans: 2, pages: 343, image: 'covers/vatan.jpg', color: '#1f6f6a', about: 'Сборник статей на узбекском и русском языках. Ташкент, «Akademnashr».' },
  { id: 'mezhdunarodnyj-menedzhment', title: 'Введение в международный менеджмент: институциональная перспектива', author: 'Альбрехт Зёльнер', year: 2012, section: 'soc', lang: 'ru', scans: 7, pages: 484, about: 'Санкт-Петербург, «Европейский Дом».' },
  { id: 'strahovanie-2', title: 'Страхование: экономика, организация, управление. Том 2', author: 'Под ред. Г. В. Черновой', section: 'soc', lang: 'ru', scans: 10, spbu: true, pages: 661, image: 'covers/strahovanie-2.jpg', color: '#1f5a3a', about: 'Серия «Учебники экономического факультета СПбГУ». Москва, «Экономика».' },
  { id: 'muqaddas-dargoh', title: 'Муқаддас даргоҳдан таралган зиё', author: 'М. Д. Зиядуллаев', fullAuthor: ZIYADULLAEV, year: 2025, section: 'soc', lang: 'uz', scans: 1, about: 'Ташкент.' },
  { id: 'ikt-ekonomika', title: 'Информационно-коммуникационные технологии в национальной экономике', author: 'А. А. Мусалиев, Б. А. Бегалов', year: 2008, section: 'tech', lang: 'ru', scans: 3, pages: 145, image: 'covers/ikt-ekonomika.jpg', color: '#9fbf7a', about: 'Под редакцией академика С. С. Гулямова. Ташкент, «ФАН».' },
  { id: 'ikt-turizm', title: 'Информационно-коммуникационные технологии в туризме Узбекистана', author: 'Б. А. Бегалов, И. Е. Жуковская, Д. М. Ли', year: 2008, section: 'tech', lang: 'ru', scans: 1, image: 'covers/ikt-turizm.jpg', color: '#3f63a6', about: 'Под редакцией академика С. С. Гулямова. Ташкент.' },
  { id: 'peregovory-s-monstrami', title: 'Переговоры с монстрами: как договориться с сильными мира сего', author: 'Игорь Рызов', section: 'soc', lang: 'ru', scans: 3, pages: 221, about: 'Книга о сложных переговорах.' },
  { id: 'transnacionalnye-otnosheniya', title: 'Правовое регулирование транснациональных отношений', author: 'Л. Н. Галенская', section: 'law', lang: 'ru', scans: 3, spbu: true, pages: 313, about: 'Издательство Санкт-Петербургского университета.' },
  { id: 'informacionnoe-obshchestvo', title: 'Методологические аспекты влияния информационного общества на инновационное развитие экономики', author: 'Б. А. Бегалов, И. Е. Жуковская', year: 2016, section: 'tech', lang: 'ru', scans: 2, pages: 134, about: 'Монография. Ташкент.' },
  { id: 'mehnat', title: 'Меҳнат ва курашда тобланган ҳаёт онларим', author: 'Аҳмадали Асқаров', year: 2024, section: 'hist', lang: 'uz', scans: 6, pages: 512, image: 'covers/mehnat.jpg', color: '#7a2e22', about: 'Воспоминания академика-археолога. Ташкент, «Donishmand ziyosi».' },
  { id: 'russkiy-dari', title: 'Мы изучаем русский для говорящих на дари', author: 'Издательство СПбГУ', section: 'lit', lang: 'ru', scans: 3, spbu: true, pages: 298, image: 'covers/russkiy-dari.jpg', color: '#f39a2b', about: 'Учебное пособие. Элементарный уровень, А1.' },
  { id: 'nefritovyj-istochnik', title: 'Пути к нефритовому источнику', author: 'Сборник статей', fullAuthor: 'Николай Анатольевич Самойлов', year: 2025, section: 'hist', lang: 'ru', scans: 5, spbu: true, pages: 762, about: 'Сборник статей к 70-летию профессора Н. А. Самойлова. Восточный факультет СПбГУ.' },
  { id: 'pensiya-lgoty', title: 'Правовые основы государственного пенсионного обеспечения по возрасту на льготных условиях', author: 'Внебюджетный пенсионный фонд', fullAuthor: 'Исполнительный аппарат Внебюджетного пенсионного фонда при Министерстве финансов Республики Узбекистан', year: 2013, section: 'law', lang: 'ru', scans: 3, pages: 260, image: 'covers/pensiya-lgoty.jpg', color: '#1f5240', about: 'Имтиёзли шартларда ёшга доир давлат пенсия таъминотининг ҳуқуқий асослари. Сборник документов. Ташкент.' },
  { id: 'pensiya-huquqi', title: 'Пенсия таъминоти ҳуқуқи', author: 'М. Д. Зиядуллаев', fullAuthor: ZIYADULLAEV, year: 2020, section: 'law', lang: 'uz', scans: 5, pages: 160, about: 'Учебное пособие. Банковско-финансовая академия Узбекистана.' },
  { id: 'pravovedenie-2023-3', title: 'Правоведение. Т. 67, № 3', author: 'Журнал СПбГУ', year: 2023, section: 'law', lang: 'ru', scans: 1, spbu: true, image: 'covers/pravovedenie-2023-3.jpg', color: '#c81e1e', about: 'Научно-теоретический журнал, основан в 1957 году.' },
  { id: 'pravovedenie-2024-2', title: 'Правоведение. Т. 68, № 2', author: 'Журнал СПбГУ', year: 2024, section: 'law', lang: 'ru', scans: 1, spbu: true, image: 'covers/pravovedenie-2024-2.jpg', color: '#a8202e', about: 'Научно-теоретический журнал, основан в 1957 году.' },
  { id: 'statistika-texnologiyalar', title: 'Статистика фаолиятида рақамли технологиялар', author: 'Б. А. Бегалов, Ш. Г. Одилов, Ш. Ў. Джанадилов', year: 2023, section: 'tech', lang: 'uz', scans: 3, about: 'Учебное пособие. Ташкент.' },
  { id: 'psihosocialnyj-dizajn', title: 'Психосоциальный дизайн организации и субъективное благополучие сотрудника', author: 'Свенцицкий, Мальцева', year: 2023, section: 'soc', lang: 'ru', scans: 4, pages: 81, about: 'Учебно-методическое пособие. Санкт-Петербург, «Скифия-принт».' },
  { id: 'ponyat-uzbekistan', title: 'Понять Узбекистан: записки странствующих социологов', author: 'С. Борисов, Ю. Юшкова-Борисова', fullAuthor: 'Сергей Борисов, Юлия Юшкова-Борисова', year: 2026, section: 'soc', lang: 'ru', scans: 5, pages: 622, about: 'Москва.' },
  { id: 'studenty', title: 'Студенты Петровского университета', author: 'Издательство СПбГУ', year: 2022, section: 'hist', lang: 'ru', scans: 8, spbu: true, pages: 297, image: 'covers/studenty.jpg', color: '#e9e3d6', about: 'Иллюстрированное издание Санкт-Петербургского университета.' },
  { id: 'notarial-palata', title: 'Ўзбекистон Республикаси нотариал палатаси', author: 'Нотариальная палата Узбекистана', year: 2023, section: 'law', lang: 'uz', scans: 2, about: 'Издание Нотариальной палаты Республики Узбекистан.' },
  { id: 'fuqarolik-kodeksi', title: 'Ўзбекистон Республикасининг Фуқаролик кодекси', author: 'Республика Узбекистан', year: 2022, section: 'law', lang: 'uz', scans: 8, pages: 607, about: 'Гражданский кодекс с изменениями на 15 января 2022 года. Ташкент, «Yuridik adabiyotlar publish».' },
  { id: 'yoshga-doir-pensiya', title: 'Ўзбекистонда ёшга доир пенсия ва унинг ҳуқуқий асосларини такомиллаштириш', author: 'М. Д. Зиядуллаев', fullAuthor: ZIYADULLAEV, year: 2019, section: 'law', lang: 'uz', scans: 3, pages: 187, about: 'Монография. Ташкент, «Turon-Iqbol».' },
  { id: 'pensiya-tizimi', title: 'Ўзбекистонда пенсия тизимини бошқариш ва такомиллаштириш масалалари', author: 'М. Д. Зиядуллаев', fullAuthor: ZIYADULLAEV, year: 2018, section: 'law', lang: 'uz', scans: 3, pages: 165, about: 'Монография. Ташкент, «Turon-Iqbol».' },
  { id: 'instituty-razvitie', title: 'Институты и экономическое развитие: отечественный и зарубежный опыт', author: 'Под ред. М. А. Румянцева, Г. В. Борисова', year: 2013, section: 'soc', lang: 'ru', scans: 6, spbu: true, pages: 463, about: 'Учебник. Санкт-Петербургский университет. Москва, «РГ-Пресс».' },
  { id: 'pensionnoe-obespechenie', title: 'Развитие системы пенсионного обеспечения и её нормативно-правовой базы в современном Узбекистане', author: 'М. Д. Зиядуллаев', fullAuthor: ZIYADULLAEV, year: 2020, section: 'law', lang: 'ru', scans: 2, pages: 106, about: 'Монография. Ташкент, «Turon-Iqbol».' },
  { id: 'oila-kodeksi', title: 'Ўзбекистон Республикасининг Оила кодексига шарҳлар', author: 'Ассоциация судей Узбекистана', year: 2000, section: 'law', lang: 'uz', scans: 13, pages: 446, about: 'Комментарий к Семейному кодексу. Ташкент, «Адолат».' },
];

export const BOOKS = RAW_BOOKS.map((b) => ({ ...b, fullAuthor: b.fullAuthor || b.author }));
