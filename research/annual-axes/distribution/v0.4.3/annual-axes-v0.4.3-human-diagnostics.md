# Annual Axes V0.4.3 — Human Diagnostics

Experimental spatial-budget path (variant **E** / production candidate).
Feature flag `ziweiAnnualAxesV043` defaults OFF. The 90/10 ratio is an
engineering policy, not a classical constant. Every number below is emitted
by the analyzer's evidence trace; no value is hand-edited.

## annual-axes-audit-full-v0.4:nam-phai:c0

### Year 2018

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.2 | guarded | -0.021296 | 0 | -0.021296 | 0.99173 | 3 | 3 | 1 |
| family | available | 50.7 | balanced | 0.019216 | 0 | 0.019216 | 0.998698 | 9 | 9 | 0 |
| wealth | available | 46.9 | guarded | -0.117126 | 0.02833 | -0.088796 | 0.943767 | 6 | 6 | 0 |
| career | available | 46.8 | guarded | -0.089429 | 0 | -0.089429 | 0.968752 | 5 | 5 | 1 |
| social | available | 50.5 | balanced | 0.01402 | 0 | 0.01402 | 0.999433 | 5 | 5 | 0 |
| romance | available | 51.9 | balanced | 0.053388 | 0 | 0.053388 | 0.972544 | 6 | 6 | 1 |

#### career — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:career:annual:mutagen:mutagen:11:Kỵ:Thiên Cơ | mutagen:11:Kỵ:Thiên Cơ | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.3 | 0.3 | 0 | 0.3 | 0.24 |
| ann-axis:career:natal-activated:mutagen:mutagen:5:Khoa:Thiên Lương | mutagen:5:Khoa:Thiên Lương | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.3 | 0.3 | 0.225 | 0 | 0.12 |
| ann-axis:career:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 0.731791 | 0.818394 | 1.750089 |
| ann-axis:career:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |
| ann-axis:career:natal-activated:star:natal-star:5:Thiên Lương | natal-star:5:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.875 | 2.375 | 4.5 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 1.67054 | 0.503814 | 0.779423 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:career:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | tp4c-trine | direct-wins-collision |
| ann-axis:career:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | direct-head-focus | signed-duplicate-same-physical-fact |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:11:Kỵ:Thiên Cơ | mutagen:11:Kỵ:Thiên Cơ | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:health:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.240645 | 2.50581 | 4.375223 |
| ann-axis:health:natal-activated:star:natal-star:6:Thất Sát | natal-star:6:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.525 | 9.35 | 1 | 1 | 0.75 | 0.75 | 4.21875 | 4.14375 | 7.0125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | tp4c-trine | direct-wins-collision |

### Year 2019

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.8 | guarded | -0.004976 | 0 | -0.004976 | 0.989486 | 2 | 2 | 0 |
| family | available | 53.2 | balanced | 0.040597 | 0.047997 | 0.088594 | 0.999475 | 8 | 8 | 2 |
| wealth | available | 51.9 | balanced | 0.055937 | 0 | 0.055937 | 0.938216 | 5 | 5 | 0 |
| career | available | 48.8 | guarded | -0.084149 | 0.051675 | -0.032474 | 0.985275 | 6 | 6 | 0 |
| social | available | 50.5 | balanced | 0.01402 | 0 | 0.01402 | 0.999433 | 5 | 5 | 1 |
| romance | available | 51.9 | balanced | 0.055337 | 0 | 0.055337 | 0.952516 | 3 | 3 | 1 |

#### family — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0 | 0.75 | 0.424264 |
| ann-axis:family:annual:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 0.151554 | 0.108253 | 0.75 |
| ann-axis:family:annual:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 0.7071067811865475 | 0.5773502691896258 | 0.53033 | 0.433013 | 0.53033 | 0 | 0.303109 |
| ann-axis:family:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 10 | 1.7 | 4.95 | 1 | 0.7071067811865475 | 0.525 | 0.371231 | 5.25 | 0.8925 | 1.837594 |
| ann-axis:family:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 9.375 | 2.125 | 6.6 | 0.7071067811865475 | 1 | 0.371231 | 0.525 | 3.480291 | 0.788866 | 3.465 |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5 | 5.95 | 9.9 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.866025 | 1.03057 | 1.71473 |
| ann-axis:family:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 3.354338 | 2.386485 | 6.3 |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.125 | 3.825 | 7.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 6.09375 | 2.86875 | 4.083542 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | tp4c-opposite | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | tp4c-trine | direct-wins-collision |

#### family — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0 | 0.75 | 0.424264 |
| ann-axis:family:annual:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 0.151554 | 0.108253 | 0.75 |
| ann-axis:family:annual:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 0.7071067811865475 | 0.5773502691896258 | 0.53033 | 0.433013 | 0.53033 | 0 | 0.303109 |
| ann-axis:family:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 10 | 1.7 | 4.95 | 1 | 0.7071067811865475 | 0.525 | 0.371231 | 5.25 | 0.8925 | 1.837594 |
| ann-axis:family:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 9.375 | 2.125 | 6.6 | 0.7071067811865475 | 1 | 0.371231 | 0.525 | 3.480291 | 0.788866 | 3.465 |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5 | 5.95 | 9.9 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.866025 | 1.03057 | 1.71473 |
| ann-axis:family:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 3.354338 | 2.386485 | 6.3 |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.125 | 3.825 | 7.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 6.09375 | 2.86875 | 4.083542 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | tp4c-opposite | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | tp4c-trine | direct-wins-collision |

### Year 2020

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.8 | guarded | -0.004976 | 0 | -0.004976 | 0.989486 | 2 | 2 | 1 |
| family | available | 51.7 | balanced | 0.04637 | 0 | 0.04637 | 0.998397 | 8 | 8 | 1 |
| wealth | available | 51.2 | balanced | 0.036525 | 0 | 0.036525 | 0.893899 | 3 | 3 | 0 |
| career | available | 50.4 | balanced | 0.010464 | 0 | 0.010464 | 0.987123 | 6 | 6 | 1 |
| social | available | 50.6 | balanced | 0.017046 | 0 | 0.017046 | 0.999088 | 5 | 5 | 0 |
| romance | available | 52.2 | balanced | 0.061037 | 0 | 0.061037 | 0.975593 | 7 | 7 | 2 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:annual:mutagen:mutagen:1:Khoa:Thái Âm | mutagen:1:Khoa:Thái Âm | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 0.159099 | 0 | 0.069282 |
| ann-axis:romance:annual:mutagen:mutagen:8:Quyền:Vũ Khúc | mutagen:8:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 0.060622 | 0.043301 | 0.212132 |
| ann-axis:romance:annual:mutagen:mutagen:9:Lộc:Thái Dương | mutagen:9:Lộc:Thái Dương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:romance:natal-activated:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:romance:natal-activated:star:natal-star:1:Thái Âm | natal-star:1:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.788083 | 0.818394 | 0.857365 |
| ann-axis:romance:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.125 | 3.825 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 1.723573 | 0.811405 | 1.633417 |
| ann-axis:romance:natal-activated:star:natal-star:9:Thái Dương | natal-star:9:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 1 | 1 | 0.75 | 0.75 | 3.4125 | 3.54375 | 5.775 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thái Âm | natal-star:1:Thái Âm | tp4c-trine | direct-wins-collision |
| ann-axis:romance:natal-activated:star:natal-star:9:Thái Dương | natal-star:9:Thái Dương | tp4c-trine | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.240645 | 2.50581 | 4.375223 |
| ann-axis:health:natal-activated:star:natal-star:6:Thất Sát | natal-star:6:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.525 | 9.35 | 1 | 1 | 0.75 | 0.75 | 4.21875 | 4.14375 | 7.0125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | tp4c-opposite | direct-wins-collision |

### Year 2021

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.8 | guarded | -0.004976 | 0 | -0.004976 | 0.989486 | 2 | 2 | 0 |
| family | available | 51 | balanced | 0.026567 | 0 | 0.026567 | 0.998576 | 9 | 9 | 0 |
| wealth | available | 52.7 | balanced | 0.082446 | 0 | 0.082446 | 0.891098 | 5 | 5 | 2 |
| career | available | 50.6 | balanced | 0.016442 | 0 | 0.016442 | 0.989562 | 7 | 7 | 3 |
| social | available | 50.6 | balanced | 0.017046 | 0 | 0.017046 | 0.999088 | 5 | 5 | 2 |
| romance | available | 51.1 | balanced | 0.029642 | 0 | 0.029642 | 0.976674 | 6 | 6 | 0 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Khoa:Văn Khúc | mutagen:2:Khoa:Văn Khúc | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.159099 | 0 | 0.084853 |
| ann-axis:wealth:annual:mutagen:mutagen:3:Lộc:Cự Môn | mutagen:3:Lộc:Cự Môn | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.3 | 0.3 | 0 | 0.3 | 0.24 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.620486 | 1.718269 | 1.633417 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.3 | 2.85 | 4.5 | 1 | 1 | 0.75 | 0.75 | 4.725 | 2.1375 | 3.375 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | tp4c-trine | direct-wins-collision |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Khoa:Văn Khúc | mutagen:2:Khoa:Văn Khúc | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.159099 | 0 | 0.084853 |
| ann-axis:wealth:annual:mutagen:mutagen:3:Lộc:Cự Môn | mutagen:3:Lộc:Cự Môn | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.3 | 0.3 | 0 | 0.3 | 0.24 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.620486 | 1.718269 | 1.633417 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.3 | 2.85 | 4.5 | 1 | 1 | 0.75 | 0.75 | 4.725 | 2.1375 | 3.375 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | tp4c-trine | direct-wins-collision |

### Year 2022

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.8 | guarded | -0.004976 | 0 | -0.004976 | 0.989486 | 2 | 2 | 1 |
| family | available | 50.5 | balanced | 0.013815 | 0 | 0.013815 | 0.999756 | 12 | 12 | 3 |
| wealth | available | 51.9 | balanced | 0.055937 | 0 | 0.055937 | 0.938216 | 5 | 5 | 3 |
| career | available | 50.5 | balanced | 0.012967 | 0 | 0.012967 | 0.989238 | 8 | 8 | 0 |
| social | available | 50.6 | balanced | 0.017302 | 0 | 0.017302 | 0.99926 | 6 | 6 | 2 |
| romance | available | 51.1 | balanced | 0.030742 | 0 | 0.030742 | 0.970408 | 6 | 6 | 0 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0 | 0.3 | 0.169706 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.074246 | 0.053033 | 0.3 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 1.095522 | 0.779423 | 1.781909 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 0.620486 | 1.718269 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.3 | 2.85 | 4.5 | 1 | 1 | 0.75 | 0.75 | 4.725 | 2.1375 | 3.375 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | tp4c-trine | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.240645 | 2.50581 | 4.375223 |
| ann-axis:health:natal-activated:star:natal-star:6:Thất Sát | natal-star:6:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.525 | 9.35 | 1 | 1 | 0.75 | 0.75 | 4.21875 | 4.14375 | 7.0125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:6:Thất Sát | natal-star:6:Thất Sát | tp4c-trine | direct-wins-collision |

### Year 2023

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.8 | guarded | -0.004976 | 0 | -0.004976 | 0.989486 | 2 | 2 | 0 |
| family | available | 50.5 | balanced | 0.013648 | 0 | 0.013648 | 0.998597 | 10 | 10 | 0 |
| wealth | available | 51.4 | balanced | 0.041765 | 0 | 0.041765 | 0.948799 | 7 | 7 | 2 |
| career | available | 44.7 | guarded | -0.186197 | 0.03592 | -0.150276 | 0.977187 | 5 | 5 | 1 |
| social | available | 52.6 | balanced | 0.027032 | 0.043934 | 0.070966 | 0.999008 | 6 | 6 | 0 |
| romance | available | 51.6 | balanced | 0.045414 | 0 | 0.045414 | 0.967881 | 5 | 5 | 0 |

#### career — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:career:annual:mutagen:mutagen:3:Quyền:Cự Môn | mutagen:3:Quyền:Cự Môn | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:career:major-fortune:star:natal-star:5:Thiên Lương | natal-star:5:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | major-fortune | tp4c-opposite | tp4c | Y | Y | 7.875 | 2.375 | 4.5 | 1 | 1 | 0.24 | 0.24 | 1.89 | 0.57 | 1.08 |
| ann-axis:career:natal-activated:mutagen:mutagen:5:Khoa:Thiên Lương | mutagen:5:Khoa:Thiên Lương | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | natal-activated | tp4c-opposite | tp4c | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.24 | 0.24 | 0.18 | 0 | 0.096 |
| ann-axis:career:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.896258 | 1.002324 | 1.750089 |
| ann-axis:career:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:career:major-fortune:star:natal-star:5:Thiên Lương | natal-star:5:Thiên Lương | context-only | activation-duplicate-same-physical-fact |
| ann-axis:career:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | direct-head-focus | signed-duplicate-same-physical-fact |
| ann-axis:career:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | tp4c-trine | direct-wins-collision |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Kỵ:Tham Lang | mutagen:2:Kỵ:Tham Lang | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0 | 0.3 | 0.169706 |
| ann-axis:wealth:annual:mutagen:mutagen:3:Quyền:Cự Môn | mutagen:3:Quyền:Cự Môn | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.074246 | 0.053033 | 0.3 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0 | 0.3 | 0.169706 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.074246 | 0.053033 | 0.3 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 1.095522 | 0.779423 | 1.781909 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 0.620486 | 1.718269 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.3 | 2.85 | 4.5 | 1 | 1 | 0.75 | 0.75 | 4.725 | 2.1375 | 3.375 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | tp4c-trine | direct-wins-collision |

### Year 2024

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 48.7 | guarded | -0.035294 | 0.00063 | -0.034664 | 0.991076 | 2 | 2 | 0 |
| family | available | 50.7 | balanced | 0.019142 | 0 | 0.019142 | 0.999659 | 11 | 11 | 2 |
| wealth | available | 51.9 | balanced | 0.055937 | 0 | 0.055937 | 0.938216 | 5 | 5 | 0 |
| career | available | 50.4 | balanced | 0.010464 | 0 | 0.010464 | 0.987123 | 6 | 6 | 0 |
| social | available | 50.6 | balanced | 0.016423 | 0 | 0.016423 | 0.999417 | 7 | 7 | 2 |
| romance | available | 50.5 | balanced | 0.01414 | 0 | 0.01414 | 0.974377 | 6 | 6 | 2 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0 | 0.3 | 0.169706 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.074246 | 0.053033 | 0.3 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 1.095522 | 0.779423 | 1.781909 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 0.620486 | 1.718269 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.3 | 2.85 | 4.5 | 1 | 1 | 0.75 | 0.75 | 4.725 | 2.1375 | 3.375 |

#### family — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:10:Quyền:Phá Quân | mutagen:10:Quyền:Phá Quân | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.074246 | 0.053033 | 0.212132 |
| ann-axis:family:annual:mutagen:mutagen:8:Khoa:Vũ Khúc | mutagen:8:Khoa:Vũ Khúc | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:family:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0 | 0.75 | 0.424264 |
| ann-axis:family:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 0.151554 | 0.108253 | 0.75 |
| ann-axis:family:natal-activated:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 0.7071067811865475 | 0.5773502691896258 | 0.53033 | 0.433013 | 0.53033 | 0 | 0.303109 |
| ann-axis:family:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 10 | 1.7 | 4.95 | 0.7071067811865475 | 0.5 | 0.53033 | 0.375 | 5.303301 | 0.901561 | 1.85625 |
| ann-axis:family:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 4.059494 | 0.920152 | 2.857884 |
| ann-axis:family:natal-activated:star:natal-star:1:Thái Âm | natal-star:1:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.4472135954999579 | 0.4472135954999579 | 0.33541 | 0.33541 | 1.526116 | 1.584813 | 1.66028 |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5 | 5.95 | 9.9 | 0.4082482904638631 | 0.4082482904638631 | 0.122474 | 0.122474 | 0.612372 | 0.728723 | 1.212497 |
| ann-axis:family:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5 | 1 | 0.375 | 0.75 | 2.371875 | 1.6875 | 6.3 |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.125 | 3.825 | 7.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 6.09375 | 2.86875 | 4.083542 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | direct-head-focus | signed-duplicate-same-physical-fact |
| ann-axis:family:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | direct-head-focus | signed-duplicate-same-physical-fact |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | tp4c-trine | direct-wins-collision |

### Year 2025

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 50.5 | balanced | 0.012633 | 0 | 0.012633 | 0.991478 | 3 | 3 | 0 |
| family | available | 50.5 | balanced | 0.014423 | 0 | 0.014423 | 0.999698 | 11 | 11 | 0 |
| wealth | available | 45.5 | guarded | -0.15779 | 0.028413 | -0.129377 | 0.946563 | 5 | 5 | 0 |
| career | available | 50.5 | balanced | 0.014217 | 0 | 0.014217 | 0.989532 | 9 | 9 | 2 |
| social | available | 50.6 | balanced | 0.015841 | 0 | 0.015841 | 0.999324 | 6 | 6 | 2 |
| romance | available | 50.9 | balanced | 0.026139 | 0 | 0.026139 | 0.969386 | 5 | 5 | 1 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0 | 0.3 | 0.169706 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.074246 | 0.053033 | 0.3 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 1.341735 | 0.954594 | 2.52 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0.8775 | 2.43 | 1.633417 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-opposite | tp4c | Y | Y | 6.3 | 2.85 | 4.5 | 1 | 1 | 0.6 | 0.6 | 3.78 | 1.71 | 2.7 |

#### career — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:career:annual:mutagen:mutagen:0:Khoa:Tử Vi | mutagen:0:Khoa:Tử Vi | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 0.159099 | 0 | 0.069282 |
| ann-axis:career:annual:mutagen:mutagen:11:Lộc:Thiên Cơ | mutagen:11:Lộc:Thiên Cơ | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0.3 | 0 | 0.148492 |
| ann-axis:career:annual:mutagen:mutagen:5:Quyền:Thiên Lương | mutagen:5:Quyền:Thiên Lương | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.5773502691896258 | 1 | 0.173205 | 0.3 | 0.060622 | 0.043301 | 0.3 |
| ann-axis:career:major-fortune:star:natal-star:5:Thiên Lương | natal-star:5:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | major-fortune | direct-exact-target | direct | Y | Y | 7.875 | 2.375 | 4.5 | 1 | 1 | 0.3 | 0.3 | 2.3625 | 0.7125 | 1.35 |
| ann-axis:career:natal-activated:mutagen:mutagen:5:Khoa:Thiên Lương | mutagen:5:Khoa:Thiên Lương | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.3 | 0.3 | 0.225 | 0 | 0.12 |
| ann-axis:career:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 10 | 1.7 | 4.95 | 0.7071067811865475 | 0.5 | 0.212132 | 0.15 | 2.12132 | 0.360624 | 0.7425 |
| ann-axis:career:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 1.623798 | 0.368061 | 1.143154 |
| ann-axis:career:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.5 | 0.7071067811865475 | 0.15 | 0.212132 | 0.63375 | 0.70875 | 1.750089 |
| ann-axis:career:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:career:major-fortune:star:natal-star:5:Thiên Lương | natal-star:5:Thiên Lương | context-only | activation-duplicate-same-physical-fact |
| ann-axis:career:major-fortune:star:natal-star:5:Thiên Lương | natal-star:5:Thiên Lương | tp4c-trine | direct-wins-collision |
| ann-axis:career:natal-activated:mutagen:mutagen:5:Khoa:Thiên Lương | mutagen:5:Khoa:Thiên Lương | tp4c-trine | direct-wins-collision |

### Year 2026

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.9 | guarded | -0.002754 | 0 | -0.002754 | 0.992211 | 3 | 3 | 1 |
| family | available | 52.5 | balanced | 0.039102 | 0.02874 | 0.067842 | 0.999826 | 10 | 10 | 1 |
| wealth | available | 52.5 | balanced | 0.073157 | 0 | 0.073157 | 0.949919 | 6 | 6 | 0 |
| career | available | 50.4 | balanced | 0.010421 | 0 | 0.010421 | 0.988579 | 7 | 7 | 0 |
| social | available | 50.5 | balanced | 0.012371 | 0 | 0.012371 | 0.999282 | 6 | 6 | 1 |
| romance | available | 51.1 | balanced | 0.003271 | 0.027623 | 0.030894 | 0.972247 | 5 | 5 | 0 |

#### family — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:8:Khoa:Văn Xương | mutagen:8:Khoa:Văn Xương | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:family:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0 | 0.75 | 0.424264 |
| ann-axis:family:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 0.185616 | 0.132583 | 0.75 |
| ann-axis:family:natal-activated:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | tp4c-opposite | tp4c | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.6 | 0.6 | 0.6 | 0 | 0.42 |
| ann-axis:family:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 10 | 1.7 | 4.95 | 1 | 0.5773502691896258 | 0.75 | 0.433013 | 7.5 | 1.275 | 2.143413 |
| ann-axis:family:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.500179 |
| ann-axis:family:natal-activated:star:natal-star:1:Thái Âm | natal-star:1:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.5 | 0.5 | 0.375 | 0.375 | 1.70625 | 1.771875 | 1.85625 |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5 | 5.95 | 9.9 | 0.4472135954999579 | 0.4472135954999579 | 0.134164 | 0.134164 | 0.67082 | 0.798276 | 1.328224 |
| ann-axis:family:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 2.738805 | 1.948557 | 6.3 |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-opposite | tp4c | Y | Y | 8.125 | 3.825 | 7.7 | 1 | 1 | 0.6 | 0.6 | 4.875 | 2.295 | 4.62 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | direct-head-focus | signed-duplicate-same-physical-fact |
| ann-axis:family:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | direct-head-focus | signed-duplicate-same-physical-fact |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | direct-head-focus | signed-duplicate-same-physical-fact |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:11:Quyền:Thiên Cơ | mutagen:11:Quyền:Thiên Cơ | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:health:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.240645 | 2.50581 | 4.375223 |
| ann-axis:health:natal-activated:star:natal-star:6:Thất Sát | natal-star:6:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.525 | 9.35 | 1 | 1 | 0.75 | 0.75 | 4.21875 | 4.14375 | 7.0125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:6:Thất Sát | natal-star:6:Thất Sát | tp4c-trine | direct-wins-collision |

### Year 2027

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 50.3 | balanced | 0.008713 | 0 | 0.008713 | 0.990675 | 3 | 3 | 1 |
| family | available | 51.4 | balanced | 0.039145 | 0 | 0.039145 | 0.998807 | 8 | 8 | 0 |
| wealth | available | 51.6 | balanced | 0.044481 | 0 | 0.044481 | 0.957233 | 7 | 7 | 1 |
| career | available | 50.1 | balanced | 0.003196 | 0 | 0.003196 | 0.990208 | 8 | 8 | 1 |
| social | available | 50.6 | balanced | 0.017046 | 0 | 0.017046 | 0.999088 | 5 | 5 | 0 |
| romance | available | 50.3 | balanced | 0.007491 | 0 | 0.007491 | 0.940037 | 3 | 3 | 1 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:3:Kỵ:Cự Môn | mutagen:3:Kỵ:Cự Môn | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0 | 0.212132 | 0.169706 |
| ann-axis:wealth:annual:mutagen:mutagen:7:Quyền:Thiên Đồng | mutagen:7:Quyền:Thiên Đồng | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0 | 0.3 | 0.169706 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.074246 | 0.053033 | 0.3 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 1.095522 | 0.779423 | 1.781909 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 0.620486 | 1.718269 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.3 | 2.85 | 4.5 | 1 | 1 | 0.75 | 0.75 | 4.725 | 2.1375 | 3.375 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | direct-head-focus | signed-duplicate-same-physical-fact |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | tp4c-trine | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:11:Khoa:Thiên Cơ | mutagen:11:Khoa:Thiên Cơ | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:health:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.240645 | 2.50581 | 4.375223 |
| ann-axis:health:natal-activated:star:natal-star:6:Thất Sát | natal-star:6:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.525 | 9.35 | 1 | 1 | 0.75 | 0.75 | 4.21875 | 4.14375 | 7.0125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:11:Thiên Cơ | natal-star:11:Thiên Cơ | tp4c-trine | direct-wins-collision |

### Year 2028

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.2 | guarded | -0.021296 | 0 | -0.021296 | 0.99173 | 3 | 3 | 0 |
| family | available | 50.7 | balanced | 0.018557 | 0 | 0.018557 | 0.999733 | 11 | 11 | 5 |
| wealth | available | 52.2 | balanced | 0.06345 | 0 | 0.06345 | 0.943194 | 6 | 6 | 0 |
| career | available | 50.2 | balanced | 0.006672 | 0 | 0.006672 | 0.988302 | 7 | 7 | 2 |
| social | available | 50.6 | balanced | 0.017046 | 0 | 0.017046 | 0.999088 | 5 | 5 | 1 |
| romance | available | 56.2 | balanced | 0.214242 | 0 | 0.214242 | 0.804633 | 5 | 5 | 2 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:annual:mutagen:mutagen:1:Quyền:Thái Âm | mutagen:1:Quyền:Thái Âm | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.074246 | 0.053033 | 0.212132 |
| ann-axis:romance:annual:mutagen:mutagen:9:Khoa:Hữu Bật | mutagen:9:Khoa:Hữu Bật | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:romance:natal-activated:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:romance:natal-activated:star:natal-star:1:Thái Âm | natal-star:1:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.965201 | 1.002324 | 1.050054 |
| ann-axis:romance:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.125 | 3.825 | 7.7 | 1 | 1 | 0.3 | 0.3 | 2.4375 | 1.1475 | 2.31 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:romance:natal-activated:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:romance:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | tp4c-trine | direct-wins-collision |

#### family — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:1:Quyền:Thái Âm | mutagen:1:Quyền:Thái Âm | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 0.185616 | 0.132583 | 0.75 |
| ann-axis:family:annual:mutagen:mutagen:2:Lộc:Tham Lang | mutagen:2:Lộc:Tham Lang | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0.75 | 0 | 0.371231 |
| ann-axis:family:natal-activated:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0 | 0.75 | 0.424264 |
| ann-axis:family:natal-activated:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 0.151554 | 0.108253 | 0.75 |
| ann-axis:family:natal-activated:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 0.7071067811865475 | 0.5773502691896258 | 0.53033 | 0.433013 | 0.53033 | 0 | 0.303109 |
| ann-axis:family:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 10 | 1.7 | 4.95 | 0.7071067811865475 | 0.5 | 0.53033 | 0.375 | 5.303301 | 0.901561 | 1.85625 |
| ann-axis:family:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 4.059494 | 0.920152 | 2.857884 |
| ann-axis:family:natal-activated:star:natal-star:1:Thái Âm | natal-star:1:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.4472135954999579 | 0.4472135954999579 | 0.33541 | 0.33541 | 1.526116 | 1.584813 | 1.66028 |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5 | 5.95 | 9.9 | 0.4082482904638631 | 0.4082482904638631 | 0.122474 | 0.122474 | 0.612372 | 0.728723 | 1.212497 |
| ann-axis:family:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5 | 1 | 0.375 | 0.75 | 2.371875 | 1.6875 | 6.3 |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.125 | 3.825 | 7.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 6.09375 | 2.86875 | 4.083542 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | tp4c-opposite | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | tp4c-trine | direct-wins-collision |

### Year 2029

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 50 | balanced | 0.00507 | -0.004102 | 0.000968 | 0.991646 | 2 | 2 | 0 |
| family | available | 50.7 | balanced | 0.019504 | 0 | 0.019504 | 0.999582 | 9 | 9 | 1 |
| wealth | available | 51.9 | balanced | 0.055937 | 0 | 0.055937 | 0.938216 | 5 | 5 | 0 |
| career | available | 50.4 | balanced | 0.014798 | -0.003124 | 0.011674 | 0.989877 | 6 | 6 | 0 |
| social | available | 50.6 | balanced | 0.017046 | 0 | 0.017046 | 0.999088 | 5 | 5 | 0 |
| romance | available | 51.4 | balanced | 0.038989 | 0 | 0.038989 | 0.966302 | 4 | 4 | 2 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0 | 0.3 | 0.169706 |
| ann-axis:wealth:annual:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.074246 | 0.053033 | 0.3 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 1.095522 | 0.779423 | 1.781909 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Cự Môn | natal-star:3:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 0.620486 | 1.718269 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thiên Đồng | natal-star:7:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.3 | 2.85 | 4.5 | 1 | 1 | 0.75 | 0.75 | 4.725 | 2.1375 | 3.375 |

#### family — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:2:Kỵ:Văn Khúc | mutagen:2:Kỵ:Văn Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0 | 0.75 | 0.424264 |
| ann-axis:family:annual:mutagen:mutagen:2:Quyền:Tham Lang | mutagen:2:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 0.151554 | 0.108253 | 0.75 |
| ann-axis:family:annual:mutagen:mutagen:8:Lộc:Vũ Khúc | mutagen:8:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 0.7071067811865475 | 0.5773502691896258 | 0.53033 | 0.433013 | 0.53033 | 0 | 0.303109 |
| ann-axis:family:natal-activated:star:natal-star:0:Thiên Phủ | natal-star:0:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 10 | 1.7 | 4.95 | 0.7071067811865475 | 0.5 | 0.53033 | 0.375 | 5.303301 | 0.901561 | 1.85625 |
| ann-axis:family:natal-activated:star:natal-star:0:Tử Vi | natal-star:0:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 4.059494 | 0.920152 | 2.857884 |
| ann-axis:family:natal-activated:star:natal-star:1:Thái Âm | natal-star:1:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.4472135954999579 | 0.4472135954999579 | 0.33541 | 0.33541 | 1.526116 | 1.584813 | 1.66028 |
| ann-axis:family:natal-activated:star:natal-star:10:Phá Quân | natal-star:10:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5 | 5.95 | 9.9 | 0.4082482904638631 | 0.4082482904638631 | 0.122474 | 0.122474 | 0.612372 | 0.728723 | 1.212497 |
| ann-axis:family:natal-activated:star:natal-star:2:Tham Lang | natal-star:2:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.325 | 4.5 | 8.4 | 0.5 | 1 | 0.375 | 0.75 | 2.371875 | 1.6875 | 6.3 |
| ann-axis:family:natal-activated:star:natal-star:8:Vũ Khúc | natal-star:8:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.125 | 3.825 | 7.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 6.09375 | 2.86875 | 4.083542 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:star:natal-star:1:Thái Âm | natal-star:1:Thái Âm | tp4c-trine | direct-wins-collision |

## annual-axes-audit-full-v0.4:nam-phai:c1

### Year 2018

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.2 | guarded | -0.021674 | 0 | -0.021674 | 0.990722 | 4 | 4 | 3 |
| family | available | 48.6 | guarded | -0.055873 | 0 | -0.055873 | 0.673701 | 3 | 3 | 0 |
| wealth | available | 53.5 | balanced | 0.098164 | 0 | 0.098164 | 0.990002 | 5 | 5 | 0 |
| career | available | 53.2 | balanced | 0.088233 | 0 | 0.088233 | 0.987298 | 5 | 5 | 0 |
| social | available | 49.6 | guarded | -0.009733 | 0 | -0.009733 | 0.998701 | 8 | 8 | 2 |
| romance | available | 39.6 | guarded | -0.30953 | 0 | -0.30953 | 0.939493 | 1 | 1 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:8:Thất Sát | natal-star:8:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.58125 | 7.0125 |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.5 | 6 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 3.977476 | 1.325825 | 3.181981 |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.9 | 4.05 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 1.68875 | 1.753701 | 2.143413 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | tp4c-trine | direct-wins-collision |

### Year 2019

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.2 | guarded | -0.021674 | 0 | -0.021674 | 0.990722 | 4 | 4 | 0 |
| family | available | 51.5 | balanced | 0.040757 | 0 | 0.040757 | 0.985901 | 5 | 5 | 0 |
| wealth | available | 53.6 | balanced | 0.099316 | 0 | 0.099316 | 0.991896 | 6 | 6 | 5 |
| career | available | 53.1 | balanced | 0.084781 | 0 | 0.084781 | 0.987747 | 5 | 5 | 3 |
| social | available | 49.4 | guarded | -0.01637 | 0 | -0.01637 | 0.998443 | 6 | 6 | 1 |
| romance | available | 46 | guarded | -0.112793 | 0 | -0.112793 | 0.980421 | 5 | 5 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:annual:mutagen:mutagen:7:Khoa:Thiên Lương | mutagen:7:Khoa:Thiên Lương | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.3 | 0.3 | 0.225 | 0 | 0.12 |
| ann-axis:romance:natal-activated:mutagen:mutagen:7:Lộc:Thái Dương | mutagen:7:Lộc:Thái Dương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:romance:natal-activated:star:natal-star:7:Thái Dương | natal-star:7:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.965201 | 1.002324 | 1.633417 |
| ann-axis:romance:natal-activated:star:natal-star:7:Thiên Lương | natal-star:7:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.875 | 3.375 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.844375 | 0.584567 | 0.857365 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thất Sát | natal-star:8:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.58125 | 7.0125 |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:6:Lộc:Vũ Khúc | mutagen:6:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.1 | 7.7 | 0.5 | 0.5773502691896258 | 0.15 | 0.173205 | 0.84375 | 0.765 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.2 | 1.8 | 4.725 | 0.5773502691896258 | 0.5 | 0.173205 | 0.15 | 1.593487 | 0.311769 | 0.70875 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | tp4c-trine | direct-wins-collision |

### Year 2020

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.2 | guarded | -0.021674 | 0 | -0.021674 | 0.990722 | 4 | 4 | 2 |
| family | available | 49.8 | guarded | -0.005171 | 0 | -0.005171 | 0.997249 | 5 | 5 | 2 |
| wealth | available | 55.2 | balanced | 0.146068 | 0 | 0.146068 | 0.977368 | 3 | 3 | 0 |
| career | available | 50.4 | balanced | 0.013712 | 0 | 0.013712 | 0.790936 | 2 | 2 | 0 |
| social | available | 49.5 | guarded | -0.015061 | 0 | -0.015061 | 0.997509 | 4 | 4 | 1 |
| romance | available | 49.4 | guarded | -0.019038 | 0 | -0.019038 | 0.884711 | 4 | 4 | 2 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.5 | 6 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 3.977476 | 1.325825 | 3.181981 |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.9 | 4.05 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 1.68875 | 1.753701 | 2.143413 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | tp4c-opposite | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | tp4c-opposite | direct-wins-collision |

### Year 2021

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.6 | guarded | -0.011618 | 0 | -0.011618 | 0.99248 | 5 | 5 | 0 |
| family | available | 49.7 | guarded | -0.009061 | 0 | -0.009061 | 0.99828 | 7 | 7 | 0 |
| wealth | available | 55.2 | balanced | 0.146068 | 0 | 0.146068 | 0.977368 | 3 | 3 | 3 |
| career | available | 50.4 | balanced | 0.013712 | 0 | 0.013712 | 0.790936 | 2 | 2 | 1 |
| social | available | 49.6 | guarded | -0.009898 | 0 | -0.009898 | 0.997791 | 5 | 5 | 1 |
| romance | available | 46.2 | guarded | -0.104051 | 0 | -0.104051 | 0.990637 | 7 | 7 | 1 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | tp4c-opposite | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | tp4c-opposite | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | tp4c-opposite | direct-wins-collision |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | tp4c-opposite | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | tp4c-opposite | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | tp4c-opposite | direct-wins-collision |

### Year 2022

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.3 | guarded | -0.019044 | 0 | -0.019044 | 0.993127 | 5 | 5 | 3 |
| family | available | 50.1 | balanced | 0.003676 | 0 | 0.003676 | 0.997951 | 7 | 7 | 4 |
| wealth | available | 52.6 | balanced | 0.071844 | 0 | 0.071844 | 0.992398 | 7 | 7 | 0 |
| career | available | 53.1 | balanced | 0.084781 | 0 | 0.084781 | 0.987747 | 5 | 5 | 0 |
| social | available | 49.5 | guarded | -0.015061 | 0 | -0.015061 | 0.997509 | 4 | 4 | 1 |
| romance | available | 46.7 | guarded | -0.090589 | 0 | -0.090589 | 0.989612 | 6 | 6 | 3 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:annual:mutagen:mutagen:7:Lộc:Thiên Lương | mutagen:7:Lộc:Thiên Lương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:romance:natal-activated:mutagen:mutagen:7:Lộc:Thái Dương | mutagen:7:Lộc:Thái Dương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:romance:natal-activated:star:natal-star:0:Phá Quân | natal-star:0:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.2 | 6.65 | 9 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.890955 | 1.410678 | 1.909188 |
| ann-axis:romance:natal-activated:star:natal-star:7:Thái Dương | natal-star:7:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.788083 | 0.818394 | 1.333679 |
| ann-axis:romance:natal-activated:star:natal-star:7:Thiên Lương | natal-star:7:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.875 | 3.375 | 4.95 | 0.5 | 0.5 | 0.15 | 0.15 | 0.73125 | 0.50625 | 0.7425 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thất Sát | natal-star:8:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.58125 | 7.0125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:romance:natal-activated:mutagen:mutagen:7:Lộc:Thái Dương | mutagen:7:Lộc:Thái Dương | tp4c-opposite | direct-wins-collision |
| ann-axis:romance:natal-activated:star:natal-star:7:Thái Dương | natal-star:7:Thái Dương | tp4c-opposite | direct-wins-collision |
| ann-axis:romance:natal-activated:star:natal-star:7:Thiên Lương | natal-star:7:Thiên Lương | tp4c-opposite | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:10:Quyền:Tử Vi | mutagen:10:Quyền:Tử Vi | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.5 | 6 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 3.977476 | 1.325825 | 3.181981 |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.9 | 4.05 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 1.68875 | 1.753701 | 2.143413 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | tp4c-trine | direct-wins-collision |

### Year 2023

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.1 | guarded | -0.025389 | 0 | -0.025389 | 0.979407 | 3 | 3 | 1 |
| family | available | 50 | balanced | 0.001057 | 0 | 0.001057 | 0.99777 | 6 | 6 | 0 |
| wealth | available | 53.5 | balanced | 0.098164 | 0 | 0.098164 | 0.990002 | 5 | 5 | 3 |
| career | available | 52.8 | balanced | 0.076421 | 0 | 0.076421 | 0.98745 | 5 | 5 | 1 |
| social | available | 49.3 | guarded | -0.019546 | 0 | -0.019546 | 0.99797 | 5 | 5 | 0 |
| romance | available | 46.7 | guarded | -0.090589 | 0 | -0.090589 | 0.989612 | 6 | 6 | 1 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-head-focus | direct | Y | Y | 5.625 | 5.1 | 7.7 | 0.5 | 0.5773502691896258 | 0.15 | 0.173205 | 0.84375 | 0.765 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-head-focus | direct | Y | Y | 9.2 | 1.8 | 4.725 | 0.5773502691896258 | 0.5 | 0.173205 | 0.15 | 1.593487 | 0.311769 | 0.70875 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | tp4c-trine | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:5:Quyền:Cự Môn | mutagen:5:Quyền:Cự Môn | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.5 | 6 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 3.977476 | 1.325825 | 3.181981 |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | tp4c-trine | direct-wins-collision |

### Year 2024

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.2 | guarded | -0.021674 | 0 | -0.021674 | 0.990722 | 4 | 4 | 0 |
| family | available | 49.7 | guarded | -0.009061 | 0 | -0.009061 | 0.99828 | 7 | 7 | 4 |
| wealth | available | 54.6 | balanced | 0.129771 | 0 | 0.129771 | 0.974399 | 6 | 6 | 0 |
| career | available | 53.2 | balanced | 0.089489 | 0 | 0.089489 | 0.988802 | 5 | 5 | 0 |
| social | available | 49.5 | guarded | -0.015061 | 0 | -0.015061 | 0.997509 | 4 | 4 | 1 |
| romance | available | 46.2 | guarded | -0.104051 | 0 | -0.104051 | 0.990637 | 7 | 7 | 3 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Lộc:Liêm Trinh | mutagen:2:Lộc:Liêm Trinh | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.212132 | 0 | 0.148492 |
| ann-axis:wealth:annual:mutagen:mutagen:6:Khoa:Vũ Khúc | mutagen:6:Khoa:Vũ Khúc | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.1 | 7.7 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 0.974279 | 0.883346 | 1.633417 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.2 | 1.8 | 4.725 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 1.951615 | 0.381838 | 0.818394 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

#### family — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:0:Quyền:Phá Quân | mutagen:0:Quyền:Phá Quân | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 0.185616 | 0.132583 | 0.75 |
| ann-axis:family:annual:mutagen:mutagen:7:Kỵ:Thái Dương | mutagen:7:Kỵ:Thái Dương | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0 | 0.75 | 0.424264 |
| ann-axis:family:natal-activated:mutagen:mutagen:7:Lộc:Thái Dương | mutagen:7:Lộc:Thái Dương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:family:natal-activated:star:natal-star:0:Phá Quân | natal-star:0:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.2 | 6.65 | 9 | 1 | 1 | 0.75 | 0.75 | 3.15 | 4.9875 | 6.75 |
| ann-axis:family:natal-activated:star:natal-star:7:Thái Dương | natal-star:7:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.413002 | 2.50581 | 4.083542 |
| ann-axis:family:natal-activated:star:natal-star:7:Thiên Lương | natal-star:7:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.875 | 3.375 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 2.110937 | 1.461418 | 2.143413 |
| ann-axis:family:natal-activated:star:natal-star:9:Thiên Cơ | natal-star:9:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 4.725 | 8.25 | 0.5 | 0.5 | 0.15 | 0.15 | 0.63375 | 0.70875 | 1.2375 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:mutagen:mutagen:7:Lộc:Thái Dương | mutagen:7:Lộc:Thái Dương | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:7:Thái Dương | natal-star:7:Thái Dương | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:7:Thiên Lương | natal-star:7:Thiên Lương | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:9:Thiên Cơ | natal-star:9:Thiên Cơ | tp4c-opposite | direct-wins-collision |

### Year 2025

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.5 | guarded | -0.013856 | 0 | -0.013856 | 0.991772 | 5 | 5 | 1 |
| family | available | 49.4 | guarded | -0.01601 | 0 | -0.01601 | 0.990731 | 5 | 5 | 1 |
| wealth | available | 53.5 | balanced | 0.098164 | 0 | 0.098164 | 0.990002 | 5 | 5 | 0 |
| career | available | 52.2 | balanced | 0.060394 | 0 | 0.060394 | 0.99203 | 5 | 5 | 1 |
| social | available | 49.5 | guarded | -0.012901 | 0 | -0.012901 | 0.998736 | 6 | 6 | 0 |
| romance | available | 44.6 | guarded | -0.150977 | 0 | -0.150977 | 0.982254 | 4 | 4 | 2 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:annual:mutagen:mutagen:7:Quyền:Thiên Lương | mutagen:7:Quyền:Thiên Lương | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.3 | 0.3 | 0.105 | 0.075 | 0.3 |
| ann-axis:romance:natal-activated:star:natal-star:0:Phá Quân | natal-star:0:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.2 | 6.65 | 9 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.890955 | 1.410678 | 1.909188 |
| ann-axis:romance:natal-activated:star:natal-star:7:Thiên Lương | natal-star:7:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.875 | 3.375 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.844375 | 0.584567 | 0.857365 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thất Sát | natal-star:8:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.58125 | 7.0125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:0:Phá Quân | natal-star:0:Phá Quân | tp4c-trine | direct-wins-collision |
| ann-axis:romance:natal-activated:star:natal-star:8:Thất Sát | natal-star:8:Thất Sát | tp4c-trine | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:10:Khoa:Tử Vi | mutagen:10:Khoa:Tử Vi | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.5 | 6 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 3.977476 | 1.325825 | 3.181981 |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.9 | 4.05 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 1.68875 | 1.753701 | 2.143413 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | tp4c-opposite | direct-wins-collision |

### Year 2026

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 53.6 | balanced | 0.102663 | 0 | 0.102663 | 0.963119 | 4 | 4 | 0 |
| family | available | 50 | balanced | -0.000164 | 0 | -0.000164 | 0.997759 | 7 | 7 | 0 |
| wealth | available | 53.1 | balanced | 0.086562 | 0 | 0.086562 | 0.990917 | 6 | 6 | 5 |
| career | available | 51.5 | balanced | 0.042581 | 0 | 0.042581 | 0.993422 | 5 | 5 | 3 |
| social | available | 49.5 | guarded | -0.013271 | 0 | -0.013271 | 0.998619 | 5 | 5 | 1 |
| romance | available | 50 | balanced | 0.001087 | 0 | 0.001087 | 0.890114 | 5 | 5 | 0 |

#### health — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:5:Lộc:Thiên Đồng | mutagen:5:Lộc:Thiên Đồng | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.5 | 6 | 1 | 1 | 0.75 | 0.75 | 5.625 | 1.875 | 4.5 |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.9 | 4.05 | 4.95 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.068287 | 2.147837 | 2.625134 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | direct-head-focus | signed-duplicate-same-physical-fact |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Kỵ:Liêm Trinh | mutagen:2:Kỵ:Liêm Trinh | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.3 | 0.3 | 0 | 0.3 | 0.24 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.1 | 7.7 | 0.5 | 0.5773502691896258 | 0.15 | 0.173205 | 0.84375 | 0.765 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.2 | 1.8 | 4.725 | 0.5773502691896258 | 0.5 | 0.173205 | 0.15 | 1.593487 | 0.311769 | 0.70875 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | tp4c-trine | direct-wins-collision |

### Year 2027

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.1 | guarded | -0.023991 | 0 | -0.023991 | 0.9942 | 6 | 6 | 3 |
| family | available | 49.9 | guarded | -0.003103 | 0 | -0.003103 | 0.997378 | 6 | 6 | 0 |
| wealth | available | 53.5 | balanced | 0.098164 | 0 | 0.098164 | 0.990002 | 5 | 5 | 0 |
| career | available | 52.2 | balanced | 0.059818 | 0 | 0.059818 | 0.991638 | 4 | 4 | 0 |
| social | available | 49.8 | guarded | -0.005627 | 0 | -0.005627 | 0.998612 | 6 | 6 | 2 |
| romance | available | 49.4 | guarded | -0.019038 | 0 | -0.019038 | 0.884711 | 4 | 4 | 0 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.1 | 7.7 | 0.5 | 0.5773502691896258 | 0.15 | 0.173205 | 0.84375 | 0.765 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.2 | 1.8 | 4.725 | 0.5773502691896258 | 0.5 | 0.173205 | 0.15 | 1.593487 | 0.311769 | 0.70875 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:5:Kỵ:Cự Môn | mutagen:5:Kỵ:Cự Môn | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0 | 0.75 | 0.424264 |
| ann-axis:health:annual:mutagen:mutagen:5:Quyền:Thiên Đồng | mutagen:5:Quyền:Thiên Đồng | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 0.185616 | 0.132583 | 0.75 |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.5 | 6 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 3.977476 | 1.325825 | 3.181981 |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.9 | 4.05 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 1.68875 | 1.753701 | 2.143413 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | tp4c-trine | direct-wins-collision |

### Year 2028

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.2 | guarded | -0.021674 | 0 | -0.021674 | 0.990722 | 4 | 4 | 0 |
| family | available | 49.8 | guarded | -0.005822 | 0 | -0.005822 | 0.997584 | 7 | 7 | 0 |
| wealth | available | 53.5 | balanced | 0.098164 | 0 | 0.098164 | 0.990002 | 5 | 5 | 5 |
| career | available | 52.2 | balanced | 0.060575 | 0 | 0.060575 | 0.992311 | 5 | 5 | 3 |
| social | available | 49.6 | guarded | -0.009733 | 0 | -0.009733 | 0.999028 | 8 | 8 | 1 |
| romance | available | 46.2 | guarded | -0.104902 | 0 | -0.104902 | 0.988702 | 5 | 5 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:natal-activated:mutagen:mutagen:7:Lộc:Thái Dương | mutagen:7:Lộc:Thái Dương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:romance:natal-activated:star:natal-star:0:Phá Quân | natal-star:0:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.2 | 6.65 | 9 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.890955 | 1.410678 | 1.909188 |
| ann-axis:romance:natal-activated:star:natal-star:7:Thái Dương | natal-star:7:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.788083 | 0.818394 | 1.333679 |
| ann-axis:romance:natal-activated:star:natal-star:7:Thiên Lương | natal-star:7:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.875 | 3.375 | 4.95 | 0.5 | 0.5 | 0.15 | 0.15 | 0.73125 | 0.50625 | 0.7425 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thất Sát | natal-star:8:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.58125 | 7.0125 |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.1 | 7.7 | 0.5 | 0.5773502691896258 | 0.15 | 0.173205 | 0.84375 | 0.765 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.2 | 1.8 | 4.725 | 0.5773502691896258 | 0.5 | 0.173205 | 0.15 | 1.593487 | 0.311769 | 0.70875 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | tp4c-trine | direct-wins-collision |

### Year 2029

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 49.2 | guarded | -0.021674 | 0 | -0.021674 | 0.990722 | 4 | 4 | 3 |
| family | available | 50 | balanced | -0.000329 | 0 | -0.000329 | 0.99756 | 6 | 6 | 3 |
| wealth | available | 53.6 | balanced | 0.099316 | 0 | 0.099316 | 0.991896 | 6 | 6 | 0 |
| career | available | 52.1 | balanced | 0.058128 | 0 | 0.058128 | 0.992583 | 5 | 5 | 0 |
| social | available | 49.4 | guarded | -0.01637 | 0 | -0.01637 | 0.998835 | 6 | 6 | 2 |
| romance | available | 50 | balanced | 0.001087 | 0 | 0.001087 | 0.890114 | 5 | 5 | 3 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:6:Lộc:Vũ Khúc | mutagen:6:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:6:Quyền:Vũ Khúc | mutagen:6:Quyền:Vũ Khúc | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Liêm Trinh | natal-star:2:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.625 | 5.1 | 7.7 | 0.5 | 0.5773502691896258 | 0.15 | 0.173205 | 0.84375 | 0.765 | 1.333679 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thiên Phủ | natal-star:2:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.2 | 1.8 | 4.725 | 0.5773502691896258 | 0.5 | 0.173205 | 0.15 | 1.593487 | 0.311769 | 0.70875 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Thiên Tướng | natal-star:6:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.05 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 4.971845 | 1.126951 | 3.208497 |
| ann-axis:wealth:natal-activated:star:natal-star:6:Vũ Khúc | natal-star:6:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.475 | 4.05 | 7.35 | 1 | 1 | 0.75 | 0.75 | 5.60625 | 3.0375 | 5.5125 |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:health:natal-activated:star:natal-star:10:Tử Vi | natal-star:10:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.5 | 6 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 3.977476 | 1.325825 | 3.181981 |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.075 | 5.775 |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.9 | 4.05 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.433013 | 0.433013 | 1.68875 | 1.753701 | 2.143413 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:5:Kỵ:Thiên Đồng | mutagen:5:Kỵ:Thiên Đồng | tp4c-opposite | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Cự Môn | natal-star:5:Cự Môn | tp4c-opposite | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:5:Thiên Đồng | natal-star:5:Thiên Đồng | tp4c-opposite | direct-wins-collision |

## annual-axes-audit-full-v0.4:nam-phai:c2

### Year 2018

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 51.3 | balanced | 0.034931 | 0 | 0.034931 | 0.999231 | 6 | 6 | 0 |
| family | available | 51.7 | balanced | 0.047377 | 0 | 0.047377 | 0.992969 | 6 | 6 | 0 |
| wealth | available | 46 | guarded | -0.087302 | -0.023683 | -0.110985 | 0.996406 | 10 | 10 | 3 |
| career | available | 49.4 | guarded | -0.016499 | 0 | -0.016499 | 0.997604 | 8 | 8 | 4 |
| social | available | 51.2 | balanced | 0.033828 | 0 | 0.033828 | 0.993274 | 4 | 4 | 1 |
| romance | available | 56.3 | balanced | 0.23989 | 0 | 0.23989 | 0.729055 | 2 | 2 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 2.4 | 0.6 | 0.954594 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.965201 | 1.002324 | 2.31 |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Quyền:Thái Âm | mutagen:2:Quyền:Thái Âm | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.5773502691896258 | 0.7071067811865475 | 0.173205 | 0.212132 | 0.060622 | 0.043301 | 0.212132 |
| ann-axis:wealth:annual:mutagen:mutagen:3:Lộc:Tham Lang | mutagen:3:Lộc:Tham Lang | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 0.7071067811865475 | 0.5773502691896258 | 0.212132 | 0.173205 | 0.212132 | 0 | 0.121244 |
| ann-axis:wealth:annual:mutagen:mutagen:7:Khoa:Hữu Bật | mutagen:7:Khoa:Hữu Bật | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.3 | 0.3 | 0.225 | 0 | 0.12 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:7:Kỵ:Vũ Khúc | mutagen:7:Kỵ:Vũ Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | tp4c-trine | tp4c | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.525 | 0.525 | 0 | 0.525 | 0.42 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.788083 | 0.818394 | 0.857365 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0.8775 | 2.43 | 1.633417 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.575 | 6.75 | 8.8 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.758372 | 1.431891 | 2.64 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thất Sát | natal-star:7:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.525 | 0.525 | 1.535625 | 4.606875 | 4.90875 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Vũ Khúc | natal-star:7:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 4.225 | 6.075 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.371231 | 0.371231 | 1.568451 | 2.255229 | 2.858479 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | tp4c-trine | direct-wins-collision |

### Year 2019

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 51.3 | balanced | 0.034974 | 0 | 0.034974 | 0.999318 | 7 | 7 | 3 |
| family | available | 50.3 | balanced | 0.009012 | 0 | 0.009012 | 0.979342 | 3 | 3 | 1 |
| wealth | available | 48.2 | guarded | -0.049375 | 0 | -0.049375 | 0.998244 | 9 | 9 | 1 |
| career | available | 49.2 | guarded | -0.022826 | 0 | -0.022826 | 0.997811 | 8 | 8 | 0 |
| social | available | 51.2 | balanced | 0.033828 | 0 | 0.033828 | 0.993274 | 4 | 4 | 1 |
| romance | available | 49.8 | guarded | -0.010834 | 0 | -0.010834 | 0.603072 | 1 | 1 | 0 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:3:Quyền:Tham Lang | mutagen:3:Quyền:Tham Lang | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.074246 | 0.053033 | 0.212132 |
| ann-axis:wealth:annual:mutagen:mutagen:7:Lộc:Vũ Khúc | mutagen:7:Lộc:Vũ Khúc | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.159099 | 0 | 0.084853 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:7:Kỵ:Vũ Khúc | mutagen:7:Kỵ:Vũ Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.4472135954999579 | 0.4472135954999579 | 0.134164 | 0.134164 | 0.610447 | 0.633925 | 0.664112 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.5773502691896258 | 0.5 | 0.173205 | 0.15 | 0.506625 | 1.402961 | 1.155 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.575 | 6.75 | 8.8 | 0.5 | 0.5773502691896258 | 0.15 | 0.173205 | 0.53625 | 1.0125 | 1.524205 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thất Sát | natal-star:7:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.58125 | 7.0125 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Vũ Khúc | natal-star:7:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 6.075 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.240645 | 3.221755 | 4.083542 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | tp4c-trine | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:6:Khoa:Thiên Lương | mutagen:6:Khoa:Thiên Lương | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | major-fortune | direct-exact-target | direct | Y | Y | 7.5 | 2.55 | 4.95 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 3.977476 | 1.352342 | 3.7125 |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | major-fortune | direct-exact-target | direct | Y | Y | 8.625 | 2.25 | 4.725 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 6.46875 | 1.6875 | 2.50581 |
| ann-axis:health:natal-activated:mutagen:mutagen:11:Quyền:Tử Vi | mutagen:11:Quyền:Tử Vi | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 0.185616 | 0.132583 | 0.75 |
| ann-axis:health:natal-activated:mutagen:mutagen:6:Lộc:Thiên Lương | mutagen:6:Lộc:Thiên Lương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0.75 | 0 | 0.371231 |
| ann-axis:health:natal-activated:star:natal-star:11:Phá Quân | natal-star:11:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.6 | 6.3 | 9.45 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 2.439518 | 3.34108 | 7.0875 |
| ann-axis:health:natal-activated:star:natal-star:11:Tử Vi | natal-star:11:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 7.03125 | 1.59375 | 3.500179 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | context-only | activation-duplicate-same-physical-fact |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | tp4c-trine | direct-wins-collision |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | context-only | activation-duplicate-same-physical-fact |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:mutagen:mutagen:6:Lộc:Thiên Lương | mutagen:6:Lộc:Thiên Lương | tp4c-trine | direct-wins-collision |

### Year 2020

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 50.9 | balanced | 0.025822 | 0 | 0.025822 | 0.999395 | 7 | 7 | 0 |
| family | available | 52.2 | balanced | 0.059575 | 0 | 0.059575 | 0.992436 | 6 | 6 | 1 |
| wealth | available | 47.9 | guarded | -0.058872 | 0 | -0.058872 | 0.998311 | 9 | 9 | 3 |
| career | available | 49.1 | guarded | -0.025646 | 0 | -0.025646 | 0.997045 | 7 | 7 | 4 |
| social | available | 51.8 | balanced | 0.049509 | 0 | 0.049509 | 0.99145 | 3 | 3 | 1 |
| romance | available | 57.2 | balanced | 0.266377 | 0 | 0.266377 | 0.750884 | 3 | 3 | 1 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:annual:mutagen:mutagen:8:Lộc:Thái Dương | mutagen:8:Lộc:Thái Dương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 2.4 | 0.6 | 0.954594 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.965201 | 1.002324 | 2.31 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | tp4c-trine | direct-wins-collision |

#### family — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:2:Khoa:Thái Âm | mutagen:2:Khoa:Thái Âm | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 0.397748 | 0 | 0.212132 |
| ann-axis:family:annual:mutagen:mutagen:8:Lộc:Thái Dương | mutagen:8:Lộc:Thái Dương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:family:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.5773502691896258 | 0.75 | 0.433013 | 6 | 1.5 | 1.948557 |
| ann-axis:family:natal-activated:star:natal-star:10:Thiên Cơ | natal-star:10:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.825 | 3.325 | 7.5 | 0.5 | 0.5 | 0.15 | 0.15 | 1.02375 | 0.49875 | 1.125 |
| ann-axis:family:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.413002 | 2.50581 | 2.625134 |
| ann-axis:family:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 1.970208 | 2.045985 | 5.775 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | tp4c-trine | direct-wins-collision |

### Year 2021

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 50.9 | balanced | 0.025822 | 0 | 0.025822 | 0.999395 | 7 | 7 | 0 |
| family | available | 54.2 | balanced | 0.116131 | -0.00138 | 0.114751 | 0.994868 | 5 | 5 | 0 |
| wealth | available | 46.7 | guarded | -0.089401 | -0.001076 | -0.090477 | 0.998087 | 7 | 7 | 0 |
| career | available | 49.1 | guarded | -0.025646 | 0 | -0.025646 | 0.997045 | 7 | 7 | 0 |
| social | available | 51.9 | balanced | 0.053556 | 0 | 0.053556 | 0.993633 | 5 | 5 | 1 |
| romance | available | 56.5 | balanced | 0.235511 | 0 | 0.235511 | 0.759693 | 3 | 3 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:annual:mutagen:mutagen:8:Quyền:Thái Dương | mutagen:8:Quyền:Thái Dương | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.3 | 0.3 | 0.105 | 0.075 | 0.3 |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 2.4 | 0.6 | 0.954594 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.965201 | 1.002324 | 2.31 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | direct-head-focus | signed-duplicate-same-physical-fact |

#### social — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:social:annual:mutagen:mutagen:4:Khoa:Văn Khúc | mutagen:4:Khoa:Văn Khúc | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 0.397748 | 0 | 0.212132 |
| ann-axis:social:annual:mutagen:mutagen:4:Lộc:Cự Môn | mutagen:4:Lộc:Cự Môn | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:social:natal-activated:star:natal-star:10:Thiên Cơ | natal-star:10:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.825 | 3.325 | 7.5 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 2.955312 | 1.439767 | 5.625 |
| ann-axis:social:natal-activated:star:natal-star:4:Cự Môn | natal-star:4:Cự Môn | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 5.175 | 5.4 | 7.35 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 3.88125 | 4.05 | 3.897926 |
| ann-axis:social:natal-activated:star:natal-star:5:Thiên Tướng | natal-star:5:Thiên Tướng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.875 | 2.375 | 5.5 | 0.7071067811865475 | 0.5773502691896258 | 0.53033 | 0.433013 | 4.176349 | 1.259534 | 2.38157 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:social:natal-activated:star:natal-star:4:Cự Môn | natal-star:4:Cự Môn | tp4c-trine | direct-wins-collision |

### Year 2022

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 51.3 | balanced | 0.034931 | 0 | 0.034931 | 0.999231 | 6 | 6 | 2 |
| family | available | 52 | balanced | 0.056119 | 0 | 0.056119 | 0.989842 | 4 | 4 | 1 |
| wealth | available | 47.5 | guarded | -0.070069 | 0 | -0.070069 | 0.997641 | 7 | 7 | 2 |
| career | available | 49.1 | guarded | -0.025646 | 0 | -0.025646 | 0.997045 | 7 | 7 | 4 |
| social | available | 51.8 | balanced | 0.049509 | 0 | 0.049509 | 0.99145 | 3 | 3 | 0 |
| romance | available | 56.3 | balanced | 0.23989 | 0 | 0.23989 | 0.729055 | 2 | 2 | 1 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 2.4 | 0.6 | 0.954594 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.965201 | 1.002324 | 2.31 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | tp4c-opposite | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:11:Quyền:Tử Vi | mutagen:11:Quyền:Tử Vi | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 0.185616 | 0.132583 | 0.75 |
| ann-axis:health:annual:mutagen:mutagen:6:Lộc:Thiên Lương | mutagen:6:Lộc:Thiên Lương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0.75 | 0 | 0.371231 |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | major-fortune | direct-exact-target | direct | Y | Y | 7.5 | 2.55 | 4.95 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 3.977476 | 1.352342 | 3.7125 |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | major-fortune | direct-exact-target | direct | Y | Y | 8.625 | 2.25 | 4.725 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 6.46875 | 1.6875 | 2.50581 |
| ann-axis:health:natal-activated:star:natal-star:11:Phá Quân | natal-star:11:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.6 | 6.3 | 9.45 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 2.439518 | 3.34108 | 7.0875 |
| ann-axis:health:natal-activated:star:natal-star:11:Tử Vi | natal-star:11:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 7.03125 | 1.59375 | 3.500179 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | context-only | activation-duplicate-same-physical-fact |
| ann-axis:health:major-fortune:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | context-only | activation-duplicate-same-physical-fact |
| ann-axis:health:natal-activated:star:natal-star:11:Phá Quân | natal-star:11:Phá Quân | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:11:Tử Vi | natal-star:11:Tử Vi | tp4c-trine | direct-wins-collision |

### Year 2023

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 51.3 | balanced | 0.034986 | 0 | 0.034986 | 0.999377 | 7 | 7 | 0 |
| family | available | 52.1 | balanced | 0.05801 | 0 | 0.05801 | 0.990991 | 5 | 5 | 2 |
| wealth | available | 47.6 | guarded | -0.065949 | 0 | -0.065949 | 0.997929 | 9 | 9 | 1 |
| career | available | 48.5 | guarded | -0.041356 | 0 | -0.041356 | 0.997057 | 8 | 8 | 0 |
| social | available | 51.5 | balanced | 0.041289 | 0 | 0.041289 | 0.983579 | 3 | 3 | 1 |
| romance | available | 56.3 | balanced | 0.23989 | 0 | 0.23989 | 0.729055 | 2 | 2 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 2.4 | 0.6 | 0.954594 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.965201 | 1.002324 | 2.31 |

#### family — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:annual:mutagen:mutagen:2:Khoa:Thái Âm | mutagen:2:Khoa:Thái Âm | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:family:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.5773502691896258 | 0.75 | 0.433013 | 6 | 1.5 | 1.948557 |
| ann-axis:family:natal-activated:star:natal-star:10:Thiên Cơ | natal-star:10:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.825 | 3.325 | 7.5 | 0.5 | 0.5 | 0.15 | 0.15 | 1.02375 | 0.49875 | 1.125 |
| ann-axis:family:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.413002 | 2.50581 | 2.625134 |
| ann-axis:family:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 1.970208 | 2.045985 | 5.775 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:star:natal-star:10:Thiên Cơ | natal-star:10:Thiên Cơ | tp4c-trine | direct-wins-collision |
| ann-axis:family:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | tp4c-trine | direct-wins-collision |

### Year 2024

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 53.3 | balanced | 0.091093 | 0 | 0.091093 | 0.992054 | 4 | 4 | 3 |
| family | available | 51.4 | balanced | 0.03914 | 0 | 0.03914 | 0.992009 | 5 | 5 | 1 |
| wealth | available | 48.2 | guarded | -0.05036 | 0 | -0.05036 | 0.998029 | 9 | 9 | 0 |
| career | available | 49.7 | guarded | -0.006986 | 0 | -0.006986 | 0.998472 | 9 | 9 | 3 |
| social | available | 51.4 | balanced | 0.038926 | 0 | 0.038926 | 0.995743 | 3 | 3 | 0 |
| romance | available | 55.1 | balanced | 0.186276 | 0 | 0.186276 | 0.753856 | 3 | 3 | 1 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:annual:mutagen:mutagen:8:Kỵ:Thái Dương | mutagen:8:Kỵ:Thái Dương | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.3 | 0.3 | 0 | 0.3 | 0.24 |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 2.4 | 0.6 | 0.954594 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.965201 | 1.002324 | 2.31 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | tp4c-trine | direct-wins-collision |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:11:Quyền:Phá Quân | mutagen:11:Quyền:Phá Quân | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:health:natal-activated:mutagen:mutagen:11:Quyền:Tử Vi | mutagen:11:Quyền:Tử Vi | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 1 | 1 | 0.75 | 0.75 | 0.2625 | 0.1875 | 0.75 |
| ann-axis:health:natal-activated:star:natal-star:11:Phá Quân | natal-star:11:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.6 | 6.3 | 9.45 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 2.439518 | 3.34108 | 7.0875 |
| ann-axis:health:natal-activated:star:natal-star:11:Tử Vi | natal-star:11:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 7.03125 | 1.59375 | 3.500179 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:11:Quyền:Tử Vi | mutagen:11:Quyền:Tử Vi | tp4c-opposite | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:11:Phá Quân | natal-star:11:Phá Quân | tp4c-opposite | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:11:Tử Vi | natal-star:11:Tử Vi | tp4c-opposite | direct-wins-collision |

### Year 2025

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 51.9 | balanced | 0.051188 | 0 | 0.051188 | 0.998686 | 8 | 8 | 0 |
| family | available | 51.4 | balanced | 0.039904 | 0 | 0.039904 | 0.99247 | 6 | 6 | 0 |
| wealth | available | 42.3 | guarded | -0.189175 | -0.023683 | -0.212857 | 0.995794 | 8 | 8 | 3 |
| career | available | 49.6 | guarded | -0.01089 | 0 | -0.01089 | 0.998044 | 8 | 8 | 4 |
| social | available | 51.5 | balanced | 0.040019 | 0 | 0.040019 | 0.996549 | 4 | 4 | 1 |
| romance | available | 56.3 | balanced | 0.23989 | 0 | 0.23989 | 0.729055 | 2 | 2 | 0 |

#### wealth — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Kỵ:Thái Âm | mutagen:2:Kỵ:Thái Âm | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.3 | 0.3 | 0 | 0.3 | 0.24 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.3 | 0.3 | 0.225 | 0 | 0.12 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:7:Kỵ:Vũ Khúc | mutagen:7:Kỵ:Vũ Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | tp4c-trine | tp4c | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.525 | 0.525 | 0 | 0.525 | 0.42 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.788083 | 0.818394 | 0.857365 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0.8775 | 2.43 | 1.633417 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.575 | 6.75 | 8.8 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.758372 | 1.431891 | 2.64 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thất Sát | natal-star:7:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.525 | 0.525 | 1.535625 | 4.606875 | 4.90875 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Vũ Khúc | natal-star:7:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 4.225 | 6.075 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.371231 | 0.371231 | 1.568451 | 2.255229 | 2.858479 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | tp4c-trine | direct-wins-collision |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Kỵ:Thái Âm | mutagen:2:Kỵ:Thái Âm | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.3 | 0.3 | 0 | 0.3 | 0.24 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.3 | 0.3 | 0.225 | 0 | 0.12 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:7:Kỵ:Vũ Khúc | mutagen:7:Kỵ:Vũ Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | tp4c-trine | tp4c | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.525 | 0.525 | 0 | 0.525 | 0.42 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.5773502691896258 | 0.5773502691896258 | 0.173205 | 0.173205 | 0.788083 | 0.818394 | 0.857365 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 0.8775 | 2.43 | 1.633417 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.575 | 6.75 | 8.8 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.758372 | 1.431891 | 2.64 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thất Sát | natal-star:7:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.525 | 0.525 | 1.535625 | 4.606875 | 4.90875 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Vũ Khúc | natal-star:7:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 4.225 | 6.075 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.371231 | 0.371231 | 1.568451 | 2.255229 | 2.858479 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | tp4c-trine | direct-wins-collision |

### Year 2026

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 52 | balanced | 0.054129 | 0 | 0.054129 | 0.998562 | 8 | 8 | 3 |
| family | available | 54.3 | balanced | 0.121145 | -0.001388 | 0.119757 | 0.99087 | 5 | 5 | 0 |
| wealth | available | 47.4 | guarded | -0.07051 | 0 | -0.07051 | 0.997857 | 8 | 8 | 0 |
| career | available | 49.5 | guarded | -0.014828 | 0 | -0.014828 | 0.998386 | 8 | 8 | 0 |
| social | available | 51.3 | balanced | 0.036229 | 0 | 0.036229 | 0.996846 | 4 | 4 | 1 |
| romance | available | 59.1 | balanced | 0.363361 | -0.000996 | 0.362366 | 0.694804 | 2 | 2 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 1 | 0.3 | 0.3 | 2.4 | 0.6 | 1.35 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | tp4c-trine | tp4c | Y | Y | 4.55 | 4.725 | 7.7 | 1 | 1 | 0.21 | 0.21 | 0.9555 | 0.99225 | 1.617 |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:6:Khoa:Văn Xương | mutagen:6:Khoa:Văn Xương | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 0.397748 | 0 | 0.212132 |
| ann-axis:health:annual:mutagen:mutagen:6:Lộc:Thiên Đồng | mutagen:6:Lộc:Thiên Đồng | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:health:natal-activated:mutagen:mutagen:11:Quyền:Tử Vi | mutagen:11:Quyền:Tử Vi | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 0.185616 | 0.132583 | 0.75 |
| ann-axis:health:natal-activated:mutagen:mutagen:6:Lộc:Thiên Lương | mutagen:6:Lộc:Thiên Lương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0.75 | 0 | 0.371231 |
| ann-axis:health:natal-activated:star:natal-star:11:Phá Quân | natal-star:11:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.6 | 6.3 | 9.45 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 2.439518 | 3.34108 | 7.0875 |
| ann-axis:health:natal-activated:star:natal-star:11:Tử Vi | natal-star:11:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 7.03125 | 1.59375 | 3.500179 |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.55 | 4.95 | 0.5 | 0.5773502691896258 | 0.375 | 0.433013 | 2.8125 | 0.95625 | 2.143413 |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.625 | 2.25 | 4.725 | 0.5773502691896258 | 0.5 | 0.433013 | 0.375 | 3.734735 | 0.974279 | 1.771875 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:6:Lộc:Thiên Lương | mutagen:6:Lộc:Thiên Lương | tp4c-opposite | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | tp4c-opposite | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | tp4c-opposite | direct-wins-collision |

### Year 2027

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 51.8 | balanced | 0.049897 | 0 | 0.049897 | 0.998569 | 7 | 7 | 0 |
| family | available | 54.6 | balanced | 0.130512 | 0 | 0.130512 | 0.959366 | 5 | 5 | 0 |
| wealth | available | 47.8 | guarded | -0.061704 | 0 | -0.061704 | 0.997831 | 8 | 8 | 6 |
| career | available | 49.5 | guarded | -0.012692 | 0 | -0.012692 | 0.997948 | 7 | 7 | 4 |
| social | available | 51 | balanced | 0.028364 | 0 | 0.028364 | 0.996924 | 5 | 5 | 1 |
| romance | available | 55.5 | balanced | 0.363361 | 0 | 0.363361 | 0.417252 | 1 | 1 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 1 | 0.3 | 0.3 | 2.4 | 0.6 | 1.35 |

#### wealth — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:wealth:annual:mutagen:mutagen:2:Lộc:Thái Âm | mutagen:2:Lộc:Thái Âm | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.3 | 0.3 | 0.3 | 0 | 0.21 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 0.7071067811865475 | 0.7071067811865475 | 0.212132 | 0.212132 | 0.159099 | 0 | 0.084853 |
| ann-axis:wealth:natal-activated:mutagen:mutagen:7:Kỵ:Vũ Khúc | mutagen:7:Kỵ:Vũ Khúc | RULE-AA-MUTAGEN-KY-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0 | 1 | 0.8 | 1 | 1 | 0.75 | 0.75 | 0 | 0.75 | 0.6 |
| ann-axis:wealth:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.4472135954999579 | 0.4472135954999579 | 0.134164 | 0.134164 | 0.610447 | 0.633925 | 0.664112 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.1 | 7.7 | 0.5773502691896258 | 0.5 | 0.173205 | 0.15 | 0.506625 | 1.402961 | 1.155 |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 3.575 | 6.75 | 8.8 | 0.5 | 0.5773502691896258 | 0.15 | 0.173205 | 0.53625 | 1.0125 | 1.524205 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thất Sát | natal-star:7:Thất Sát | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 2.925 | 8.775 | 9.35 | 1 | 1 | 0.75 | 0.75 | 2.19375 | 6.58125 | 7.0125 |
| ann-axis:wealth:natal-activated:star:natal-star:7:Vũ Khúc | natal-star:7:Vũ Khúc | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.225 | 6.075 | 7.7 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.240645 | 3.221755 | 4.083542 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:wealth:natal-activated:mutagen:mutagen:3:Khoa:Tả Phụ | mutagen:3:Khoa:Tả Phụ | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:mutagen:mutagen:7:Kỵ:Vũ Khúc | mutagen:7:Kỵ:Vũ Khúc | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:3:Liêm Trinh | natal-star:3:Liêm Trinh | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:3:Tham Lang | natal-star:3:Tham Lang | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:7:Thất Sát | natal-star:7:Thất Sát | tp4c-trine | direct-wins-collision |
| ann-axis:wealth:natal-activated:star:natal-star:7:Vũ Khúc | natal-star:7:Vũ Khúc | tp4c-trine | direct-wins-collision |

### Year 2028

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 52 | balanced | 0.053753 | 0 | 0.053753 | 0.998069 | 6 | 6 | 3 |
| family | available | 51.7 | balanced | 0.047377 | 0 | 0.047377 | 0.992969 | 6 | 6 | 1 |
| wealth | available | 48.2 | guarded | -0.049127 | 0 | -0.049127 | 0.998169 | 10 | 10 | 1 |
| career | available | 49.7 | guarded | -0.007267 | 0 | -0.007267 | 0.998337 | 8 | 8 | 0 |
| social | available | 51 | balanced | 0.027743 | 0 | 0.027743 | 0.996651 | 4 | 4 | 1 |
| romance | available | 56.3 | balanced | 0.23989 | 0 | 0.23989 | 0.729055 | 2 | 2 | 0 |

#### romance — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:romance:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.7071067811865475 | 0.3 | 0.212132 | 2.4 | 0.6 | 0.954594 |
| ann-axis:romance:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.7071067811865475 | 1 | 0.212132 | 0.3 | 0.965201 | 1.002324 | 2.31 |

#### health — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:11:Quyền:Tử Vi | mutagen:11:Quyền:Tử Vi | RULE-AA-MUTAGEN-QUYEN-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 0.35 | 0.25 | 1 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 0.185616 | 0.132583 | 0.75 |
| ann-axis:health:natal-activated:mutagen:mutagen:6:Lộc:Thiên Lương | mutagen:6:Lộc:Thiên Lương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 0.75 | 0 | 0.371231 |
| ann-axis:health:natal-activated:star:natal-star:11:Phá Quân | natal-star:11:Phá Quân | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.6 | 6.3 | 9.45 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 2.439518 | 3.34108 | 7.0875 |
| ann-axis:health:natal-activated:star:natal-star:11:Tử Vi | natal-star:11:Tử Vi | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 9.375 | 2.125 | 6.6 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 7.03125 | 1.59375 | 3.500179 |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.55 | 4.95 | 0.5 | 0.5773502691896258 | 0.375 | 0.433013 | 2.8125 | 0.95625 | 2.143413 |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.625 | 2.25 | 4.725 | 0.5773502691896258 | 0.5 | 0.433013 | 0.375 | 3.734735 | 0.974279 | 1.771875 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:health:natal-activated:mutagen:mutagen:6:Lộc:Thiên Lương | mutagen:6:Lộc:Thiên Lương | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | tp4c-trine | direct-wins-collision |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | tp4c-trine | direct-wins-collision |

### Year 2029

| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health | available | 58.8 | balanced | 0.258632 | 0 | 0.258632 | 0.940234 | 4 | 4 | 0 |
| family | available | 52 | balanced | 0.056119 | 0 | 0.056119 | 0.989842 | 4 | 4 | 1 |
| wealth | available | 48.2 | guarded | -0.049375 | 0 | -0.049375 | 0.998244 | 9 | 9 | 3 |
| career | available | 48.7 | guarded | -0.035782 | 0 | -0.035782 | 0.995268 | 5 | 5 | 4 |
| social | available | 51 | balanced | 0.027743 | 0 | 0.027743 | 0.996651 | 4 | 4 | 1 |
| romance | available | 56.3 | balanced | 0.23989 | 0 | 0.23989 | 0.729055 | 2 | 2 | 1 |

#### health — largest-score-departure (|score-50|)

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:health:annual:mutagen:mutagen:6:Khoa:Thiên Lương | mutagen:6:Khoa:Thiên Lương | RULE-AA-MUTAGEN-KHOA-V0 | SRC-AA-ENG-004 | annual | direct-exact-target | direct | Y | Y | 0.75 | 0 | 0.4 | 1 | 1 | 0.75 | 0.75 | 0.5625 | 0 | 0.3 |
| ann-axis:health:natal-activated:mutagen:mutagen:6:Lộc:Thiên Lương | mutagen:6:Lộc:Thiên Lương | RULE-AA-MUTAGEN-LOC-V0 | SRC-AA-ENG-004 | natal-activated | direct-exact-target | direct | Y | Y | 1 | 0 | 0.7 | 1 | 1 | 0.75 | 0.75 | 0.75 | 0 | 0.525 |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Đồng | natal-star:6:Thiên Đồng | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 7.5 | 2.55 | 4.95 | 0.7071067811865475 | 1 | 0.53033 | 0.75 | 3.977476 | 1.352342 | 3.7125 |
| ann-axis:health:natal-activated:star:natal-star:6:Thiên Lương | natal-star:6:Thiên Lương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8.625 | 2.25 | 4.725 | 1 | 0.7071067811865475 | 0.75 | 0.53033 | 6.46875 | 1.6875 | 2.50581 |

#### family — direct/TP4C collision

Retained evidence:

| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ann-axis:family:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 8 | 2 | 4.5 | 1 | 0.5773502691896258 | 0.75 | 0.433013 | 6 | 1.5 | 1.948557 |
| ann-axis:family:natal-activated:star:natal-star:10:Thiên Cơ | natal-star:10:Thiên Cơ | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 6.825 | 3.325 | 7.5 | 0.5 | 0.5 | 0.15 | 0.15 | 1.02375 | 0.49875 | 1.125 |
| ann-axis:family:natal-activated:star:natal-star:2:Thái Âm | natal-star:2:Thái Âm | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 4.95 | 0.7071067811865475 | 0.7071067811865475 | 0.53033 | 0.53033 | 2.413002 | 2.50581 | 2.625134 |
| ann-axis:family:natal-activated:star:natal-star:8:Thái Dương | natal-star:8:Thái Dương | RULE-AA-STAR-MAJOR-CANONICAL-V0 | src-heuristic-palace-overview-v1 | natal-activated | direct-exact-target | direct | Y | Y | 4.55 | 4.725 | 7.7 | 0.5773502691896258 | 1 | 0.433013 | 0.75 | 1.970208 | 2.045985 | 5.775 |

Rejected paths:

| id | physicalFactId | geoClass | rejectedPathReason |
| --- | --- | --- | --- |
| ann-axis:family:natal-activated:star:natal-star:1:Thiên Phủ | natal-star:1:Thiên Phủ | tp4c-trine | direct-wins-collision |

## Notes

- `sigDim`/`actDim` are the separate signed and activation diminishing
  factors; `sigApplied`/`actApplied` are the full applied factors.
- Signed aggregates reconstruct as Σ weighted support/pressure over
  signed-retained direct (or tp4c) rows; activationRaw reconstructs as
  Σ weighted activation over activation-retained rows.
- No hidden post-processing of scores.
