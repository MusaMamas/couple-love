export type Question = {
  id: string;             // uniikki, mieluiten aiheen etuliitteellä
  text: string;
  type: "likert5";        // MVP: käytetään asteikkoa 1..5
  topic: "values" | "daily" | "finance" | "fun";
  weight?: number;        // oletuksena 1
  labels?: [string, string]; // ääripäiden nimet
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
];

export default testsCatalog;
