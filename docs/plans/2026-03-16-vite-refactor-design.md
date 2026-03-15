# index.html → Vite + 모듈 분리 설계

## 목표
1105줄짜리 `index.html` 한 파일을 Vite 기반 멀티파일 구조로 분리한다.
코드 동작은 그대로 유지하고, 유지보수성만 개선한다.

## 선택한 방법
- **빌드 도구**: Vite (바닐라 JS, 프레임워크 없음)
- **분리 방식**: 기능별 분리 (방법 2)

## 최종 구조

```
Trace/
├── index.html          ← HTML 뼈대만 (~20줄)
├── style.css           ← 모든 CSS
├── src/
│   ├── data.js         ← FILMS 배열 + films_embedded.json fetch
│   ├── scene.js        ← Three.js 씬, 파티클, 블룸 효과
│   ├── ui.js           ← 사이드패널, 필터버튼, 검색창, 툴팁
│   └── main.js         ← 진입점, 모듈 초기화 및 연결
├── vite.config.js
├── package.json
└── ...
```

## 각 파일 역할

| 파일 | 역할 | 예상 줄 수 |
|------|------|-----------|
| `index.html` | canvas, div 뼈대 + script 태그 | ~20줄 |
| `style.css` | 현재 style 블록 그대로 이동 | ~300줄 |
| `src/data.js` | FILMS 배열, films_embedded.json fetch | ~현재 데이터 부분 |
| `src/scene.js` | Three.js, 카메라, 파티클, 블룸 | ~400줄 |
| `src/ui.js` | UI 인터랙션 전체 | ~200줄 |
| `src/main.js` | import, 초기화 | ~50줄 |

## 배포
- Vercel 빌드 커맨드: `npm run build`
- Output 폴더: `dist/`
- 현재와 동일하게 동작, URL 변경 없음

## 제약
- 코드 로직 변경 없음 (리팩토링 아님, 파일 이동만)
- Three.js는 CDN → npm 패키지로 전환
