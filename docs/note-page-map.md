# Reference note: page map

Source: `data/glaucoma-note.pdf`, 10 pages. Text extracted with pdfjs by `pnpm prep:note`.

## Pages
- Footer on every page: `Glaucoma and angle closure · Eye Academy reference note N`. N equals the page index on all 10 pages.
- Header on every page: `eyeacademy Take-home reference note`. The prep script removes it.

| Page | Content | Role |
|---|---|---|
| 1 | Aqueous, IOP, measuring IOP | Distractor |
| 2 | Van Herick, gonioscopy, start of PAC terminology | Background |
| 3 | PAC terms, risk factors, mechanisms; APAC section starts (symptoms) | Main |
| 4 | APAC signs, triggers (dim light, chlorphenamine), differential table starts | Main |
| 5 | Differential table, managing an acute attack: drops, pilocarpine, fellow eye, acetazolamide (starts) | Main |
| 6 | Acetazolamide cautions (sulfonamide allergy), hyperosmotics, if the IOP does not fall, LPI both eyes, follow-up | Main |
| 7 | Laser iridotomy, plateau iris | Distractor |
| 8 | Plateau iris (cont.), secondary angle closure | Distractor |
| 9 | POAG, OHT, medicines table | Distractor |
| 10 | Medicines table (cont.), laser and surgery, sources | Distractor |

## Key points → page
| Examiner key point / follow-up idea | Page | Supporting text starts with |
|---|---|---|
| Lower the pressure; pilocarpine once pressure falls | 5 | "Pilocarpine. Pilocarpine 2% constricts the pupil" |
| Sulfonamide allergy before acetazolamide | **6** | "Check for sulfonamide allergy, kidney disease, low potassium" |
| Stop the chlorphenamine | 4 (trigger), 6 ("Any trigger drug should be stopped") | |
| Analgesia and antiemetic | 5 | "Lie the patient flat (supine)" |
| LPI to both eyes, fellow eye | 6 | "Prophylactic LPI in the fellow eye" |
| Gonioscopy and discs after the attack | 6 | "Once the eye has settled, repeat gonioscopy" |
| Why treat the left eye? | 6 | "around 40 to 50% of fellow eyes have an attack" |
| Why pilocarpine may not work at first | 5 | "The iris sphincter is often ischaemic" |
| What if the pressure does not fall? | 6 | "If the IOP does not fall" |

## Traps for citation
- "Sulfonamide" appears on pages 4, 6, 8 and 9. Only page 6 is the APAC acetazolamide check. Pages 4 and 8 are about topiramate and secondary angle closure; page 9 is the medicines table.
- The acetazolamide sentence crosses pages 5 → 6. The page 6 chunk starts with "250 mg four times a day" and does not contain the word "acetazolamide". Chunks never cross a page, so search finds this one through "sulfonamide allergy" and it is cited as page 6.
- PDF text has line breaks, hyphen splits and stray spaces before punctuation. The quote check normalises these, and nothing else.
- Tables (page 5 differential, pages 9–10 medicines) extract with columns jumbled. Prefer prose chunks; a table chunk should rarely be the cited excerpt.
