/**
 * Current party leaders with vote share from Folketingsvalget 2022
 * Leaders updated to reflect current (2025) party leadership
 * Images from Wikimedia Commons (CC BY licensed)
 */

export interface PartyLeader {
  partyLetter: string;
  partyName: string;
  leaderName: string;
  imageUrl: string;
  percentage: number; // Vote share from FV2022
}

// Folketingsvalget 2022 results (official percentages)
// Only including parties that got seats (above 2% threshold)
export const partyLeaders: PartyLeader[] = [
  {
    partyLetter: "A",
    partyName: "Socialdemokratiet",
    leaderName: "Mette Frederiksen",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Mette_Frederiksen%2C_2022-12-15_%2805%29.jpg/640px-Mette_Frederiksen%2C_2022-12-15_%2805%29.jpg",
    percentage: 27.5,
  },
  {
    partyLetter: "V",
    partyName: "Venstre",
    leaderName: "Troels Lund Poulsen",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Troels_Lund_Poulsen_in_2024_%28cropped%29.jpg/500px-Troels_Lund_Poulsen_in_2024_%28cropped%29.jpg",
    percentage: 13.3,
  },
  {
    partyLetter: "M",
    partyName: "Moderaterne",
    leaderName: "Lars Løkke Rasmussen",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Folkemodet_Allinge_Moderaterne_Lars_Lokke_Rasmussen_in_2023_-_%28cropped%29.jpg/500px-Folkemodet_Allinge_Moderaterne_Lars_Lokke_Rasmussen_in_2023_-_%28cropped%29.jpg",
    percentage: 9.3,
  },
  {
    partyLetter: "F",
    partyName: "SF – Socialistisk Folkeparti",
    leaderName: "Pia Olsen Dyhr",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Pia_Olsen_Dyhr_OKT_2018_Foto_William_Vest-Lillesoe_CROP.jpg/500px-Pia_Olsen_Dyhr_OKT_2018_Foto_William_Vest-Lillesoe_CROP.jpg",
    percentage: 8.3,
  },
  {
    partyLetter: "Æ",
    partyName: "Danmarksdemokraterne",
    leaderName: "Inger Støjberg",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/20181204_Inger_Stojberg_Folketinget_Christiansborg_0113_%2845522360014%29.jpg/500px-20181204_Inger_Stojberg_Folketinget_Christiansborg_0113_%2845522360014%29.jpg",
    percentage: 8.1,
  },
  {
    partyLetter: "I",
    partyName: "Liberal Alliance",
    leaderName: "Alex Vanopslagh",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/20190614_Folkemodet_Bornholm_Alex_Vanopslagh_0023_%2848068924741%29_%28cropped%29.jpg/500px-20190614_Folkemodet_Bornholm_Alex_Vanopslagh_0023_%2848068924741%29_%28cropped%29.jpg",
    percentage: 7.9,
  },
  {
    partyLetter: "C",
    partyName: "Det Konservative Folkeparti",
    leaderName: "Mona Juul",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Mona_Juul_2025_%28cropped%29.jpg/500px-Mona_Juul_2025_%28cropped%29.jpg",
    percentage: 5.5,
  },
  {
    partyLetter: "Ø",
    partyName: "Enhedslisten",
    leaderName: "Pelle Dragsted",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Pelle_Dragsted%2C_20240614_Folkem%C3%B8det_%2853791445108%29_%28cropped%29.jpg/500px-Pelle_Dragsted%2C_20240614_Folkem%C3%B8det_%2853791445108%29_%28cropped%29.jpg",
    percentage: 5.1,
  },
  {
    partyLetter: "B",
    partyName: "Radikale Venstre",
    leaderName: "Martin Lidegaard",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Martin_Lidegaard%2C_2014_%28cropped%29.jpg/500px-Martin_Lidegaard%2C_2014_%28cropped%29.jpg",
    percentage: 3.8,
  },
  {
    partyLetter: "H",
    partyName: "Borgernes Parti",
    leaderName: "Lars Boje Mathiesen",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Lars_Boje_Mathiesen_-_Nye_Borgerlige.jpg/500px-Lars_Boje_Mathiesen_-_Nye_Borgerlige.jpg",
    percentage: 3.7,
  },
  {
    partyLetter: "Å",
    partyName: "Alternativet",
    leaderName: "Franciska Rosenkilde",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/20230616_Folkemodet_Cirkuspladsen_Alternativet_Franciska_Rosenkilde_%2852987806916%29_%28cropped%29.jpg/500px-20230616_Folkemodet_Cirkuspladsen_Alternativet_Franciska_Rosenkilde_%2852987806916%29_%28cropped%29.jpg",
    percentage: 3.3,
  },
  {
    partyLetter: "O",
    partyName: "Dansk Folkeparti",
    leaderName: "Morten Messerschmidt",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Morten_Messerschmidt%2C_portr%C3%A6t_2023.jpg/640px-Morten_Messerschmidt%2C_portr%C3%A6t_2023.jpg",
    percentage: 2.6,
  },
];

/**
 * Select a random party leader weighted by their vote percentage
 */
export function selectRandomLeader(): PartyLeader {
  const totalPercentage = partyLeaders.reduce((sum, p) => sum + p.percentage, 0);
  const random = Math.random() * totalPercentage;

  let cumulative = 0;
  for (const leader of partyLeaders) {
    cumulative += leader.percentage;
    if (random <= cumulative) {
      return leader;
    }
  }

  // Fallback (should never happen)
  return partyLeaders[0];
}
