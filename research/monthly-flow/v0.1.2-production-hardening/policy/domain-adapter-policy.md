# Monthly Flow domain-adapter policy (V0.1.2)

- Nam Phái: `selectResolver("nam-phai")` → natal-palace-name / nam-phai-natal-domain-anchor
- Trung Châu: `selectResolver("trung-chau")` → annual-palace-name / trung-chau-annual-palace-name
- Focus palace per domain: highest anchor weight; ties break by palaceIndex ascending
- Fail closed on incomplete / duplicate / missing anchors / focus mismatch
- Never consume Annual Axes or Major Fortune scores
