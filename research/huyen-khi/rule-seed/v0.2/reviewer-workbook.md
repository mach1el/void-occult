# Huyền Khí Expert Review Workbook V0.2

> Generated from validated V0.2 data. Candidate evidence is not an approved doctrinal answer and does not authorize evaluation, scoring, or production use.

## Tử Vi candidate passage and fixture (HK-BATCH-V02-A)

- Topics: major-star-tu-vi, brightness-states
- Required roles: source-reviewer, school-expert
- Required school profiles: shared
- Open questions:
  - Does the physical scan confirm the searchable transcription passage?
  - Can brightness and transformation polarity be separated, or must they remain a bundled condition?
  - Is capacity-strengthen moderate an acceptable symbolic candidate mapping?

### Tử Vi Miếu/Vượng đi cùng hóa cát — candidate transcription (HK-FIX-001-MAJOR-MIEU-SUPPORT)

- Category: major-star-brightness
- School: shared
- Maturity: research-ready
- Research question: Does the located Tử Vi passage support a conditional symbolic capacity-strengthening rule when brightness is Miếu/Vượng and the transformation context is auspicious?
- Candidate sources: HK-SRC-CLASSIC-TRANSCRIPTION-001
- Candidate rules: HK-RULE-V02-MAJOR-001

#### Canonical input facts

```json
{
  "majorStar": {
    "canonicalName": "Tử Vi",
    "brightnessState": "miếu-or-vượng"
  },
  "transformationContext": {
    "polarity": "auspicious"
  },
  "notes": "Synthetic canonical facts only; no personal birth data. This scenario deliberately preserves the bundled conditions found in the candidate passage."
}
```

#### Candidate evidence

**HK-EXT-V02-MAJOR-TU-VI-001**
- Source: HK-SRC-CLASSIC-TRANSCRIPTION-001
- Locator: 卷一 · 諸星問答論 / 問紫微所主若何？
- Verification: candidate-located
- Excerpt: 俱看在廟旺之鄉否，有何吉凶之守照。如廟旺化吉甚妙，陷又化凶甚凶。
- Paraphrase: The passage treats Tử Vi according to brightness state together with auspicious or inauspicious transformation and surrounding context; it does not independently define an ApexVoid Huyền Khí dimension or magnitude.
- Ambiguities:
  - The transcription has not been cross-checked against HK-SRC-CLASSIC-001.
  - Brightness, transformation polarity, and supporting context are bundled in the same passage.
- Limitations:
  - Candidate evidence only; not witness-verified or source-reviewed.
  - Cannot authorize an effective rule, numeric coefficient, evaluator, or production interpretation.

#### Candidate rule records

```json
{
  "ruleId": "HK-RULE-V02-MAJOR-001",
  "version": "0.2.0",
  "status": "draft",
  "schoolProfile": "shared",
  "specificity": "exact-star-state",
  "subject": {
    "kind": "major-star",
    "id": "Tử Vi"
  },
  "conditions": [
    {
      "type": "brightness",
      "value": "miếu-or-vượng"
    },
    {
      "type": "transformation-polarity",
      "value": "auspicious"
    }
  ],
  "effects": [
    {
      "dimension": "capacity",
      "operation": "strengthen",
      "magnitude": "moderate"
    }
  ],
  "stackingGroup": "major-star-state",
  "suppressesRuleIds": [],
  "sourceIds": [
    "HK-SRC-CLASSIC-TRANSCRIPTION-001"
  ],
  "limitations": [
    "Candidate transcription only; not cross-checked against the physical-scan witness.",
    "The source passage combines brightness, transformation polarity, and supporting context, so the isolated dimension mapping remains provisional.",
    "No numeric coefficient, evaluator behavior, or production effect is authorized."
  ]
}
```

#### Review questions

- Does the physical witness match the transcription exactly enough for doctrinal use?
- Is the effect conditional on both Miếu/Vượng and hóa cát rather than brightness alone?
- Is capacity the correct ApexVoid symbolic dimension, or should the candidate mapping be rejected?
- Should the candidate remain shared or be split into school-specific interpretations?

#### Reviewer decision template

```yaml
reviewerId: ""
role: source-reviewer | school-expert | adjudicator
schoolProfile: shared
decision: reviewed | approved | disputed
rationale: ""
reviewedAt: YYYY-MM-DDTHH:mm:ssZ
sourceIds: []
claimIds: []
expectedEffectiveRuleIds: []
forbiddenRuleIds: []
```

> Append reviews with `npm run research:huyen-khi:review-rule-seed-fixture-v02 -- --fixture <id> ...`. The CLI validates and atomically appends to the V0.2 ledger; never edit derived approval status by hand.
