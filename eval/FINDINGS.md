# Findings from `data/kb_train.parquet`

- Input: `data/kb_train.parquet`, the 49,412-row training split. The analysis used this split only; `data/test.parquet` was not read.
- `label_map.json` records the source priority counts before mapping, target counts after mapping, and the full queue map. The three-label priority crosswalk is `critical` and `high` → `high`; `medium` → `medium`; `low` and `very_low` → `low`.
- Queue names were kept distinct. There were 52 queue labels and no exact spelling or English/German alias duplicates after normalization.

## Ticket shares

### Type

| Type | Tickets | % of train split |
|---|---:|---:|
| Incident | 15,577 | 31.52% |
| Request | 11,146 | 22.56% |
| Missing | 10,593 | 21.44% |
| Problem | 8,112 | 16.42% |
| Change | 3,984 | 8.06% |

### Priority after crosswalk

| Priority | Tickets | % of train split |
|---|---:|---:|
| high | 19,022 | 38.50% |
| medium | 18,704 | 37.85% |
| low | 11,686 | 23.65% |

### Source priority values (before crosswalk)

| Source priority | Tickets | % of train split |
|---|---:|---:|
| medium | 18,704 | 37.85% |
| high | 17,484 | 35.38% |
| low | 10,240 | 20.72% |
| critical | 1,538 | 3.11% |
| very_low | 1,446 | 2.93% |

### Language

| Language | Tickets | % of train split |
|---|---:|---:|
| de | 26,851 | 54.34% |
| en | 22,561 | 45.66% |

### Queue

| Queue | Tickets | % of train split |
|---|---:|---:|
| Technical Support | 11,349 | 22.97% |
| Product Support | 7,165 | 14.50% |
| Customer Service | 5,888 | 11.92% |
| IT Support | 4,595 | 9.30% |
| Billing and Payments | 3,892 | 7.88% |
| Returns and Exchanges | 1,976 | 4.00% |
| Service Outages and Maintenance | 1,503 | 3.04% |
| Sales and Pre-Sales | 1,186 | 2.40% |
| Human Resources | 738 | 1.49% |
| General Inquiry | 527 | 1.07% |
| News | 317 | 0.64% |
| Pets & Animals/Pet Services | 309 | 0.63% |
| Autos & Vehicles/Sales | 295 | 0.60% |
| Pets & Animals/Veterinary Care | 295 | 0.60% |
| IT & Technology/Security Operations | 291 | 0.59% |
| Health/Mental Health | 280 | 0.57% |
| Health/Medical Services | 276 | 0.56% |
| Travel & Transportation/Land Travel | 274 | 0.55% |
| Business & Industrial/Manufacturing | 273 | 0.55% |
| Home & Garden/Home Improvement | 273 | 0.55% |
| Law & Government/Government Services | 270 | 0.55% |
| Online Communities/Forums | 270 | 0.55% |
| Shopping/E-commerce | 270 | 0.55% |
| Food & Drink/Groceries | 264 | 0.53% |
| Jobs & Education/Online Courses | 264 | 0.53% |
| Finance/Investments | 262 | 0.53% |
| Books & Literature/Non-Fiction | 256 | 0.52% |
| Online Communities/Social Networks | 256 | 0.52% |
| Hobbies & Leisure/Collectibles | 255 | 0.52% |
| Science/Research | 255 | 0.52% |
| Science/Environmental Science | 253 | 0.51% |
| Beauty & Fitness/Cosmetics | 252 | 0.51% |
| Games | 250 | 0.51% |
| Finance/Personal Finance | 248 | 0.50% |
| Food & Drink/Restaurants | 248 | 0.50% |
| Hobbies & Leisure/Crafts | 247 | 0.50% |
| IT & Technology/Hardware Support | 246 | 0.50% |
| IT & Technology/Network Infrastructure | 244 | 0.49% |
| Arts & Entertainment/Music | 239 | 0.48% |
| Travel & Transportation/Air Travel | 238 | 0.48% |
| Law & Government/Legal Advice | 234 | 0.47% |
| Beauty & Fitness/Fitness Training | 233 | 0.47% |
| Books & Literature/Fiction | 233 | 0.47% |
| Jobs & Education/Recruitment | 232 | 0.47% |
| Shopping/Retail Stores | 230 | 0.47% |
| Autos & Vehicles/Maintenance | 229 | 0.46% |
| People & Society/Culture & Society | 227 | 0.46% |
| Home & Garden/Landscaping | 211 | 0.43% |
| Arts & Entertainment/Movies | 209 | 0.42% |
| IT & Technology/Software Development | 209 | 0.42% |
| Sports | 192 | 0.39% |
| Real Estate | 184 | 0.37% |

## Data checks

- Empty or whitespace-only subjects: 4,293/49,412 (8.69%).
- High-priority Incidents after the crosswalk: 6,765/49,412 (13.69%).

## Possible label errors to review

These examples appear materially under-prioritized from the ticket text. They are review candidates, not verified ground truth.

- `TKT-00076` — source priority `low`, queue `Returns and Exchanges`: reports an unresolved data breach and suspected inadequate encryption; this warrants high-priority security handling.
- `TKT-00086` — source priority `low`, queue `Product Support`: reports an unauthorized access attempt against hospital systems tied to software vulnerabilities.
- `TKT-01111` — source priority `low`, queue `Service Outages and Maintenance`: reports an active service outage affecting several products, with traffic problems continuing after a restart.
- `TKT-01112` — source priority `low`, queue `Returns and Exchanges`: reports a potential hospital-system data breach putting clinical records and patient data at risk.
- `TKT-01289` — source priority `low`, queue `Technical Support`: reports persistent data loss in a hospital network and requests urgent assistance.
