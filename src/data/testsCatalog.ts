export type Question = {
  id: string;             // uniikki, mieluiten aiheen etuliitteellä
  text: string;
  type: "likert5" | "choice";        // MVP: käytetään asteikkoa 1..5 tai valinta
  topic: "values" | "daily" | "finance" | "fun" | "music" | "food";
  weight?: number;        // oletuksena 1
  labels?: [string, string]; // ääripäiden nimet
  options?: [string, string]; // vaihtoehdot choice-tyypille
};

export type TestDef = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
};

const likert = (t: Question["topic"], id: string, text: string): Question => ({
  id: `${t}:${id}`,
  text,
  type: "likert5",
  topic: t,
  labels: ["Ehdottomasti eri mieltä", "Täysin samaa mieltä"],
});

const choice = (
  t: Question["topic"], 
  id: string, 
  text: string, 
  options: [string, string]
): Question => ({
  id: `${t}:${id}`,
  text,
  type: "choice",
  topic: t,
  options,
});

export const testsCatalog: TestDef[] = [
  {
    id: "compat_v1",
    title: "Yhteensopivuus v1",
    description:
      "Lyhyt testi arvoista, arjesta, taloudesta ja yhteisestä vapaa-ajasta. Arviointi 1–5.",
    questions: [
      likert("values", "v1", "Elämän tavoitteemme ovat samankaltaiset."),
      likert("values", "v2", "Rehellisyys on minulle tärkeää, ja kumppanini jakaa sen."),
      likert("daily", "d1", "Meillä on samanlaiset odotukset arjen hoitamisesta."),
      likert("daily", "d2", "Uni- ja lepoaikojemme rytmit sopivat yhteen."),
      likert("finance", "f1", "Suhtaudumme samalla tavalla kulutukseen ja säästämiseen."),
      likert("finance", "f2", "Keskustelemme budjetista avoimesti."),
      likert("fun", "u1", "Meillä on samanlaiset käsitykset yhteisestä vapaa-ajasta."),
      likert("fun", "u2", "Nauramme usein yhdessä."),
    ],
  },
  {
    id: "musicians_test",
    title: "Musiikkimaku",
    description:
      "Valitse seitsemän kysymyksessä, kumpi muusikko tai bändi on sinulle läheisempi. Tulokset verrataan kumppanisi vastauksiin.",
    questions: [
      choice("music", "m1", "Kumman musiikkia kuuntelet mieluummin?", ["The Beatles", "The Rolling Stones"]),
      choice("music", "m2", "Kumpi artisti on sinulle läheisempi?", ["Ed Sheeran", "Bruno Mars"]),
      choice("music", "m3", "Kumpi genre kuvaa paremmin musiikkimakuasi?", ["Pop", "Rock"]),
      choice("music", "m4", "Kumman artistin konserttiin menisit?", ["Taylor Swift", "Ariana Grande"]),
      choice("music", "m5", "Kumpi bändi on parempi?", ["Metallica", "AC/DC"]),
      choice("music", "m6", "Kumpi rap-artisti on parempi?", ["Eminem", "Drake"]),
      choice("music", "m7", "Kumpi elektronisen musiikin artisti?", ["Daft Punk", "The Chainsmokers"]),
    ],
  },
  {
    id: "fruits_test",
    title: "Hedelmätesti",
    description:
      "Valitse seitsemän kysymyksessä, kumpi hedelmä tai marja on sinulle mieluisampi. Tulokset verrataan kumppanisi vastauksiin.",
    questions: [
      choice("food", "f1", "Kumpi hedelmä on parempi?", ["Omena", "Banaani"]),
      choice("food", "f2", "Kumpi sitrushedelmä on mieluisampi?", ["Appelsiini", "Mandariini"]),
      choice("food", "f3", "Kumpi marja on herkullisempi?", ["Mansikka", "Vadelma"]),
      choice("food", "f4", "Kumpi trooppinen hedelmä on parempi?", ["Mango", "Ananas"]),
      choice("food", "f5", "Kumpi marjaryhmä on parempi?", ["Mustikka", "Puolukka"]),
      choice("food", "f6", "Kumpi kesähedelmä?", ["Vesimeloni", "Meloni"]),
      choice("food", "f7", "Kumpi eksoottinen hedelmä?", ["Kiwi", "Passionhedelmä"]),
    ],
  },
];

export default testsCatalog;